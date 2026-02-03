/**
 * SancionesConfigTab - Configuration tab for sanctions system
 * Includes: Applied sanctions list + Auto-detection configuration
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Shield, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Sliders,
  List,
  Calendar,
  Info,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useSancionesAplicadas, 
  useCatalogoSanciones,
  useActualizarSancion,
  type SancionAplicada 
} from '@/hooks/useSanciones';
import { 
  useConfiguracionSanciones, 
  useCatalogoSanciones as useCatalogoFromConfig,
  useSancionesStats 
} from '@/hooks/useConfiguracionSanciones';
import { CatalogoSancionesDialog } from '@/components/operatives/CatalogoSancionesDialog';

const estadoBadgeConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  activa: { icon: AlertTriangle, color: 'bg-destructive/10 text-destructive', label: 'Activa' },
  cumplida: { icon: CheckCircle, color: 'bg-success/10 text-success', label: 'Cumplida' },
  apelada: { icon: Clock, color: 'bg-warning/10 text-warning', label: 'Apelada' },
  revocada: { icon: XCircle, color: 'bg-muted text-muted-foreground', label: 'Revocada' },
};

const categoriaBadgeColors: Record<string, string> = {
  leve: 'bg-blue-500/10 text-blue-600',
  moderada: 'bg-warning/10 text-warning',
  grave: 'bg-orange-500/10 text-orange-600',
  muy_grave: 'bg-destructive/10 text-destructive',
};

const CATEGORIA_STYLES: Record<string, { bg: string; text: string }> = {
  'leve': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200' },
  'moderada': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
  'grave': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
  'muy_grave': { bg: 'bg-red-200 dark:bg-red-900/50', text: 'text-red-900 dark:text-red-100' },
};

export function SancionesConfigTab() {
  const [activeSubTab, setActiveSubTab] = useState('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  
  // Hooks for applied sanctions
  const { data: sanciones, isLoading } = useSancionesAplicadas({
    estado: estadoFilter !== 'all' ? estadoFilter as any : undefined,
  });
  const { data: catalogo } = useCatalogoSanciones();
  const { mutate: actualizarSancion } = useActualizarSancion();

  // Hooks for configuration
  const { config, isLoading: configLoading, updateConfig, isUpdating } = useConfiguracionSanciones();
  const { data: catalogoConfig } = useCatalogoFromConfig();
  const { data: stats } = useSancionesStats();
  
  const [localConfig, setLocalConfig] = useState<typeof config>(null);
  
  // Initialize local state when config loads
  if (config && !localConfig) {
    setLocalConfig(config);
  }

  // Filter sanciones by search term
  const filteredSanciones = sanciones?.filter(s => {
    if (!searchTerm) return true;
    const sancionNombre = s.sancion?.nombre?.toLowerCase() || '';
    return sancionNombre.includes(searchTerm.toLowerCase());
  }) || [];

  // Stats
  const totalActivas = sanciones?.filter(s => s.estado === 'activa').length || 0;
  const totalMesActual = sanciones?.filter(s => {
    const fecha = new Date(s.created_at);
    const now = new Date();
    return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
  }).length || 0;

  const handleCambiarEstado = (sancionId: string, nuevoEstado: 'cumplida' | 'apelada' | 'revocada') => {
    actualizarSancion({ sancionId, nuevoEstado });
  };

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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sistema de Sanciones
              </CardTitle>
              <CardDescription>
                Gestión de sanciones y configuración de detección automática
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setCatalogoOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Catálogo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{stats?.activas || totalActivas}</p>
              <p className="text-sm text-muted-foreground">Activas</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{totalMesActual}</p>
              <p className="text-sm text-muted-foreground">Este Mes</p>
            </div>
            <div className="p-4 bg-success/10 rounded-lg">
              <p className="text-2xl font-bold text-success">{stats?.cumplidas || 0}</p>
              <p className="text-sm text-muted-foreground">Cumplidas</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{stats?.total || sanciones?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Sanciones Aplicadas
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Configuración Auto
          </TabsTrigger>
        </TabsList>

        {/* Lista de Sanciones */}
        <TabsContent value="lista" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo de sanción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="cumplida">Cumplidas</SelectItem>
                <SelectItem value="apelada">Apeladas</SelectItem>
                <SelectItem value="revocada">Revocadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Cargando sanciones...
                      </TableCell>
                    </TableRow>
                  ) : filteredSanciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay sanciones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSanciones.map((sancion) => {
                      const estadoConfig = estadoBadgeConfig[sancion.estado];
                      const IconEstado = estadoConfig.icon;
                      
                      return (
                        <TableRow key={sancion.id}>
                          <TableCell className="font-medium">
                            {sancion.sancion?.nombre || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {sancion.sancion?.categoria && (
                              <Badge 
                                variant="outline" 
                                className={categoriaBadgeColors[sancion.sancion.categoria]}
                              >
                                {sancion.sancion.categoria.replace('_', ' ')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sancion.fecha_inicio), "d MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>{sancion.dias_suspension}</TableCell>
                          <TableCell>-{sancion.puntos_perdidos}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${estadoConfig.color}`}>
                              <IconEstado className="h-3 w-3" />
                              {estadoConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {sancion.estado === 'activa' && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCambiarEstado(sancion.id, 'cumplida')}
                                >
                                  Cumplida
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCambiarEstado(sancion.id, 'revocada')}
                                >
                                  Revocar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración Automática */}
        <TabsContent value="configuracion" className="space-y-4">
          {configLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Warning Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sistema de Detección Automática</AlertTitle>
                <AlertDescription>
                  Cuando está habilitado, el sistema detecta incumplimientos basándose en datos de servicios. 
                  Asegúrate de que los datos de hora de llegada estén correctamente capturados.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Main Configuration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Settings className="h-5 w-5" />
                          Sistema Automático
                        </CardTitle>
                        <CardDescription>
                          Control maestro para detección automática
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
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="h-5 w-5" />
                      Catálogo de Sanciones
                    </CardTitle>
                    <CardDescription>
                      Tipos de sanciones disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {(catalogoConfig || catalogo)?.map((sancion) => {
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
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Catalog Dialog */}
      <CatalogoSancionesDialog 
        open={catalogoOpen} 
        onOpenChange={setCatalogoOpen} 
      />
    </div>
  );
}

export default SancionesConfigTab;
