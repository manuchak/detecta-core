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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Search, Eye, Phone, MapPin, Star, Shield, Building2, AlertTriangle, X, Filter, Clock,
  Home, Plane, CircleDot, Edit, UserX
} from 'lucide-react';
import { ArmadoProfile } from '../hooks/useOperativeProfiles';
import { QuickEditSheet, PreferenciaTipoServicio } from './QuickEditSheet';
import { BajaMasivaModal } from './BajaMasivaModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

interface ArmadosDataTableProps {
  data: ArmadoProfile[];
  onRefresh?: () => void;
}

const tipoArmadoConfig: Record<string, { label: string; className: string }> = {
  interno: { label: 'Interno', className: 'bg-corporate-blue/10 text-corporate-blue' },
  externo: { label: 'Externo', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  proveedor: { label: 'Proveedor', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' }
};

const activityBadgeConfig: Record<string, { label: string; className: string }> = {
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

export function ArmadosDataTable({ data, onRefresh }: ArmadosDataTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [zonaFilter, setZonaFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBajaMasivaModal, setShowBajaMasivaModal] = useState(false);
  
  // Quick Edit Sheet state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingArmado, setEditingArmado] = useState<ArmadoProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get unique zones for filter
  const zones = useMemo(() => {
    const uniqueZones = [...new Set(data.map(a => a.zona_base).filter(Boolean))];
    return uniqueZones.sort() as string[];
  }, [data]);
  
  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(armado => {
      const matchesSearch = !searchTerm || 
        armado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        armado.telefono?.includes(searchTerm) ||
        armado.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesZona = zonaFilter === 'all' || armado.zona_base === zonaFilter;
      const matchesTipo = tipoFilter === 'all' || armado.tipo_armado === tipoFilter;
      const matchesActivity = activityFilter === 'all' || armado.nivel_actividad === activityFilter;
      
      return matchesSearch && matchesZona && matchesTipo && matchesActivity;
    });
  }, [data, searchTerm, zonaFilter, tipoFilter, activityFilter]);
  
  // Get selected armados for modal
  const selectedArmados = useMemo(() => {
    return filteredData.filter(a => selectedIds.has(a.id));
  }, [filteredData, selectedIds]);
  
  const hasFilters = searchTerm || zonaFilter !== 'all' || tipoFilter !== 'all' || activityFilter !== 'activo';
  
  const clearFilters = () => {
    setSearchTerm('');
    setZonaFilter('all');
    setTipoFilter('all');
    setActivityFilter('activo');
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredData.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBajaMasivaSuccess = () => {
    setSelectedIds(new Set());
    onRefresh?.();
  };

  const handleOpenEditSheet = (armado: ArmadoProfile) => {
    setEditingArmado(armado);
    setEditSheetOpen(true);
  };

  const handleSaveEdit = async (id: string, zona: string, preferencia: PreferenciaTipoServicio) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('armados_operativos')
        .update({ 
          zona_base: zona || null, 
          preferencia_tipo_servicio: preferencia,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['armados-con-proximidad'] });
      toast.success('Datos actualizados correctamente');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating armado:', error);
      toast.error('Error al actualizar datos');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check if license is expiring soon
  const getLicenseStatus = (fechaVencimiento: string | null): { status: 'ok' | 'warning' | 'expired' | 'unknown'; label: string } => {
    if (!fechaVencimiento) return { status: 'unknown', label: 'Sin info' };
    
    const diasRestantes = differenceInDays(parseISO(fechaVencimiento), new Date());
    
    if (diasRestantes < 0) return { status: 'expired', label: 'Vencida' };
    if (diasRestantes <= 30) return { status: 'warning', label: `${diasRestantes}d` };
    return { status: 'ok', label: 'Vigente' };
  };

  // Check if all visible items are selected
  const allSelected = filteredData.length > 0 && filteredData.every(a => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0 && !allSelected;
  
  const columns: ColumnDef<ArmadoProfile>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          aria-label="Seleccionar todos"
          className={cn(someSelected && 'data-[state=checked]:bg-primary/50')}
          {...(someSelected ? { 'data-state': 'indeterminate' } : {})}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(checked) => handleSelectOne(row.original.id, !!checked)}
          aria-label={`Seleccionar ${row.original.nombre}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'nombre',
      header: 'Armado',
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
      accessorKey: 'tipo_armado',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.tipo_armado;
        const config = tipoArmadoConfig[tipo] || tipoArmadoConfig.interno;
        return (
          <Badge className={cn('text-xs font-normal', config.className)}>
            {row.original.origen === 'proveedor' && <Building2 className="h-3 w-3 mr-1" />}
            {config.label}
          </Badge>
        );
      },
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
        const config = activityBadgeConfig[nivel] || activityBadgeConfig.sin_actividad;
        return (
          <Badge className={cn('text-xs font-normal', config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'dias_sin_actividad',
      header: 'Días',
      cell: ({ row }) => {
        const dias = row.original.dias_sin_actividad;
        const label = dias >= 999 ? 'N/A' : `${dias}d`;
        return (
          <span className={cn(
            'text-sm',
            dias >= 90 && 'text-destructive font-medium'
          )}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: 'preferencia_tipo_servicio',
      header: 'Preferencia',
      cell: ({ row }) => {
        const pref = (row.original.preferencia_tipo_servicio || 'indistinto') as PreferenciaTipoServicio;
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
      accessorKey: 'licencia_portacion',
      header: 'Licencia',
      cell: ({ row }) => {
        const { status, label } = getLicenseStatus(row.original.fecha_vencimiento_licencia);
        
        const statusConfig = {
          ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          unknown: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
        };
        
        return (
          <Badge className={cn('text-xs font-normal', statusConfig[status])}>
            {status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {label}
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
      accessorKey: 'score_total',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.getValue('score_total') as number | null;
        if (score === null) return <span className="text-muted-foreground">—</span>;
        const color = score >= 80 ? 'text-emerald-600' : 
                     score >= 60 ? 'text-amber-600' : 'text-red-600';
        return (
          <div className={cn('text-center font-medium flex items-center justify-center gap-1', color)}>
            <Shield className="h-3 w-3" />
            {score.toFixed(0)}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const armado = row.original;
        
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
                    onClick={() => handleOpenEditSheet(armado)}
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
                    onClick={() => navigate(`/perfiles-operativos/armado/${armado.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver perfil forense</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="space-y-4">
      {/* Selection Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border animate-in slide-in-from-top-2">
          <span className="text-sm font-medium">
            {selectedIds.size} armado{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowBajaMasivaModal(true)}
            >
              <UserX className="h-4 w-4 mr-1" />
              Dar de baja masiva
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[160px]">
              <Clock className="h-4 w-4 mr-1" />
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
          
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="interno">Interno</SelectItem>
              <SelectItem value="externo">Externo</SelectItem>
              <SelectItem value="proveedor">Proveedor</SelectItem>
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

      {/* Quick Edit Sheet */}
      <QuickEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        operative={editingArmado}
        onSave={handleSaveEdit}
        isLoading={isSaving}
      />

      {/* Bulk Deactivation Modal */}
      <BajaMasivaModal
        open={showBajaMasivaModal}
        onOpenChange={setShowBajaMasivaModal}
        operativos={selectedArmados}
        operativoTipo="armado"
        onSuccess={handleBajaMasivaSuccess}
      />
    </div>
  );
}
