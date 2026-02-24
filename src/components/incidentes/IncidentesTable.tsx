import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, ChevronRight, ExternalLink, MapPin, 
  AlertTriangle, Shield, Crosshair, Target, Eye, MapPinned, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncidenteRRSS } from '@/hooks/useIncidentesRRSS';

interface IncidentesTableProps {
  data: IncidenteRRSS[];
  loading: boolean;
}

const SEVERIDAD_COLORS: Record<string, string> = {
  critica: 'bg-red-500 hover:bg-red-600',
  alta: 'bg-orange-500 hover:bg-orange-600',
  media: 'bg-yellow-500 hover:bg-yellow-600 text-black',
  baja: 'bg-green-500 hover:bg-green-600',
};

const RED_SOCIAL_ICONS: Record<string, string> = {
  twitter: '𝕏',
  facebook: 'f',
};

const NIVEL_ORG_CONFIG: Record<string, { color: string; label: string }> = {
  crimen_organizado: { color: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Crimen Organizado' },
  celula_local: { color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', label: 'Célula Local' },
  oportunista: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Oportunista' },
  no_determinado: { color: 'bg-muted text-muted-foreground border-border', label: 'No Determinado' },
};

const ZONA_TIPO_LABELS: Record<string, string> = {
  urbana: '🏙️ Urbana',
  periurbana: '🏘️ Periurbana',
  rural: '🌾 Rural',
  carretera_abierta: '🛣️ Carretera Abierta',
  punto_critico: '⚠️ Punto Crítico',
};

/**
 * Sanitiza texto scrapeado eliminando basura de navegación web
 */
function sanitizarTexto(texto: string): string {
  return texto
    // Eliminar markdown links [text](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Eliminar URLs sueltas
    .replace(/https?:\/\/[^\s]+/g, '')
    // Eliminar controles de fuente tipo Aa+Aa-
    .replace(/Aa[\+\-]\s*/g, '')
    // Eliminar breadcrumbs numerados (1. Inicio 2. ...)
    .replace(/^\d+\.\s*(Inicio|Home|Principal)\s*/gmi, '')
    // Eliminar pipes de navegación
    .replace(/\|\s*(Inicio|Home|Contacto|Nosotros|Menu|Menú)\s*/gi, '')
    // Eliminar exceso de whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getRelevanciaConfig(score: number | null) {
  if (score == null) return { color: 'bg-muted text-muted-foreground', label: 'N/A' };
  if (score >= 75) return { color: 'bg-emerald-500/15 text-emerald-400', label: `${score}` };
  if (score >= 50) return { color: 'bg-yellow-500/15 text-yellow-600', label: `${score}` };
  if (score >= 40) return { color: 'bg-orange-500/15 text-orange-400', label: `${score}` };
  return { color: 'bg-red-500/15 text-red-400', label: `${score}` };
}

function DetailField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm text-foreground leading-snug">{value}</p>
      </div>
    </div>
  );
}

