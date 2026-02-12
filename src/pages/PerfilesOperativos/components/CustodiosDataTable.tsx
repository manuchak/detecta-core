import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Search, Eye, Phone, MapPin, Star, Filter, X, ArrowUpDown,
  MoreHorizontal, UserX, Home, Plane, CircleDot, MessageCircle,
  Edit, Trash2, Trophy, Medal, Award
} from 'lucide-react';
import { useFleetRankingBatch, RankingEntry } from '../hooks/useFleetRankingBatch';
import { RankingTier } from '../hooks/useFleetRanking';
import { CustodioProfile } from '../hooks/useOperativeProfiles';
import { CambioEstatusModal } from '@/components/operatives/CambioEstatusModal';
import { QuickEditSheet, PreferenciaTipoServicio } from './QuickEditSheet';
import { BajaMasivaModal } from './BajaMasivaModal';
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

const ZONAS_ABREVIADAS: Record<string, string> = {
  'Ciudad de México': 'CDMX',
  'Estado de México': 'EDOMEX',
  'Jalisco': 'Jalisco',
  'Nuevo León': 'NL',
  'Puebla': 'Puebla',
  'Querétaro': 'Qro',
  'Guanajuato': 'Gto',
  'Michoacán': 'Mich',
  'Veracruz': 'Veracruz',
  'Chihuahua': 'Chih',
  'Sonora': 'Sonora',
  'Sinaloa': 'Sinaloa',
  'Tamaulipas': 'Tamps',
  'Coahuila': 'Coah',
  'Baja California': 'BC',
  'Aguascalientes': 'Ags',
  'Hidalgo': 'Hgo',
  'Morelos': 'Mor',
  'Tlaxcala': 'Tlax',
  'San Luis Potosí': 'SLP',
};

const PREFERENCIA_ICONS: Record<PreferenciaTipoServicio, { icon: typeof Home; label: string }> = {
  local: { icon: Home, label: 'Local' },
  foraneo: { icon: Plane, label: 'Foráneo' },
  indistinto: { icon: CircleDot, label: 'Indistinto' },
};

