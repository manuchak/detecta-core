import React, { useState, useMemo, useCallback, useRef } from 'react';
import { HIGHWAY_SEGMENTS, type HighwaySegment } from '@/lib/security/highwaySegments';
import { useSegmentGeometries } from '@/hooks/security/useSegmentGeometries';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, CheckCircle, AlertCircle, Loader2, Database, Ban } from 'lucide-react';

type AuditStatus = 'GEO_ERROR' | 'DATA_ERROR' | 'WARN' | 'OK' | 'NO_DATA';
type FilterStatus = AuditStatus | 'ALL';
type FixResult = 'corrected' | 'changed_no_effect' | 'no_change';

interface AuditRow {
  segment: HighwaySegment;
  corridorKm: number;
  expectedKm: number;
  mapboxKm: number | null;
  geoRatio: number | null;
  dataRatio: number | null;
  status: AuditStatus;
}

const STATUS_CONFIG: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string; description: string }> = {
  GEO_ERROR: { color: 'text-destructive', icon: <AlertTriangle className="h-3 w-3" />, label: 'GEO', description: 'Geometría Mapbox incorrecta' },
  DATA_ERROR: { color: 'text-orange-500', icon: <Database className="h-3 w-3" />, label: 'DATOS', description: 'Rango km del corredor incorrecto' },
  WARN: { color: 'text-yellow-600', icon: <AlertCircle className="h-3 w-3" />, label: 'WARN', description: 'Revisar' },
  OK: { color: 'text-green-600', icon: <CheckCircle className="h-3 w-3" />, label: 'OK', description: 'Todo bien' },
  NO_DATA: { color: 'text-muted-foreground', icon: <AlertCircle className="h-3 w-3" />, label: 'SIN DATOS', description: 'Sin geometría' },
};

