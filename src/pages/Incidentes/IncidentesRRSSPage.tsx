import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TriggerApifyFetch } from '@/components/incidentes/TriggerApifyFetch';
import { IncidentesStats } from '@/components/incidentes/IncidentesStats';
import { IncidentesTable } from '@/components/incidentes/IncidentesTable';
import { useIncidentesRRSS, useIncidentesStats } from '@/hooks/useIncidentesRRSS';
import { AlertTriangle, Filter, Map } from 'lucide-react';

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

const ESTADOS_INCIDENTE = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'validado', label: 'Validado' },
  { value: 'descartado', label: 'Descartado' },
  { value: 'duplicado', label: 'Duplicado' },
];

export default function IncidentesRRSSPage() {
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [diasAtras, setDiasAtras] = useState<number>(30);
  const [soloGeocodificados, setSoloGeocodificados] = useState<boolean>(false);

  const { data: incidentes, isLoading } = useIncidentesRRSS({
    tipo: filtroTipo !== 'all' ? filtroTipo : undefined,
    estado: filtroEstado !== 'all' ? filtroEstado : undefined,
    dias_atras: diasAtras,
    solo_geocodificados: soloGeocodificados,
  });

  const { data: stats, isLoading: statsLoading } = useIncidentesStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Inteligencia de Incidentes RRSS
          </h1>
          <p className="text-muted-foreground">
            Monitoreo de incidentes de transporte de carga desde redes sociales
          </p>
        </div>
        <TriggerApifyFetch />
      </div>

      {/* Stats Panel */}
      <IncidentesStats stats={stats} loading={statsLoading} />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Incidente</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INCIDENTE.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_INCIDENTE.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Días hacia atrás</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={diasAtras}
                onChange={(e) => setDiasAtras(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="geocodificados"
                  checked={soloGeocodificados}
                  onCheckedChange={(checked) => setSoloGeocodificados(checked as boolean)}
                />
                <Label htmlFor="geocodificados" className="cursor-pointer">
                  Solo geocodificados
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
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

      {/* Map Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Map className="h-5 w-5" />
            Mapa de Calor de Incidentes
          </CardTitle>
          <CardDescription>
            Visualización geográfica disponible en próxima versión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              El mapa de calor se implementará en la Fase 2 del sistema de inteligencia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
