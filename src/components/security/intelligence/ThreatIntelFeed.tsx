import React, { useState } from 'react';
import { useThreatIntelligence, ThreatItem } from '@/hooks/security/useThreatIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Radio, ExternalLink, MapPin, Clock, ShieldAlert, Target, AlertTriangle, Crosshair } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SEV_COLORS: Record<string, string> = {
  critica: 'bg-red-500/15 text-red-400 border-red-500/30',
  crítica: 'bg-red-500/15 text-red-400 border-red-500/30',
  alta: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  media: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  baja: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const RELEVANCE_COLORS: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  low: 'bg-muted text-muted-foreground',
};

function relevanceLabel(score: number) {
  if (score >= 60) return { label: 'Alta', key: 'high' };
  if (score >= 30) return { label: 'Media', key: 'medium' };
  return { label: 'Baja', key: 'low' };
}

export function ThreatIntelFeed() {
  const { data: threats, isLoading } = useThreatIntelligence(200);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterRelevance, setFilterRelevance] = useState<string>('all');

  const filtered = (threats || []).filter((t) => {
    if (filterSeverity !== 'all' && t.severidad.toLowerCase() !== filterSeverity) return false;
    if (filterRelevance !== 'all') {
      const r = relevanceLabel(t.relevanceScore).key;
      if (r !== filterRelevance) return false;
    }
    return true;
  });

  const highRelevanceCount = (threats || []).filter(t => t.relevanceScore >= 60).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      {highRelevanceCount > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {highRelevanceCount} amenaza{highRelevanceCount > 1 ? 's' : ''} de alta relevancia
              </p>
              <p className="text-xs text-muted-foreground">
                Incidentes RRSS cerca de zonas con servicios activos en los últimos 7 días
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRelevance} onValueChange={setFilterRelevance}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Relevancia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda relevancia</SelectItem>
            <SelectItem value="high">Alta relevancia</SelectItem>
            <SelectItem value="medium">Media relevancia</SelectItem>
            <SelectItem value="low">Baja relevancia</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} de {threats?.length || 0} incidentes
        </span>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-muted-foreground/25">
          <div className="text-center text-muted-foreground">
            <Radio className="h-8 w-8 mx-auto mb-1 opacity-30" />
            <p className="text-xs">Sin incidentes RRSS registrados</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-auto pr-1">
          {filtered.map((t) => (
            <ThreatCard key={t.id} threat={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreatCard({ threat: t }: { threat: ThreatItem }) {
  const rel = relevanceLabel(t.relevanceScore);

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Relevance indicator */}
          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${RELEVANCE_COLORS[rel.key]}`}>
              {t.relevanceScore}
            </div>
            <span className="text-[9px] text-muted-foreground">{rel.label}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SEV_COLORS[t.severidad.toLowerCase()] || ''}`}>
                {t.severidad}
              </Badge>
              <span className="text-xs font-medium text-foreground">{t.tipoIncidente}</span>
              {t.subtipo && <span className="text-[10px] text-muted-foreground">· {t.subtipo}</span>}
              <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
                {t.redSocial}
              </Badge>
            </div>

            {t.resumenAi ? (
              <p className="text-xs text-foreground/80 line-clamp-2">{t.resumenAi}</p>
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-2 italic">{t.textoOriginal.slice(0, 200)}</p>
            )}

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
              {t.ubicacion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t.ubicacion}
                </span>
              )}
              {t.carretera && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {t.carretera}
                </span>
              )}
              {t.fechaPublicacion && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(t.fechaPublicacion), { addSuffix: true, locale: es })}
                </span>
              )}
              {t.armasMencionadas && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                  <Crosshair className="h-2.5 w-2.5 mr-0.5" />
                  Armas
                </Badge>
              )}
              {t.urlPublicacion && (
                <a href={t.urlPublicacion} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  Fuente
                </a>
              )}
            </div>

            {/* Relevance factors */}
            {t.relevanceFactors.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {t.relevanceFactors.map((f, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