export function CustodiosDataTable({ data, onRefresh }: CustodiosDataTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rankingMap } = useFleetRankingBatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [zonaFilter, setZonaFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('nombre');
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const [selectedCustodio, setSelectedCustodio] = useState<CustodioProfile | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBajaMasivaModal, setShowBajaMasivaModal] = useState(false);
  
  // Quick Edit Sheet state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingCustodio, setEditingCustodio] = useState<CustodioProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get unique zones for filter
  const zones = useMemo(() => {
    const uniqueZones = [...new Set(data.map(c => c.zona_base).filter(Boolean))];
    return uniqueZones.sort() as string[];
  }, [data]);
  
  // Filter data
  const filteredData = useMemo(() => {
    const filtered = data.filter(custodio => {
      const matchesSearch = !searchTerm || 
        custodio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custodio.telefono?.includes(searchTerm) ||
        custodio.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesZona = zonaFilter === 'all' || custodio.zona_base === zonaFilter;
      const matchesActivity = activityFilter === 'all' || custodio.nivel_actividad === activityFilter;
      
      return matchesSearch && matchesZona && matchesActivity;
    });

    // Sort
    if (sortBy === 'ranking' && rankingMap) {
      filtered.sort((a, b) => {
        const ra = rankingMap.get(a.nombre.toLowerCase());
        const rb = rankingMap.get(b.nombre.toLowerCase());
        if (!ra && !rb) return 0;
        if (!ra) return 1;
        if (!rb) return -1;
        return ra.posicion - rb.posicion;
      });
    } else if (sortBy === 'servicios') {
      filtered.sort((a, b) => (b.numero_servicios || 0) - (a.numero_servicios || 0));
    } else {
      filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return filtered;
  }, [data, searchTerm, zonaFilter, activityFilter, sortBy, rankingMap]);

  // Selected custodios based on current filtered view
  const selectedCustodios = useMemo(() => {
    return filteredData.filter(c => selectedIds.has(c.id));
  }, [filteredData, selectedIds]);
  
  const hasFilters = searchTerm || zonaFilter !== 'all' || activityFilter !== 'all' || sortBy !== 'nombre';
  
  const clearFilters = () => {
    setSearchTerm('');
    setZonaFilter('all');
    setActivityFilter('all');
    setSortBy('nombre');
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleOpenEditSheet = (custodio: CustodioProfile) => {
    setEditingCustodio(custodio);
    setEditSheetOpen(true);
  };

  const handleSaveEdit = async (id: string, zona: string, preferencia: PreferenciaTipoServicio) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('custodios_operativos')
        .update({ 
          zona_base: zona || null, 
          preferencia_tipo_servicio: preferencia,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
      toast.success('Datos actualizados correctamente');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating custodio:', error);
      toast.error('Error al actualizar datos');
      throw error;
    } finally {
      setIsSaving(false);
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

  const handleBajaMasivaSuccess = () => {
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });
    onRefresh?.();
  };

  const isAllSelected = filteredData.length > 0 && selectedIds.size === filteredData.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredData.length;
  
  const columns: ColumnDef<CustodioProfile>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={isAllSelected}
          // Use indeterminate for partial selection
          data-state={isSomeSelected ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'}
          onCheckedChange={toggleSelectAll}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelect(row.original.id)}
          aria-label={`Seleccionar ${row.original.nombre}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'nombre',
      header: 'Custodio',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-[180px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/perfiles-operativos/custodio/${row.original.id}`)}
              className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors"
            >
              {row.getValue('nombre')}
            </button>
            {row.original.estado === 'suspendido' && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Suspendido
              </Badge>
            )}
          </div>
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
        const zona = row.original.zona_base;
        const zonaLabel = zona ? (ZONAS_ABREVIADAS[zona] || zona) : '—';
        
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={cn(!zona && 'text-muted-foreground')}>{zonaLabel}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'nivel_actividad',
      header: 'Actividad',
      cell: ({ row }) => {
        const nivel = row.original.nivel_actividad;
        const dias = row.original.dias_sin_actividad;
        const config = activityBadgeConfig[nivel];
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge className={cn('text-xs font-normal', config.className)}>
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {dias >= 999 ? 'Sin servicios registrados' : `${dias} días sin actividad`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        const pref = row.original.preferencia_tipo_servicio || 'indistinto';
        const config = PREFERENCIA_ICONS[pref];
        const Icon = config.icon;
        
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{config.label}</span>
          </div>
        );
      },
    },
    {
      id: 'ranking',
      header: 'Ranking',
      cell: ({ row }) => {
        const nombre = row.original.nombre;
        const entry = rankingMap?.get(nombre.toLowerCase());
        if (!entry) return <span className="text-muted-foreground text-xs">—</span>;

        const tierConfig: Record<RankingTier, { icon: typeof Trophy; color: string; label: string }> = {
          gold: { icon: Trophy, color: 'text-amber-500', label: 'Top 10%' },
          silver: { icon: Medal, color: 'text-slate-400', label: 'Top 25%' },
          bronze: { icon: Award, color: 'text-orange-600', label: 'Top 50%' },
          standard: { icon: Award, color: 'text-muted-foreground', label: '' },
        };
        const tc = tierConfig[entry.tier];
        const Icon = tc.icon;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 justify-center">
                  <Icon className={cn('h-3.5 w-3.5', tc.color)} />
                  <span className={cn('font-medium text-sm', tc.color)}>#{entry.posicion}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Posición #{entry.posicion} de {entry.totalFlota} — Top {entry.percentil}% — Score: {entry.score}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
            {/* Edit button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleOpenEditSheet(custodio)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar zona/preferencia</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* View profile */}
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
            
            {/* Menu */}
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre A-Z</SelectItem>
              <SelectItem value="ranking">Mejor ranking</SelectItem>
              <SelectItem value="servicios">Más servicios</SelectItem>
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

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedIds.size} custodio{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              Limpiar selección
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowBajaMasivaModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Dar de baja masiva
            </Button>
          </div>
        </div>
      )}
      
      <DataTable columns={columns} data={filteredData} />

      {/* Quick Edit Sheet */}
      <QuickEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        operative={editingCustodio}
        onSave={handleSaveEdit}
        isLoading={isSaving}
      />

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

      {/* Bulk Deactivation Modal */}
      <BajaMasivaModal
        open={showBajaMasivaModal}
        onOpenChange={setShowBajaMasivaModal}
        operativos={selectedCustodios}
        operativoTipo="custodio"
        onSuccess={handleBajaMasivaSuccess}
      />
    </div>
  );
}
