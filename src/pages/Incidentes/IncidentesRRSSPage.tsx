import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TriggerApifyFetch } from '@/components/incidentes/TriggerApifyFetch';
import { IncidentesStatsKPIs } from '@/components/incidentes/IncidentesStatsKPIs';
import { IncidentesAnalisisPanel } from '@/components/incidentes/IncidentesAnalisisPanel';
import { IncidentesTable } from '@/components/incidentes/IncidentesTable';
import { ActiveSituationBanner } from '@/components/incidentes/ActiveSituationBanner';
import { IncidentesMap } from '@/components/incidentes/IncidentesMap';
import { AffectedCorridors } from '@/components/incidentes/AffectedCorridors';
import { CorridorStatusPanel } from '@/components/incidentes/CorridorStatusPanel';
import { OperationalRecommendations } from '@/components/incidentes/OperationalRecommendations';
import { useIncidentesRRSS, useIncidentesStats, useIncidentesActivos, useCarreterasDisponibles } from '@/hooks/useIncidentesRRSS';
import { useRunTwitterSearch, useTwitterApiUsage } from '@/hooks/useTwitterConfig';
import { RefreshCw, Twitter, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPOS_INCIDENTE = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'robo_carga', label: 'Robo de Carga' },
  { value: 'robo_unidad', label: 'Robo de Unidad' },
  { value: 'robo_combustible', label: 'Robo de Combustible' },
  { value: 'robo_autopartes', label: 'Robo de Autopartes' },
  { value: 'asalto_transporte', label: 'Asalto a Transporte' },
  { value: 'bloqueo_carretera', label: 'Bloqueo de Carretera' },
  { value: 'accidente_trailer', label: 'Accidente de Tráiler' },
  { value: 'secuestro_operador', label: 'Secuestro de Operador' },
  { value: 'extorsion', label: 'Extorsión' },
  { value: 'vandalismo_unidad', label: 'Vandalismo' },
  { value: 'otro', label: 'Otro' },
  { value: 'sin_clasificar', label: 'Sin Clasificar' },
];

const ESTATUS_REGISTRO = [
  { value: 'all', label: 'Todos' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'validado', label: 'Validado' },
  { value: 'descartado', label: 'Descartado' },
  { value: 'duplicado', label: 'Duplicado' },
];

const PRESETS_TEMPORALES = [
  { label: '4h', horas: 4 },
  { label: 'Hoy', horas: 24 },
  { label: '24h', horas: 24 },
  { label: '7d', horas: 168 },
  { label: '30d', horas: 720 },
];

const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
  'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas',
];

