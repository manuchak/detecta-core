import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, MapPin, TrendingUp, FileWarning, Route, Calendar, Crosshair, Shield, Eye } from 'lucide-react';
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

interface IncidentesStatsProps {
  stats: StatsData | undefined;
  loading: boolean;
}

const SEVERIDAD_COLORS: Record<string, string> = {
  critica: 'bg-red-500 text-white',
  alta: 'bg-orange-500 text-white',
  media: 'bg-yellow-500 text-black',
  baja: 'bg-green-500 text-white',
};

const TIPO_LABELS: Record<string, string> = {
  robo_carga: 'Robo Carga',
  robo_unidad: 'Robo Unidad',
  robo_combustible: 'Robo Combustible',
  asalto_transporte: 'Asalto',
  bloqueo_carretera: 'Bloqueo',
  accidente_trailer: 'Accidente',
  secuestro_operador: 'Secuestro',
  extorsion: 'Extorsión',
  sin_clasificar: 'Sin Clasificar',
};

const NIVEL_ORG_LABELS: Record<string, string> = {
  oportunista: 'Oportunista',
  celula_local: 'Célula Local',
  crimen_organizado: 'Crimen Organizado',
  no_determinado: 'No Determinado',
};

const NIVEL_ORG_COLORS = ['hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(215 20% 65%)'];

export function IncidentesStats({ stats, loading }: IncidentesStatsProps) {
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
    return [...corredores]
      .sort((a: any, b: any) => (b.score_riesgo || 0) - (a.score_riesgo || 0))
      .slice(0, 5);
  }, [corredores]);

  const nivelOrgData = useMemo(() => {
    if (!stats?.por_nivel_organizacion) return [];
    return Object.entries(stats.por_nivel_organizacion).map(([key, value]) => ({
      name: NIVEL_ORG_LABELS[key] || key,
      value,
    }));
  }, [stats]);

  const topModusOperandi = useMemo(() => {
    if (!stats?.por_modus_operandi) return [];
    return Object.entries(stats.por_modus_operandi)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [stats]);

  const topIndicadores = useMemo(() => {
    if (!stats?.indicadores_frecuentes) return [];
    return Object.entries(stats.indicadores_frecuentes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [stats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const geocodificadosPct = stats?.total 
    ? Math.round((stats.geocodificados / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Incidentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Relevancia promedio: {stats?.relevancia_promedio || 0}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Geocodificados</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.geocodificados || 0}</div>
            <p className="text-xs text-muted-foreground">{geocodificadosPct}% del total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Severidad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {stats?.por_severidad && Object.entries(stats.por_severidad).map(([sev, count]) => (
                <Badge key={sev} className={SEVERIDAD_COLORS[sev] || 'bg-gray-500'}>
                  {sev}: {count}
                </Badge>
              ))}
              {(!stats?.por_severidad || Object.keys(stats.por_severidad).length === 0) && (
                <span className="text-sm text-muted-foreground">Sin datos</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Método Geocoding</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {stats?.por_metodo_geocoding && Object.entries(stats.por_metodo_geocoding).map(([metodo, count]) => (
                <Badge key={metodo} variant="outline">
                  {metodo}: {count}
                </Badge>
              ))}
              {(!stats?.por_metodo_geocoding || Object.keys(stats.por_metodo_geocoding).length === 0) && (
                <span className="text-sm text-muted-foreground">Sin datos</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Types breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Desglose por Tipo de Incidente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats?.por_tipo && Object.entries(stats.por_tipo)
              .sort(([, a], [, b]) => b - a)
              .map(([tipo, count]) => (
                <Badge key={tipo} variant="secondary" className="text-xs">
                  {TIPO_LABELS[tipo] || tipo}: {count}
                </Badge>
              ))}
            {(!stats?.por_tipo || Object.keys(stats.por_tipo).length === 0) && (
              <span className="text-sm text-muted-foreground">Sin datos de tipos</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Inteligencia Criminológica ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nivel de Organización Criminal */}
        {nivelOrgData.length > 0 && (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Nivel de Organización Criminal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={nivelOrgData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
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

        {/* Modus Operandi más frecuentes */}
        {topModusOperandi.length > 0 && (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Crosshair className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Modus Operandi Frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topModusOperandi.map(([mo, count]) => (
                  <div key={mo} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-muted-foreground truncate max-w-[280px]" title={mo}>{mo}</span>
                    <Badge variant="outline" className="shrink-0">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Indicadores de Premeditación */}
      {topIndicadores.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Indicadores de Premeditación más Comunes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topIndicadores.map(([ind, count]) => (
                <Badge key={ind} variant="secondary" className="text-xs">
                  {ind} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly trend chart */}
      {tendenciaSemanal.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Tendencia Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tendenciaSemanal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="semana" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="criticos" name="Críticos" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top corridors by risk */}
      {topCorredores.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Corredores de Mayor Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCorredores.map((c: any) => (
                <div key={c.carretera} className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]">{c.carretera}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{c.incidentes_7d} / 7d</Badge>
                    <Badge variant="outline" className="text-xs">{c.incidentes_30d} / 30d</Badge>
                    <Badge className={
                      c.score_riesgo >= 70 ? 'bg-red-500 text-white' :
                      c.score_riesgo >= 40 ? 'bg-orange-500 text-white' :
                      'bg-green-500 text-white'
                    }>
                      Score: {c.score_riesgo}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
