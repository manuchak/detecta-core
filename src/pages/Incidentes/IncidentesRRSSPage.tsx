import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { TriggerApifyFetch } from '@/components/incidentes/TriggerApifyFetch';
import { IncidentesStats } from '@/components/incidentes/IncidentesStats';
import { IncidentesTable } from '@/components/incidentes/IncidentesTable';
import { ActiveSituationBanner } from '@/components/incidentes/ActiveSituationBanner';
import { IncidentesMap } from '@/components/incidentes/IncidentesMap';
import { AffectedCorridors } from '@/components/incidentes/AffectedCorridors';
import { useIncidentesRRSS, useIncidentesStats, useIncidentesActivos, useCarreterasDisponibles } from '@/hooks/useIncidentesRRSS';
import { AlertTriangle, Filter } from 'lucide-react';

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

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-destructive" />
            Inteligencia de Incidentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Dashboard operativo de seguridad para transporte de carga
          </p>
        </div>
        <TriggerApifyFetch />
      </div>

      {/* Banner de Situación Activa */}
      <ActiveSituationBanner incidentes={incidentesActivos} isLoading={activosLoading} />

      {/* Filtros Operativos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Operativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Presets temporales */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs text-muted-foreground shrink-0">Periodo:</Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Entidad Federativa */}
            <div className="space-y-1">
              <Label className="text-xs">Entidad Federativa</Label>
              <Select value={filtroEstadoGeo} onValueChange={setFiltroEstadoGeo}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  {ESTADOS_MX.map(edo => (
                    <SelectItem key={edo} value={edo}>{edo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Carretera */}
            <div className="space-y-1">
              <Label className="text-xs">Carretera / Corredor</Label>
              <Select value={filtroCarretera} onValueChange={setFiltroCarretera}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las carreteras</SelectItem>
                  {(carreteras || []).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Incidente */}
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Incidente</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INCIDENTE.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estatus del registro */}
            <div className="space-y-1">
              <Label className="text-xs">Estatus del Registro</Label>
              <Select value={filtroEstatus} onValueChange={setFiltroEstatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {ESTATUS_REGISTRO.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Solo geocodificados */}
            <div className="flex items-end pb-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="geocodificados"
                  checked={soloGeocodificados}
                  onCheckedChange={(checked) => setSoloGeocodificados(checked as boolean)}
                />
                <Label htmlFor="geocodificados" className="cursor-pointer text-xs">
                  Solo geocodificados
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Corredores Afectados */}
      <AffectedCorridors incidentes={incidentes || []} />

      {/* Mapa + Stats lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncidentesMap incidentes={incidentes || []} />
        <div className="space-y-4">
          <IncidentesStats stats={stats} loading={statsLoading} />
        </div>
      </div>

      {/* Tabla de Incidentes */}
      <Card>
        <CardHeader>
          <CardTitle>Incidentes Detectados</CardTitle>
          <CardDescription>
            {incidentes?.length || 0} incidentes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentesTable data={incidentes || []} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