export default function IncidentesRRSSPage() {
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('all');
  const [filtroEstadoGeo, setFiltroEstadoGeo] = useState<string>('all');
  const [filtroCarretera, setFiltroCarretera] = useState<string>('all');
  const [horasAtras, setHorasAtras] = useState<number>(24);
  const [soloGeocodificados, setSoloGeocodificados] = useState<boolean>(false);

  const { data: incidentes, isLoading } = useIncidentesRRSS({
    tipo: filtroTipo !== 'all' ? filtroTipo : undefined,
    estado: filtroEstatus !== 'all' ? filtroEstatus : undefined,
    estado_geografico: filtroEstadoGeo !== 'all' ? filtroEstadoGeo : undefined,
    carretera: filtroCarretera !== 'all' ? filtroCarretera : undefined,
    horas_atras: horasAtras,
    solo_geocodificados: soloGeocodificados,
  });

  const { data: stats, isLoading: statsLoading } = useIncidentesStats();
  const { data: incidentesActivos, isLoading: activosLoading } = useIncidentesActivos();
  const { data: carreteras } = useCarreterasDisponibles();

  const twitterSearch = useRunTwitterSearch();
  const { data: twitterUsage } = useTwitterApiUsage();

  const lastRun = twitterUsage?.[0];
  const lastRunTime = lastRun?.created_at
    ? formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true, locale: es })
    : null;

  // Status pill: count critical active incidents
  const alertCount = useMemo(() => {
    if (!incidentesActivos) return 0;
    return incidentesActivos.filter((i: any) => i.severidad === 'critica' || i.severidad === 'alta').length;
  }, [incidentesActivos]);

  return (
    <div className="space-y-4 p-6">
      {/* ═══ Executive Header ═══ */}
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Centro de Inteligencia
            </h1>
            {alertCount > 0 ? (
              <Badge variant="destructive" className="text-xs font-semibold">
                {alertCount} alerta{alertCount !== 1 ? 's' : ''} activa{alertCount !== 1 ? 's' : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Sin alertas</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Dashboard operativo · Seguridad en transporte de carga
            {lastRunTime && (
              <span className="ml-2">
                · X: {lastRunTime}
                {lastRun && ` (${lastRun.tweets_insertados} nuevos)`}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => twitterSearch.mutate()}
            disabled={twitterSearch.isPending}
            className="gap-2"
          >
            {twitterSearch.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Twitter className="h-4 w-4" />
            )}
            X / Twitter
          </Button>
          <TriggerApifyFetch />
        </div>
      </header>

      {/* ═══ Active Situation Banner ═══ */}
      <ActiveSituationBanner incidentes={incidentesActivos} isLoading={activosLoading} />

      {/* ═══ Inline Filter Toolbar ═══ */}
      <div className="flex flex-wrap items-center gap-2 py-2 border-b">
        {/* Temporal presets */}
        {PRESETS_TEMPORALES.map(preset => (
          <Button
            key={preset.label}
            variant={horasAtras === preset.horas && preset.label !== '24h' || (horasAtras === 24 && preset.label === 'Hoy') ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setHorasAtras(preset.horas)}
          >
            {preset.label}
          </Button>
        ))}

        <div className="w-px h-5 bg-border mx-1" />

        <Select value={filtroEstadoGeo} onValueChange={setFiltroEstadoGeo}>
          <SelectTrigger className="h-7 text-xs w-[140px]">
            <SelectValue placeholder="Entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            {ESTADOS_MX.map(edo => (
              <SelectItem key={edo} value={edo}>{edo}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroCarretera} onValueChange={setFiltroCarretera}>
          <SelectTrigger className="h-7 text-xs w-[140px]">
            <SelectValue placeholder="Carretera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(carreteras || []).map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="h-7 text-xs w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_INCIDENTE.map(tipo => (
              <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroEstatus} onValueChange={setFiltroEstatus}>
          <SelectTrigger className="h-7 text-xs w-[110px]">
            <SelectValue placeholder="Estatus" />
          </SelectTrigger>
          <SelectContent>
            {ESTATUS_REGISTRO.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 ml-1">
          <Checkbox
            id="geocodificados"
            checked={soloGeocodificados}
            onCheckedChange={(checked) => setSoloGeocodificados(checked as boolean)}
          />
          <Label htmlFor="geocodificados" className="cursor-pointer text-xs text-muted-foreground">
            Solo GPS
          </Label>
        </div>
      </div>

      {/* ═══ Zone 1: Map (60%) + Recommendations (40%) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <IncidentesMap incidentes={incidentes || []} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <OperationalRecommendations incidentes={incidentes || []} />
          <AffectedCorridors incidentes={incidentes || []} />
        </div>
      </div>

      {/* ═══ Zone 2: Corridor Status ═══ */}
      <CorridorStatusPanel incidentes={incidentes || []} />

      {/* ═══ Zone 3: KPIs ═══ */}
      <IncidentesStatsKPIs stats={stats} loading={statsLoading} />

      {/* ═══ Zone 4: Incidents Table ═══ */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Incidentes Detectados</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {incidentes?.length || 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <IncidentesTable data={incidentes || []} loading={isLoading} />
        </CardContent>
      </Card>

      {/* ═══ Zone 5: Analysis (collapsible) ═══ */}
      <IncidentesAnalisisPanel stats={stats} loading={statsLoading} />
    </div>
  );
}
