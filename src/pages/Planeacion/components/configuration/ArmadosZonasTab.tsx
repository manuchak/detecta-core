/**
 * ArmadosZonasTab - Armed Guards Zone & Preference Management
 * Apple Design System - Phase 2
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MapPin, 
  Search, 
  AlertTriangle,
  RefreshCw,
  Shield,
  Phone,
  Home,
  Plane,
  Circle,
  MoreHorizontal,
  Power,
  CircleDot,
  Award,
  Calendar
} from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { CoverageRing } from '@/components/planeacion/CoverageRing';
import { ZoneStatusIndicator } from '@/components/planeacion/ZoneStatusIndicator';
import { CambioEstatusModal } from '@/components/operatives/CambioEstatusModal';
import { PreferenciaTipoServicio } from '@/components/operatives/PreferenciaServicioSelector';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArmadoOperativo {
  id: string;
  nombre: string;
  zona_base: string | null;
  estado: string;
  disponibilidad: string;
  telefono: string | null;
  tipo_armado: string;
  licencia_portacion: string | null;
  fecha_vencimiento_licencia: string | null;
  experiencia_anos: number | null;
  fecha_ultimo_servicio: string | null;
  preferencia_tipo_servicio: PreferenciaTipoServicio | null;
  servicios_locales_15d: number | null;
  servicios_foraneos_15d: number | null;
}

type ActivityFilter = 'all' | '60' | '90' | '120' | '120+';

const ACTIVITY_FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: '60', label: 'Últimos 60 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '120', label: 'Últimos 120 días' },
  { value: '120+', label: 'Sin actividad +120 días' },
];

const ZONAS_DISPONIBLES = [
  { value: 'Ciudad de México', label: 'CDMX' },
  { value: 'Estado de México', label: 'EDOMEX' },
  { value: 'Jalisco', label: 'Jalisco (GDL)' },
  { value: 'Nuevo León', label: 'Nuevo León (MTY)' },
  { value: 'Puebla', label: 'Puebla' },
  { value: 'Querétaro', label: 'Querétaro' },
  { value: 'Guanajuato', label: 'Guanajuato' },
  { value: 'Veracruz', label: 'Veracruz' },
  { value: 'Michoacán', label: 'Michoacán' },
  { value: 'Hidalgo', label: 'Hidalgo' },
  { value: 'Morelos', label: 'Morelos' },
];

const PREFERENCIA_OPTIONS: { value: PreferenciaTipoServicio; label: string; icon: typeof Home }[] = [
  { value: 'local', label: 'Local', icon: Home },
  { value: 'foraneo', label: 'Foráneo', icon: Plane },
  { value: 'indistinto', label: 'Indistinto', icon: CircleDot },
];

export function ArmadosZonasTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSinZona, setFilterSinZona] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('90');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const [selectedArmado, setSelectedArmado] = useState<ArmadoOperativo | null>(null);
  const queryClient = useQueryClient();

  // Fetch armados operativos
  const { data: armados = [], isPending, refetch } = useAuthenticatedQuery(
    ['armados-operativos-zonas'],
    async () => {
      const { data, error } = await supabase
        .from('armados_operativos')
        .select(`
          id, nombre, zona_base, estado, disponibilidad, telefono,
          tipo_armado, licencia_portacion, fecha_vencimiento_licencia,
          experiencia_anos, fecha_ultimo_servicio, preferencia_tipo_servicio,
          servicios_locales_15d, servicios_foraneos_15d
        `)
        .eq('estado', 'activo')
        .order('nombre');
      
      if (error) throw error;
      return data as ArmadoOperativo[];
    }
  );

  // Helper to calculate days since last service
  const getDaysSinceLastService = (fecha: string | null): number | null => {
    if (!fecha) return null;
    return differenceInDays(new Date(), new Date(fecha));
  };

  // Check license validity
  const isLicenseValid = (fecha: string | null): boolean | null => {
    if (!fecha) return null;
    return new Date(fecha) > new Date();
  };

  // Filter by activity
  const armadosPorActividad = useMemo(() => {
    if (activityFilter === 'all') return armados;
    
    return armados.filter(a => {
      const days = getDaysSinceLastService(a.fecha_ultimo_servicio);
      
      if (activityFilter === '120+') {
        return days === null || days > 120;
      }
      
      const maxDays = parseInt(activityFilter);
      return days !== null && days <= maxDays;
    });
  }, [armados, activityFilter]);

  // Filter for table
  const filteredArmados = useMemo(() => {
    let result = armadosPorActividad;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.nombre.toLowerCase().includes(term) ||
        a.zona_base?.toLowerCase().includes(term)
      );
    }
    
    if (filterSinZona) {
      result = result.filter(a => !a.zona_base || a.zona_base.trim() === '');
    }
    
    return result;
  }, [armadosPorActividad, searchTerm, filterSinZona]);

  // Count without zone
  const armadosSinZona = useMemo(() => {
    return armadosPorActividad.filter(a => !a.zona_base || a.zona_base.trim() === '');
  }, [armadosPorActividad]);

  // Completeness percentage
  const completitudPorcentaje = useMemo(() => {
    if (armadosPorActividad.length === 0) return 0;
    return Math.round(((armadosPorActividad.length - armadosSinZona.length) / armadosPorActividad.length) * 100);
  }, [armadosPorActividad.length, armadosSinZona.length]);

  // Update zone
  const handleZonaChange = async (armadoId: string, nuevaZona: string) => {
    setUpdatingIds(prev => new Set([...prev, armadoId]));
    
    try {
      const { error } = await supabase
        .from('armados_operativos')
        .update({ zona_base: nuevaZona, updated_at: new Date().toISOString() })
        .eq('id', armadoId);
      
      if (error) throw error;
      
      toast.success('Zona actualizada');
      queryClient.invalidateQueries({ queryKey: ['armados-operativos-zonas'] });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(armadoId);
        return next;
      });
    }
  };

  // Update preference
  const handlePreferenciaChange = async (armadoId: string, nuevaPreferencia: PreferenciaTipoServicio) => {
    setUpdatingIds(prev => new Set([...prev, armadoId]));
    
    try {
      const { error } = await supabase
        .from('armados_operativos')
        .update({ 
          preferencia_tipo_servicio: nuevaPreferencia, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', armadoId);
      
      if (error) throw error;
      
      toast.success('Preferencia actualizada');
      queryClient.invalidateQueries({ queryKey: ['armados-operativos-zonas'] });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(armadoId);
        return next;
      });
    }
  };

  const openCambioEstatus = (armado: ArmadoOperativo) => {
    setSelectedArmado(armado);
    setShowEstatusModal(true);
  };

  const isMissingZona = (zona: string | null) => !zona || zona.trim() === '';

  const zonasConArmados = new Set(armadosPorActividad.filter(a => a.zona_base).map(a => a.zona_base)).size;

  return (
    <div className="space-y-6">
      {/* Alert for missing zones */}
      {armadosSinZona.length > 0 && (
        <Alert className="border-warning/50 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Datos incompletos</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{armadosSinZona.length}</strong> armados sin zona base definida.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterSinZona(true)}
              className="border-warning/50 hover:bg-warning/10"
            >
              Ver afectados
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="apple-metric apple-metric-neutral">
          <div className="apple-metric-icon">
            <Shield className="h-5 w-5" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">{armadosPorActividad.length}</div>
            <div className="apple-metric-label">
              {activityFilter === 'all' ? 'Total Activos' : `Activos (${activityFilter === '120+' ? '+120d' : activityFilter + 'd'})`}
            </div>
          </div>
        </div>

        <div className="apple-metric apple-metric-warning">
          <div className="apple-metric-icon">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">{armadosSinZona.length}</div>
            <div className="apple-metric-label">Sin Zona</div>
          </div>
        </div>

        <div className="apple-metric apple-metric-info">
          <div className="apple-metric-icon">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">{zonasConArmados}</div>
            <div className="apple-metric-label">Zonas Cubiertas</div>
          </div>
        </div>

        <div className="apple-metric apple-metric-success">
          <CoverageRing 
            percentage={completitudPorcentaje} 
            size={48}
            strokeWidth={5}
            showLabel={false}
          />
          <div className="apple-metric-content">
            <div className="apple-metric-value">{completitudPorcentaje}%</div>
            <div className="apple-metric-label">Completitud</div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Armados</CardTitle>
              <CardDescription>
                Configura zona base y preferencia de servicio para cada armado
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px] max-w-sm relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o zona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por actividad" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant={filterSinZona ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSinZona(!filterSinZona)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Solo sin zona ({armadosSinZona.length})
            </Button>
            
            <Badge variant="outline">
              {filteredArmados.length} armado(s)
            </Badge>
          </div>

          {/* List */}
          <div className="apple-list max-h-[500px] overflow-y-auto pr-1">
            {filteredArmados.map((armado) => {
              const licenseValid = isLicenseValid(armado.fecha_vencimiento_licencia);
              const daysSinceService = getDaysSinceLastService(armado.fecha_ultimo_servicio);
              
              return (
                <div 
                  key={armado.id} 
                  className={`
                    apple-list-item flex items-center justify-between gap-4
                    ${isMissingZona(armado.zona_base) ? 'border-warning/30 bg-warning/5' : ''}
                  `}
                >
                  {/* Left: Status + Name + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Circle 
                      className={`h-3 w-3 flex-shrink-0 ${
                        isMissingZona(armado.zona_base) 
                          ? 'fill-destructive text-destructive' 
                          : 'fill-success text-success'
                      }`} 
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate text-foreground">{armado.nombre}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {armado.telefono || '-'}
                        </span>
                        {armado.experiencia_anos && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {armado.experiencia_anos} años
                          </span>
                        )}
                        {daysSinceService !== null && (
                          <span className={`flex items-center gap-1 ${
                            daysSinceService <= 7 ? 'text-success' : 
                            daysSinceService <= 30 ? 'text-warning' : 'text-destructive'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            {daysSinceService}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: License Badge */}
                  <div className="flex-shrink-0 w-24">
                    {licenseValid !== null ? (
                      <Badge variant={licenseValid ? 'success' : 'destructive'} className="text-xs">
                        {licenseValid ? 'Vigente' : 'Vencida'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Sin licencia</Badge>
                    )}
                  </div>

                  {/* Right: Selectors + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select
                      value={armado.zona_base || ''}
                      onValueChange={(value) => handleZonaChange(armado.id, value)}
                      disabled={updatingIds.has(armado.id)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONAS_DISPONIBLES.map((zona) => (
                          <SelectItem key={zona.value} value={zona.value}>
                            {zona.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={armado.preferencia_tipo_servicio || 'indistinto'}
                      onValueChange={(value) => handlePreferenciaChange(armado.id, value as PreferenciaTipoServicio)}
                      disabled={updatingIds.has(armado.id)}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Pref." />
                      </SelectTrigger>
                      <SelectContent>
                        {PREFERENCIA_OPTIONS.map((pref) => {
                          const Icon = pref.icon;
                          return (
                            <SelectItem key={pref.value} value={pref.value}>
                              <span className="flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {pref.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openCambioEstatus(armado)}>
                          <Power className="h-4 w-4 mr-2" />
                          Dar de baja
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
            
            {filteredArmados.length === 0 && (
              <div className="apple-empty-state">
                <p className="text-muted-foreground">No se encontraron armados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Change Modal */}
      {selectedArmado && (
        <CambioEstatusModal
          open={showEstatusModal}
          onOpenChange={setShowEstatusModal}
          operativo={{
            id: selectedArmado.id,
            nombre: selectedArmado.nombre,
            tipo: 'armado',
            estado: selectedArmado.estado
          }}
        />
      )}
    </div>
  );
}

export default ArmadosZonasTab;
