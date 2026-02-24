import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Crosshair, Eye, Calendar, Route, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useIncidentesFrecuencia, useCorredoresRiesgo } from '@/hooks/useIncidentesRRSS';
import { useMemo } from 'react';

interface StatsData {
  total: number;
  por_tipo: Record<string, number>;
  por_severidad: Record<string, number>;
  geocodificados: number;
  por_metodo_geocoding: Record<string, number>;
  por_modus_operandi?: Record<string, number>;
  por_nivel_organizacion?: Record<string, number>;
  por_zona_tipo?: Record<string, number>;
  indicadores_frecuentes?: Record<string, number>;
  relevancia_promedio?: number;
}

interface Props {
  stats: StatsData | undefined;
  loading: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  robo_carga: 'Robo Carga', robo_unidad: 'Robo Unidad', robo_combustible: 'Robo Combustible',
  asalto_transporte: 'Asalto', bloqueo_carretera: 'Bloqueo', accidente_trailer: 'Accidente',
  secuestro_operador: 'Secuestro', extorsion: 'Extorsión', sin_clasificar: 'Sin Clasificar',
};

const NIVEL_ORG_LABELS: Record<string, string> = {
  oportunista: 'Oportunista', celula_local: 'Célula Local',
  crimen_organizado: 'Crimen Organizado', no_determinado: 'No Determinado',
};
const NIVEL_ORG_COLORS = ['hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(215 20% 65%)'];

export function IncidentesAnalisisPanel({ stats, loading }: Props) {
  const { data: frecuencia } = useIncidentesFrecuencia();
  const { data: corredores } = useCorredoresRiesgo();

  const tendenciaSemanal = useMemo(() => {
    if (!frecuencia) return [];
    const porSemana: Record<string, { semana: string; total: number; criticos: number }> = {};
    frecuencia.forEach((f) => {
      const key = f.semana?.substring(0, 10) || 'N/A';
      if (!porSemana[key]) porSemana[key] = { semana: key, total: 0, criticos: 0 };
      porSemana[key].total += Number(f.total) || 0;
      porSemana[key].criticos += Number(f.criticos) || 0;
    });
    return Object.values(porSemana).sort((a, b) => a.semana.localeCompare(b.semana)).slice(-8);
  }, [frecuencia]);

  const topCorredores = useMemo(() => {
    if (!corredores) return [];
    return [...corredores].sort((a: any, b: any) => (b.score_riesgo || 0) - (a.score_riesgo || 0)).slice(0, 5);
  }, [corredores]);

  const nivelOrgData = useMemo(() => {
    if (!stats?.por_nivel_organizacion) return [];
    return Object.entries(stats.por_nivel_organizacion).map(([key, value]) => ({
      name: NIVEL_ORG_LABELS[key] || key, value,
    }));
  }, [stats]);

  const topModusOperandi = useMemo(() => {
    if (!stats?.por_modus_operandi) return [];
    return Object.entries(stats.por_modus_operandi).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [stats]);

  const topIndicadores = useMemo(() => {
    if (!stats?.indicadores_frecuentes) return [];
    return Object.entries(stats.indicadores_frecuentes).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [stats]);

  if (loading) return null;

  const hasData = (stats?.por_tipo && Object.keys(stats.por_tipo).length > 0) ||
    nivelOrgData.length > 0 || tendenciaSemanal.length > 0;

  if (!hasData) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="analisis" className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Análisis e Inteligencia Criminológica</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 space-y-4">
          {/* Tipo breakdown */}
          {stats?.por_tipo && Object.keys(stats.por_tipo).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Desglose por Tipo</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.por_tipo).sort(([, a], [, b]) => b - a).map(([tipo, count]) => (
                  <Badge key={tipo} variant="secondary" className="text-xs">
                    {TIPO_LABELS[tipo] || tipo}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Criminología grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {nivelOrgData.length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center gap-2 p-4">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Nivel de Organización Criminal</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={nivelOrgData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {nivelOrgData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={NIVEL_ORG_COLORS[index % NIVEL_ORG_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {topModusOperandi.length > 0 && (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center gap-2 p-4">
                  <Crosshair className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Modus Operandi Frecuentes</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {topModusOperandi.map(([mo, count]) => (
                    <div key={mo} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground truncate max-w-[260px]" title={mo}>{mo}</span>
                      <Badge variant="outline" className="shrink-0">{count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Indicadores */}
          {topIndicadores.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Indicadores de Premeditación
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topIndicadores.map(([ind, count]) => (
                  <Badge key={ind} variant="secondary" className="text-xs">{ind} ({count})</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tendencia semanal */}
          {tendenciaSemanal.length > 0 && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center gap-2 p-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Tendencia Semanal</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={tendenciaSemanal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="semana" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="criticos" name="Críticos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top corredores */}
          {topCorredores.length > 0 && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center gap-2 p-4">
                <Route className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Corredores de Mayor Riesgo</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {topCorredores.map((c: any) => (
                  <div key={c.carretera} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[200px]">{c.carretera}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{c.incidentes_7d}/7d</Badge>
                      <Badge variant="outline" className="text-xs">{c.incidentes_30d}/30d</Badge>
                      <Badge className={
                        c.score_riesgo >= 70 ? 'bg-destructive text-destructive-foreground' :
                        c.score_riesgo >= 40 ? 'bg-warning text-warning-foreground' :
                        'bg-success text-success-foreground'
                      }>
                        {c.score_riesgo}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
