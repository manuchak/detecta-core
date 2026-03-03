import React, { useState, useMemo, useCallback } from 'react';
import { HIGHWAY_SEGMENTS, type HighwaySegment } from '@/lib/security/highwaySegments';
import { useSegmentGeometries } from '@/hooks/security/useSegmentGeometries';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type AuditStatus = 'ERROR' | 'WARN' | 'OK' | 'NO_DATA';
type FilterStatus = AuditStatus | 'ALL';

interface AuditRow {
  segment: HighwaySegment;
  expectedKm: number;
  mapboxKm: number | null;
  ratio: number | null;
  status: AuditStatus;
}

const STATUS_CONFIG: Record<AuditStatus, { color: string; icon: React.ReactNode; label: string }> = {
  ERROR: { color: 'text-destructive', icon: <AlertTriangle className="h-3 w-3" />, label: 'ERROR' },
  WARN: { color: 'text-yellow-600', icon: <AlertCircle className="h-3 w-3" />, label: 'WARN' },
  OK: { color: 'text-green-600', icon: <CheckCircle className="h-3 w-3" />, label: 'OK' },
  NO_DATA: { color: 'text-muted-foreground', icon: <AlertCircle className="h-3 w-3" />, label: 'SIN DATOS' },
};

export const SegmentAuditor: React.FC = () => {
  const { data: geometries, isLoading } = useSegmentGeometries();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enriching, setEnriching] = useState<Set<string>>(new Set());

  const rows = useMemo<AuditRow[]>(() => {
    return HIGHWAY_SEGMENTS.map(seg => {
      const expectedKm = seg.kmEnd - seg.kmStart;
      const geo = geometries?.[seg.id];
      const mapboxKm = geo?.distance_km ?? null;
      let ratio: number | null = null;
      let status: AuditStatus = 'NO_DATA';

      if (mapboxKm !== null && expectedKm > 0) {
        ratio = mapboxKm / expectedKm;
        if (ratio > 2.0) status = 'ERROR';
        else if (ratio > 1.5) status = 'WARN';
        else status = 'OK';
      }

      return { segment: seg, expectedKm, mapboxKm, ratio, status };
    }).sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
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
    const segments = segmentIds.map(id => {
      const seg = HIGHWAY_SEGMENTS.find(s => s.id === id);
      if (!seg) return null;
      return { id: seg.id, waypoints: seg.waypoints };
    }).filter(Boolean);

    if (!segments.length) return;

    // Process in batches of 10
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
        toast.success(`Batch ${Math.ceil((i + 1) / batchSize)}: ${batch.length} segmentos procesados`);
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

    // Invalidate cache so Rutas y Zonas updates
    queryClient.invalidateQueries({ queryKey: ['segment-geometries'] });
    toast.success(`✅ ${processed} segmentos re-enriquecidos. Rutas y Zonas se actualizará.`);
  }, [queryClient]);

  const handleEnrichSelected = () => {
    if (selected.size === 0) return toast.warning('Selecciona al menos un segmento');
    enrichSegments(Array.from(selected));
    setSelected(new Set());
  };

  const handleEnrichAllErrors = () => {
    const errorIds = rows.filter(r => r.status === 'ERROR').map(r => r.segment.id);
    if (!errorIds.length) return toast.info('No hay segmentos con ERROR');
    enrichSegments(errorIds);
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
            <h3 className="text-xs font-bold">🔍 Auditoría de Segmentos</h3>
            <p className="text-[10px] text-muted-foreground">
              Compara km esperados vs Mapbox — {counts.ALL} segmentos
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={handleEnrichSelected} disabled={selected.size === 0 || enriching.size > 0}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-enriquecer ({selected.size})
            </Button>
            <Button size="sm" variant="destructive" className="text-[10px] h-6 px-2" onClick={handleEnrichAllErrors} disabled={enriching.size > 0 || !counts.ERROR}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Fix ERROR ({counts.ERROR || 0})
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 flex-wrap">
          {(['ALL', 'ERROR', 'WARN', 'OK', 'NO_DATA'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {f === 'ALL' ? 'TODOS' : f} ({counts[f] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-[600px]">
          {/* Table header */}
          <div className="grid grid-cols-[28px_1fr_70px_70px_60px_60px_40px] gap-1 px-2 py-1 border-b bg-muted/20 text-[9px] font-semibold text-muted-foreground sticky top-0">
            <div className="flex items-center">
              <Checkbox
                checked={selected.size === filtered.length && filtered.length > 0}
                onCheckedChange={toggleSelectAll}
                className="h-3 w-3"
              />
            </div>
            <div>Segmento</div>
            <div className="text-right">Esperado</div>
            <div className="text-right">Mapbox</div>
            <div className="text-right">Ratio</div>
            <div className="text-center">Status</div>
            <div></div>
          </div>

          {filtered.map(row => {
            const isEnriching = enriching.has(row.segment.id);
            const cfg = STATUS_CONFIG[row.status];

            return (
              <div
                key={row.segment.id}
                className="grid grid-cols-[28px_1fr_70px_70px_60px_60px_40px] gap-1 px-2 py-1.5 border-b border-border/50 hover:bg-muted/30 items-center text-[10px]"
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
                <div className="text-right font-mono">{row.expectedKm.toFixed(0)} km</div>
                <div className="text-right font-mono">
                  {row.mapboxKm !== null ? `${row.mapboxKm.toFixed(0)} km` : '—'}
                </div>
                <div className={`text-right font-bold font-mono ${cfg.color}`}>
                  {row.ratio !== null ? `${row.ratio.toFixed(1)}x` : '—'}
                </div>
                <div className="flex justify-center">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 ${cfg.color}`}>
                    {cfg.icon}
                    <span className="ml-0.5">{cfg.label}</span>
                  </Badge>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => enrichSegments([row.segment.id])}
                    disabled={isEnriching}
                  >
                    {isEnriching ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