export const SegmentAuditor: React.FC = () => {
  const { data: geometries, isLoading } = useSegmentGeometries();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enriching, setEnriching] = useState<Set<string>>(new Set());
  const [lastFixResults, setLastFixResults] = useState<Record<string, FixResult>>({});
  const fixResultTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = useMemo<AuditRow[]>(() => {
    return HIGHWAY_SEGMENTS.map(seg => {
      const corridorKm = seg.kmEnd - seg.kmStart;
      const expectedKm = seg.expectedRoadKm || corridorKm;
      const geo = geometries?.[seg.id];
      const mapboxKm = geo?.distance_km ?? null;

      let geoRatio: number | null = null;
      let dataRatio: number | null = null;
      let status: AuditStatus = 'NO_DATA';

      if (mapboxKm !== null && expectedKm > 0) {
        geoRatio = mapboxKm / expectedKm;

        // Data ratio: how much the corridor label diverges from expected road distance
        if (seg.expectedRoadKm && corridorKm > 0) {
          dataRatio = seg.expectedRoadKm / corridorKm;
        }

        // Classification logic
        if (geoRatio > 2.0) {
          status = 'GEO_ERROR'; // Mapbox geometry is wrong (bad waypoints)
        } else if (dataRatio !== null && dataRatio > 2.0) {
          status = 'DATA_ERROR'; // Corridor km labels are wrong
        } else if (geoRatio > 1.5 || (dataRatio !== null && dataRatio > 1.5)) {
          status = 'WARN';
        } else {
          status = 'OK';
        }
      }

      return { segment: seg, corridorKm, expectedKm, mapboxKm, geoRatio, dataRatio, status };
    }).sort((a, b) => {
      // Sort: GEO_ERROR first, then DATA_ERROR, then by ratio
      const statusOrder: Record<AuditStatus, number> = { GEO_ERROR: 0, DATA_ERROR: 1, WARN: 2, NO_DATA: 3, OK: 4 };
      const diff = statusOrder[a.status] - statusOrder[b.status];
      if (diff !== 0) return diff;
      return (b.geoRatio ?? 0) - (a.geoRatio ?? 0);
    });
  }, [geometries]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return rows;
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    rows.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [rows]);

  const enrichSegments = useCallback(async (segmentIds: string[]) => {
    // 1. Capture pre-enrichment distances
    const preDistances: Record<string, number | null> = {};
    segmentIds.forEach(id => {
      preDistances[id] = geometries?.[id]?.distance_km ?? null;
    });

    const segments = segmentIds.map(id => {
      const seg = HIGHWAY_SEGMENTS.find(s => s.id === id);
      if (!seg) return null;
      return { id: seg.id, waypoints: seg.waypoints };
    }).filter(Boolean);

    if (!segments.length) return;

    const batchSize = 10;
    let processed = 0;

    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);
      setEnriching(prev => {
        const next = new Set(prev);
        batch.forEach(s => s && next.add(s.id));
        return next;
      });

      try {
        const { data, error } = await supabase.functions.invoke('enrich-segment-geometries', {
          body: { segments: batch },
        });

        if (error) throw error;
        processed += batch.length;
      } catch (err: any) {
        toast.error(`Error en batch: ${err.message}`);
      } finally {
        setEnriching(prev => {
          const next = new Set(prev);
          batch.forEach(s => s && next.delete(s.id));
          return next;
        });
      }
    }

    // 2. Invalidate and wait for fresh data
    await queryClient.invalidateQueries({ queryKey: ['segment-geometries'] });
    // Small delay to let react-query refetch
    await new Promise(r => setTimeout(r, 1500));

    // 3. Get fresh geometries from cache
    const freshGeometries = queryClient.getQueryData<Record<string, { distance_km: number | null }>>(['segment-geometries']) || {};

    // 4. Compare pre vs post
    let corrected = 0;
    let changedNoEffect = 0;
    let noChange = 0;
    const results: Record<string, FixResult> = {};

    segmentIds.forEach(id => {
      const pre = preDistances[id];
      const post = freshGeometries[id]?.distance_km ?? null;
      const seg = HIGHWAY_SEGMENTS.find(s => s.id === id);
      const expectedKm = seg?.expectedRoadKm || (seg ? seg.kmEnd - seg.kmStart : 1);

      if (pre === null || post === null) {
        results[id] = 'no_change';
        noChange++;
      } else if (Math.abs(pre - post) < 0.5) {
        results[id] = 'no_change';
        noChange++;
      } else if (post / expectedKm < 2.0) {
        results[id] = 'corrected';
        corrected++;
      } else {
        results[id] = 'changed_no_effect';
        changedNoEffect++;
      }
    });

    // 5. Show differentiated toast
    if (corrected === processed && corrected > 0) {
      toast.success(`✅ ${corrected} segmentos corregidos exitosamente`);
    } else if (noChange === processed) {
      toast.warning(`⚠️ ${noChange} segmentos sin cambios — los waypoints producen la misma geometría. Requiere corrección manual de waypoints o calibración expectedRoadKm.`, { duration: 8000 });
    } else {
      const parts: string[] = [];
      if (corrected > 0) parts.push(`✅ ${corrected} corregidos`);
      if (changedNoEffect > 0) parts.push(`🟡 ${changedNoEffect} actualizados sin efecto`);
      if (noChange > 0) parts.push(`🟠 ${noChange} sin cambios`);
      toast.info(parts.join(', '), { duration: 6000 });
    }

    // 6. Set temporary visual indicator (5s)
    setLastFixResults(results);
    if (fixResultTimeout.current) clearTimeout(fixResultTimeout.current);
    fixResultTimeout.current = setTimeout(() => setLastFixResults({}), 5000);
  }, [queryClient, geometries]);

  const handleEnrichSelected = () => {
    if (selected.size === 0) return toast.warning('Selecciona al menos un segmento');
    enrichSegments(Array.from(selected));
    setSelected(new Set());
  };

  const handleEnrichGeoErrors = () => {
    const geoErrorIds = rows.filter(r => r.status === 'GEO_ERROR').map(r => r.segment.id);
    if (!geoErrorIds.length) return toast.info('No hay segmentos con GEO_ERROR');
    enrichSegments(geoErrorIds);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.segment.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando geometrías...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold">🔍 Auditoría de Segmentos (Doble Clasificación)</h3>
            <p className="text-[10px] text-muted-foreground">
              GEO = geometría mal | DATOS = rango km mal — {counts.ALL} segmentos
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={handleEnrichSelected} disabled={selected.size === 0 || enriching.size > 0}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-enriquecer ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-[10px] h-6 px-2"
              onClick={handleEnrichGeoErrors}
              disabled={enriching.size > 0 || !counts.GEO_ERROR}
              title="Solo re-enriquece errores de geometría (waypoints incorrectos)"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Fix GEO ({counts.GEO_ERROR || 0})
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 flex-wrap">
          {(['ALL', 'GEO_ERROR', 'DATA_ERROR', 'WARN', 'OK', 'NO_DATA'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {f === 'ALL' ? 'TODOS' : f === 'GEO_ERROR' ? '🔴 GEO' : f === 'DATA_ERROR' ? '🟠 DATOS' : f} ({counts[f] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-[700px]">
          {/* Table header */}
          <div className="grid grid-cols-[28px_1fr_65px_65px_65px_55px_70px_36px] gap-1 px-2 py-1 border-b bg-muted/20 text-[9px] font-semibold text-muted-foreground sticky top-0">
            <div className="flex items-center">
              <Checkbox
                checked={selected.size === filtered.length && filtered.length > 0}
                onCheckedChange={toggleSelectAll}
                className="h-3 w-3"
              />
            </div>
            <div>Segmento</div>
            <div className="text-right">Corredor</div>
            <div className="text-right">Dist. Real</div>
            <div className="text-right">Mapbox</div>
            <div className="text-right">Ratio</div>
            <div className="text-center">Status</div>
            <div></div>
          </div>

          {filtered.map(row => {
            const isEnriching = enriching.has(row.segment.id);
            const cfg = STATUS_CONFIG[row.status];
            const hasOverride = !!row.segment.expectedRoadKm;

            return (
              <div
                key={row.segment.id}
                className="grid grid-cols-[28px_1fr_65px_65px_65px_55px_70px_36px] gap-1 px-2 py-1.5 border-b border-border/50 hover:bg-muted/30 items-center text-[10px]"
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={selected.has(row.segment.id)}
                    onCheckedChange={() => toggleSelect(row.segment.id)}
                    className="h-3 w-3"
                  />
                </div>
                <div className="truncate">
                  <span className="font-mono text-[9px] text-muted-foreground">{row.segment.id}</span>
                  <br />
                  <span className="text-foreground">{row.segment.name}</span>
                </div>
                <div className="text-right font-mono text-muted-foreground">
                  {row.corridorKm.toFixed(0)} km
                </div>
                <div className={`text-right font-mono ${hasOverride ? 'text-blue-500 font-semibold' : 'text-muted-foreground'}`}>
                  {hasOverride ? `${row.expectedKm.toFixed(0)} km` : '—'}
                </div>
                <div className="text-right font-mono">
                  {row.mapboxKm !== null ? `${row.mapboxKm.toFixed(0)} km` : '—'}
                </div>
                <div className={`text-right font-bold font-mono ${cfg.color}`}>
                  {row.geoRatio !== null ? `${row.geoRatio.toFixed(1)}x` : '—'}
                </div>
                <div className="flex justify-center gap-0.5">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 ${cfg.color}`} title={cfg.description}>
                    {cfg.icon}
                    <span className="ml-0.5">{cfg.label}</span>
                  </Badge>
                  {lastFixResults[row.segment.id] === 'no_change' && (
                    <span className="text-orange-500 animate-pulse" title="Sin cambios tras re-enriquecer">
                      <Ban className="h-3 w-3" />
                    </span>
                  )}
                  {lastFixResults[row.segment.id] === 'corrected' && (
                    <span className="text-green-500 animate-pulse" title="¡Corregido!">
                      <CheckCircle className="h-3 w-3" />
                    </span>
                  )}
                  {lastFixResults[row.segment.id] === 'changed_no_effect' && (
                    <span className="text-yellow-500 animate-pulse" title="Actualizado sin efecto">
                      <AlertCircle className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div>
                  {row.status !== 'DATA_ERROR' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={() => enrichSegments([row.segment.id])}
                      disabled={isEnriching}
                      title="Re-enriquecer"
                    >
                      {isEnriching ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
