import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, ExternalLink, MapPin } from 'lucide-react';
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

export function IncidentesTable({ data, loading }: IncidentesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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
            <TableHead>Ubicación</TableHead>
            <TableHead>Resumen AI</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((incidente) => (
            <Collapsible key={incidente.id} asChild>
              <>
                <TableRow className="cursor-pointer hover:bg-muted/50">
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
                        <Badge variant="outline" className="text-xs ml-1">
                          GPS
                        </Badge>
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
                <CollapsibleContent asChild>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={8} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Texto Original</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {incidente.texto_original || 'Sin texto disponible'}
                          </p>
                        </div>
                        {incidente.keywords_detectados && incidente.keywords_detectados.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Keywords Detectados</h4>
                            <div className="flex flex-wrap gap-1">
                              {incidente.keywords_detectados.map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {incidente.autor && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Autor</h4>
                            <p className="text-sm text-muted-foreground">@{incidente.autor}</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>👍 {incidente.engagement_likes || 0}</span>
                          <span>🔄 {incidente.engagement_shares || 0}</span>
                          <span>💬 {incidente.engagement_comments || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </>
            </Collapsible>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
