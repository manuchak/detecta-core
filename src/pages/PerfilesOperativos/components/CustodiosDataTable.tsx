import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Search, Eye, Phone, MapPin, Star, TrendingUp, Clock, Filter, X,
  MoreHorizontal, UserX, Home, Plane, CircleDot, Loader2, MessageCircle
} from 'lucide-react';
import { CustodioProfile } from '../hooks/useOperativeProfiles';
import { CambioEstatusModal } from '@/components/operatives/CambioEstatusModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustodiosDataTableProps {
  data: CustodioProfile[];
  onRefresh?: () => void;
}

const activityBadgeConfig: Record<CustodioProfile['nivel_actividad'], { label: string; className: string }> = {
  activo: { label: 'Activo', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  moderado: { label: 'Moderado', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  inactivo: { label: 'Inactivo', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  sin_actividad: { label: 'Sin actividad', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
};

const ZONAS_DISPONIBLES = [
  { value: 'Ciudad de México', label: 'CDMX' },
  { value: 'Estado de México', label: 'EDOMEX' },
  { value: 'Jalisco', label: 'Jalisco' },
  { value: 'Nuevo León', label: 'Nuevo León' },
  { value: 'Puebla', label: 'Puebla' },
  { value: 'Querétaro', label: 'Querétaro' },
  { value: 'Guanajuato', label: 'Guanajuato' },
  { value: 'Michoacán', label: 'Michoacán' },
  { value: 'Veracruz', label: 'Veracruz' },
  { value: 'Chihuahua', label: 'Chihuahua' },
  { value: 'Sonora', label: 'Sonora' },
  { value: 'Sinaloa', label: 'Sinaloa' },
  { value: 'Tamaulipas', label: 'Tamaulipas' },
  { value: 'Coahuila', label: 'Coahuila' },
  { value: 'Baja California', label: 'Baja California' },
  { value: 'Aguascalientes', label: 'Aguascalientes' },
  { value: 'Hidalgo', label: 'Hidalgo' },
  { value: 'Morelos', label: 'Morelos' },
  { value: 'Tlaxcala', label: 'Tlaxcala' },
  { value: 'San Luis Potosí', label: 'San Luis Potosí' },
];

type PreferenciaTipoServicio = 'local' | 'foraneo' | 'indistinto';

const PREFERENCIA_OPTIONS: { value: PreferenciaTipoServicio; label: string; icon: typeof Home }[] = [
  { value: 'local', label: 'Local', icon: Home },
  { value: 'foraneo', label: 'Foráneo', icon: Plane },
  { value: 'indistinto', label: 'Indistinto', icon: CircleDot },
];

export function CustodiosDataTable({ data, onRefresh }: CustodiosDataTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [zonaFilter, setZonaFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('activo');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const [selectedCustodio, setSelectedCustodio] = useState<CustodioProfile | null>(null);
  
  // Get unique zones for filter
  const zones = useMemo(() => {
    const uniqueZones = [...new Set(data.map(c => c.zona_base).filter(Boolean))];
    return uniqueZones.sort() as string[];
  }, [data]);
  
  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(custodio => {
      const matchesSearch = !searchTerm || 
        custodio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custodio.telefono?.includes(searchTerm) ||
        custodio.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesZona = zonaFilter === 'all' || custodio.zona_base === zonaFilter;
      const matchesActivity = activityFilter === 'all' || custodio.nivel_actividad === activityFilter;
      
      return matchesSearch && matchesZona && matchesActivity;
    });
  }, [data, searchTerm, zonaFilter, activityFilter]);
  
  const hasFilters = searchTerm || zonaFilter !== 'all' || activityFilter !== 'all';
  
  const clearFilters = () => {
    setSearchTerm('');
    setZonaFilter('all');
    setActivityFilter('all');
  };

  const handleZonaChange = async (custodioId: string, nuevaZona: string) => {
    setUpdatingIds(prev => new Set([...prev, custodioId]));
    try {
      const { error } = await supabase
        .from('custodios_operativos')
        .update({ zona_base: nuevaZona, updated_at: new Date().toISOString() })
        .eq('id', custodioId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
      toast.success('Zona actualizada');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating zona:', error);
      toast.error('Error al actualizar zona');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(custodioId);
        return newSet;
      });
    }
  };

  const handlePreferenciaChange = async (custodioId: string, preferencia: PreferenciaTipoServicio) => {
    setUpdatingIds(prev => new Set([...prev, custodioId]));
    try {
      const { error } = await supabase
        .from('custodios_operativos')
        .update({ preferencia_tipo_servicio: preferencia, updated_at: new Date().toISOString() })
        .eq('id', custodioId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
      toast.success('Preferencia actualizada');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating preferencia:', error);
      toast.error('Error al actualizar preferencia');
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(custodioId);
        return newSet;
      });
    }
  };

  const handleDarDeBaja = (custodio: CustodioProfile) => {
    setSelectedCustodio(custodio);
    setShowEstatusModal(true);
  };

  const handleEstatusSuccess = () => {
    setShowEstatusModal(false);
    setSelectedCustodio(null);
    queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
    onRefresh?.();
  };
  
  const columns: ColumnDef<CustodioProfile>[] = [
    {
      accessorKey: 'nombre',
      header: 'Custodio',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-[180px]">
          <span className="font-medium">{row.getValue('nombre')}</span>
          {row.original.telefono && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.telefono}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'zona_base',
      header: 'Zona',
      cell: ({ row }) => {
        const custodio = row.original;
        const isUpdating = updatingIds.has(custodio.id);
        const currentZona = custodio.zona_base || '';
        
        return (
          <div className="min-w-[140px]">
            <Select
              value={currentZona}
              onValueChange={(value) => handleZonaChange(custodio.id, value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                    <SelectValue placeholder="Sin zona" />
                  </>
                )}
              </SelectTrigger>
              <SelectContent>
                {ZONAS_DISPONIBLES.map(zona => (
                  <SelectItem key={zona.value} value={zona.value}>
                    {zona.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      accessorKey: 'nivel_actividad',
      header: 'Actividad',
      cell: ({ row }) => {
        const nivel = row.original.nivel_actividad;
        const config = activityBadgeConfig[nivel];
        return (
          <Badge className={cn('text-xs font-normal', config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'numero_servicios',
      header: 'Servicios',
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.getValue('numero_servicios') || 0}
        </div>
      ),
    },
    {
      accessorKey: 'preferencia_tipo_servicio',
      header: 'Preferencia',
      cell: ({ row }) => {
        const custodio = row.original;
        const isUpdating = updatingIds.has(custodio.id);
        const currentPref = custodio.preferencia_tipo_servicio || 'indistinto';
        const currentOption = PREFERENCIA_OPTIONS.find(o => o.value === currentPref);
        const Icon = currentOption?.icon || CircleDot;
        
        return (
          <div className="min-w-[130px]">
            <Select
              value={currentPref}
              onValueChange={(value) => handlePreferenciaChange(custodio.id, value as PreferenciaTipoServicio)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Icon className="h-3 w-3 mr-1 shrink-0" />
                    <SelectValue />
                  </>
                )}
              </SelectTrigger>
              <SelectContent>
                {PREFERENCIA_OPTIONS.map(option => {
                  const OptionIcon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <OptionIcon className="h-3 w-3" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      accessorKey: 'rating_promedio',
      header: 'Rating',
      cell: ({ row }) => {
        const rating = row.getValue('rating_promedio') as number | null;
        if (rating === null) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1 justify-center">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const custodio = row.original;
        const phoneNumber = custodio.telefono?.replace(/\D/g, '');
        
        return (
          <div className="flex items-center gap-1">
            {/* Acción primaria - siempre visible */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/perfiles-operativos/custodio/${custodio.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver perfil forense</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Menú secundario - acciones adicionales */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Contactar</DropdownMenuLabel>
                {phoneNumber && (
                  <>
                    <DropdownMenuItem asChild>
                      <a href={`tel:${phoneNumber}`} className="cursor-pointer">
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a 
                        href={`https://wa.me/52${phoneNumber}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
                {!phoneNumber && (
                  <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                    Sin teléfono registrado
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Administrar</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleDarDeBaja(custodio)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Dar de baja
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={zonaFilter} onValueChange={setZonaFilter}>
            <SelectTrigger className="w-[160px]">
              <MapPin className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las zonas</SelectItem>
              {zones.map(zona => (
                <SelectItem key={zona} value={zona}>{zona}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Actividad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda actividad</SelectItem>
              <SelectItem value="activo">Activo (30d)</SelectItem>
              <SelectItem value="moderado">Moderado (31-60d)</SelectItem>
              <SelectItem value="inactivo">Inactivo (61-90d)</SelectItem>
              <SelectItem value="sin_actividad">Sin actividad (+90d)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
          <Badge variant="outline">
            {filteredData.length} de {data.length}
          </Badge>
        </div>
      </div>
      
      <DataTable columns={columns} data={filteredData} />

      {/* Status Change Modal */}
      {selectedCustodio && (
        <CambioEstatusModal
          open={showEstatusModal}
          onOpenChange={setShowEstatusModal}
          operativo={{
            id: selectedCustodio.id,
            tipo: 'custodio',
            nombre: selectedCustodio.nombre,
            estado: selectedCustodio.estado,
          }}
          onSuccess={handleEstatusSuccess}
        />
      )}
    </div>
  );
}
