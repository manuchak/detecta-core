import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  Calendar,
  Settings,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react';
import { useConfiguracionSanciones, useCatalogoSanciones, useSancionesStats } from '@/hooks/useConfiguracionSanciones';

const CATEGORIA_STYLES: Record<string, { bg: string; text: string }> = {
  'leve': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'moderada': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'grave': { bg: 'bg-red-100', text: 'text-red-800' },
  'muy_grave': { bg: 'bg-red-200', text: 'text-red-900' },
};

export default function ConfiguracionSancionesPage() {
  const { config, isLoading, updateConfig, isUpdating } = useConfiguracionSanciones();
  const { data: catalogo } = useCatalogoSanciones();
  const { data: stats } = useSancionesStats();
  
  const [localConfig, setLocalConfig] = useState<typeof config>(null);
  
  // Initialize local state when config loads
  if (config && !localConfig) {
    setLocalConfig(config);
  }

  const handleToggle = async (field: string, value: boolean) => {
    if (!localConfig) return;
    
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    await updateConfig({ [field]: value });
  };

  const handleNumberChange = (field: string, value: number) => {
    if (!localConfig) return;
    setLocalConfig({ ...localConfig, [field]: value });
  };

  const handleSaveNumber = async (field: string) => {
    if (!localConfig) return;
    await updateConfig({ [field]: (localConfig as any)[field] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Configuración de Sanciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Configura la detección automática de incumplimientos y las reglas de sanciones
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sistema de Detección Automática</AlertTitle>
        <AlertDescription>
          Cuando está habilitado, el sistema detecta automáticamente incumplimientos basándose en los datos de servicios. 
          Asegúrate de que los datos de hora de llegada y estado estén correctamente capturados antes de activar.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-sm text-muted-foreground">Total Sanciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{stats?.activas || 0}</div>
            <p className="text-sm text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats?.cumplidas || 0}</div>
            <p className="text-sm text-muted-foreground">Cumplidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats?.revocadas || 0}</div>
            <p className="text-sm text-muted-foreground">Revocadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Main Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Sistema Automático
                </CardTitle>
                <CardDescription>
                  Control maestro para la detección automática
                </CardDescription>
              </div>
              <Switch
                checked={localConfig?.activo || false}
                onCheckedChange={(v) => handleToggle('activo', v)}
                disabled={isUpdating}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ventana de detección</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={localConfig?.ventana_deteccion_dias || 1}
                  onChange={(e) => handleNumberChange('ventana_deteccion_dias', parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                />
                <span className="text-sm text-muted-foreground">días</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveNumber('ventana_deteccion_dias')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* NO_SHOW Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">No Presentarse (NO_SHOW)</span>
                </div>
                <Switch
                  checked={localConfig?.no_show_habilitado || false}
                  onCheckedChange={(v) => handleToggle('no_show_habilitado', v)}
                  disabled={isUpdating || !localConfig?.activo}
                />
              </div>
              
              {localConfig?.no_show_habilitado && (
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tolerancia después de cita</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={15}
                        max={120}
                        value={localConfig?.no_show_minutos_tolerancia || 30}
                        onChange={(e) => handleNumberChange('no_show_minutos_tolerancia', parseInt(e.target.value) || 30)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>min</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Días de suspensión</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={localConfig?.no_show_dias_suspension || 21}
                        onChange={(e) => handleNumberChange('no_show_dias_suspension', parseInt(e.target.value) || 21)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>días</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* CANCELACION Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Cancelación Última Hora</span>
                </div>
                <Switch
                  checked={localConfig?.cancelacion_habilitado || false}
                  onCheckedChange={(v) => handleToggle('cancelacion_habilitado', v)}
                  disabled={isUpdating || !localConfig?.activo}
                />
              </div>
              
              {localConfig?.cancelacion_habilitado && (
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Horas antes de cita</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={localConfig?.cancelacion_horas_limite || 2}
                        onChange={(e) => handleNumberChange('cancelacion_horas_limite', parseInt(e.target.value) || 2)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>hrs</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Días de suspensión</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={localConfig?.cancelacion_dias_suspension || 14}
                        onChange={(e) => handleNumberChange('cancelacion_dias_suspension', parseInt(e.target.value) || 14)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>días</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* LLEGADA_TARDE Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Llegada Tarde Recurrente</span>
                </div>
                <Switch
                  checked={localConfig?.llegada_tarde_habilitado || false}
                  onCheckedChange={(v) => handleToggle('llegada_tarde_habilitado', v)}
                  disabled={isUpdating || !localConfig?.activo}
                />
              </div>
              
              {localConfig?.llegada_tarde_habilitado && (
                <div className="ml-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tolerancia de llegada</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={5}
                        max={60}
                        value={localConfig?.llegada_tarde_minutos_tolerancia || 15}
                        onChange={(e) => handleNumberChange('llegada_tarde_minutos_tolerancia', parseInt(e.target.value) || 15)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>min</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ocurrencias para sanción</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={2}
                        max={10}
                        value={localConfig?.llegada_tarde_ocurrencias_limite || 3}
                        onChange={(e) => handleNumberChange('llegada_tarde_ocurrencias_limite', parseInt(e.target.value) || 3)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>veces</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Periodo de evaluación</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={7}
                        max={90}
                        value={localConfig?.llegada_tarde_periodo_dias || 30}
                        onChange={(e) => handleNumberChange('llegada_tarde_periodo_dias', parseInt(e.target.value) || 30)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>días</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Días de suspensión</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={21}
                        value={localConfig?.llegada_tarde_dias_suspension || 7}
                        onChange={(e) => handleNumberChange('llegada_tarde_dias_suspension', parseInt(e.target.value) || 7)}
                        className="w-16 h-7 text-xs"
                      />
                      <span>días</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Catálogo de Sanciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Catálogo de Sanciones
            </CardTitle>
            <CardDescription>
              Tipos de sanciones disponibles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {catalogo?.map((sancion) => {
                const style = CATEGORIA_STYLES[sancion.categoria] || { bg: 'bg-muted', text: 'text-muted-foreground' };
                return (
                  <div 
                    key={sancion.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{sancion.nombre}</span>
                        <Badge className={`${style.bg} ${style.text} text-xs`}>
                          {sancion.categoria}
                        </Badge>
                      </div>
                      {sancion.descripcion && (
                        <p className="text-xs text-muted-foreground">{sancion.descripcion}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{sancion.dias_suspension_default}</p>
                      <p className="text-xs text-muted-foreground">días</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