export function IncidentesTable({ data, loading }: IncidentesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFullText, setShowFullText] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleFullText = (id: string) => {
    const n = new Set(showFullText);
    if (n.has(id)) n.delete(id); else n.add(id);
    setShowFullText(n);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No se encontraron incidentes con los filtros seleccionados</p>
        <p className="text-sm mt-2">Prueba a ejecutar una búsqueda o ajustar los filtros</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Red</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Severidad</TableHead>
            <TableHead>Relevancia</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Resumen AI</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((incidente) => {
            const relConfig = getRelevanciaConfig(incidente.relevancia_score);
            const textoLimpio = incidente.texto_original ? sanitizarTexto(incidente.texto_original) : '';
            const textoTruncado = textoLimpio.length > 500 ? textoLimpio.substring(0, 500) + '...' : textoLimpio;
            const nivelOrg = NIVEL_ORG_CONFIG[incidente.nivel_organizacion || 'no_determinado'] || NIVEL_ORG_CONFIG.no_determinado;

            return (
              <Collapsible key={incidente.id} asChild>
                <>
                    <TableRow className={`cursor-pointer hover:bg-muted/50 ${
                      incidente.severidad === 'critica' ? 'bg-destructive/5 hover:bg-destructive/10' :
                      incidente.severidad === 'alta' ? 'bg-warning/5 hover:bg-warning/10' : ''
                    }`}>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => toggleRow(incidente.id)}>
                          {expandedRows.has(incidente.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">
                      {incidente.fecha_publicacion
                        ? format(new Date(incidente.fecha_publicacion), 'dd MMM yyyy HH:mm', { locale: es })
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {RED_SOCIAL_ICONS[incidente.red_social] || incidente.red_social}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {incidente.tipo_incidente?.replace(/_/g, ' ') || 'Sin clasificar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {incidente.severidad && (
                        <Badge className={SEVERIDAD_COLORS[incidente.severidad] || ''}>
                          {incidente.severidad}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge className={`${relConfig.color} border text-xs`}>
                          {relConfig.label}
                        </Badge>
                        {incidente.relevancia_score != null && incidente.relevancia_score < 40 && (
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(incidente.municipio || incidente.carretera) && (
                          <>
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {[incidente.municipio, incidente.carretera].filter(Boolean).join(', ')}
                            </span>
                          </>
                        )}
                        {incidente.coordenadas_lat && (
                          <Badge variant="outline" className="text-xs ml-1">GPS</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{incidente.resumen_ai || 'Pendiente de análisis'}</p>
                    </TableCell>
                    <TableCell>
                      {incidente.url_publicacion && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={incidente.url_publicacion} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* ── Panel de Inteligencia Expandido ── */}
                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/20 border-l-2 border-l-primary/40">
                      <TableCell colSpan={9} className="p-0">
                        <div className="p-5 space-y-4">

                          {/* Resumen AI prominente */}
                          {incidente.resumen_ai && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                                Resumen de Inteligencia
                              </h4>
                              <p className="text-sm text-foreground leading-relaxed">
                                {incidente.resumen_ai}
                              </p>
                            </div>
                          )}

                          {/* Grid 2 columnas: Análisis Criminológico + Contexto Geográfico */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Columna 1: Análisis Criminológico */}
                            <div className="rounded-lg border bg-card p-4 space-y-1">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5" />
                                Análisis Criminológico
                              </h4>

                              <DetailField icon={Crosshair} label="Modus Operandi" value={incidente.modus_operandi} />
                              <DetailField icon={Eye} label="Firma Criminal" value={incidente.firma_criminal} />

                              {incidente.nivel_organizacion && (
                                <div className="flex items-center gap-2 py-1.5">
                                  <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">Nivel de Organización</span>
                                    <div className="mt-0.5">
                                      <Badge className={`${nivelOrg.color} border text-xs`}>
                                        {nivelOrg.label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <DetailField icon={Target} label="Vector de Ataque" value={incidente.vector_ataque} />
                              <DetailField icon={Crosshair} label="Objetivo Específico" value={incidente.objetivo_especifico} />

                              {!incidente.modus_operandi && !incidente.firma_criminal && !incidente.nivel_organizacion && !incidente.vector_ataque && (
                                <p className="text-xs text-muted-foreground italic py-2">
                                  Sin análisis criminológico disponible
                                </p>
                              )}
                            </div>

                            {/* Columna 2: Contexto Geográfico */}
                            <div className="rounded-lg border bg-card p-4 space-y-1">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                                <MapPinned className="h-3.5 w-3.5" />
                                Contexto Geográfico
                              </h4>

                              {incidente.zona_tipo && (
                                <div className="flex items-center gap-2 py-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">Tipo de Zona</span>
                                    <p className="text-sm text-foreground">{ZONA_TIPO_LABELS[incidente.zona_tipo] || incidente.zona_tipo}</p>
                                  </div>
                                </div>
                              )}

                              <DetailField icon={MapPin} label="Municipio" value={incidente.municipio} />
                              <DetailField icon={MapPin} label="Carretera" value={incidente.carretera} />
                              <DetailField icon={MapPin} label="Estado" value={incidente.estado} />
                              <DetailField icon={Eye} label="Contexto Ambiental" value={incidente.contexto_ambiental} />

                              {incidente.coordenadas_lat && incidente.coordenadas_lng && (
                                <div className="flex items-center gap-2 py-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <div>
                                    <span className="text-xs text-muted-foreground">Coordenadas</span>
                                    <p className="text-sm font-mono text-foreground">
                                      {incidente.coordenadas_lat.toFixed(4)}, {incidente.coordenadas_lng.toFixed(4)}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {!incidente.zona_tipo && !incidente.municipio && !incidente.carretera && !incidente.coordenadas_lat && (
                                <p className="text-xs text-muted-foreground italic py-2">
                                  Sin contexto geográfico disponible
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Fila: Indicadores de Premeditación + Relevancia */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Indicadores de Premeditación */}
                            <div className="rounded-lg border bg-card p-4">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Indicadores de Premeditación
                              </h4>
                              {incidente.indicadores_premeditacion && incidente.indicadores_premeditacion.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {incidente.indicadores_premeditacion.map((ind, i) => (
                                    <Badge key={i} className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs">
                                      {ind}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">Sin indicadores detectados</p>
                              )}
                            </div>

                            {/* Relevancia Score */}
                            <div className="rounded-lg border bg-card p-4">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Relevancia
                              </h4>
                              {incidente.relevancia_score != null ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-foreground">{incidente.relevancia_score}</span>
                                    <span className="text-xs text-muted-foreground">/ 100</span>
                                  </div>
                                  <Progress value={incidente.relevancia_score} className="h-2" />
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">Sin score asignado</p>
                              )}
                            </div>
                          </div>

                          {/* Metadata: Keywords + Engagement + Autor */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                            {incidente.autor && <span>@{incidente.autor}</span>}
                            <span>👍 {incidente.engagement_likes || 0}</span>
                            <span>🔄 {incidente.engagement_shares || 0}</span>
                            <span>💬 {incidente.engagement_comments || 0}</span>
                            {incidente.keywords_detectados && incidente.keywords_detectados.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-auto">
                                {incidente.keywords_detectados.map((kw, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px]">{kw}</Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Texto Original (colapsable, secundario) */}
                          {textoLimpio && (
                            <div className="border-t border-border/50 pt-3">
                              <button
                                onClick={() => toggleFullText(incidente.id)}
                                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                {showFullText.has(incidente.id) ? 'Ocultar texto original' : 'Ver texto original'}
                                {showFullText.has(incidente.id) ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              {showFullText.has(incidente.id) && (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-2 leading-relaxed bg-muted/30 rounded p-3">
                                  {showFullText.has(incidente.id) ? textoLimpio : textoTruncado}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
