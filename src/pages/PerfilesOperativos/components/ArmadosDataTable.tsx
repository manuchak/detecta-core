import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search, Eye, Phone, MapPin, Star, Shield, Building2, AlertTriangle, X, Filter, Clock 
} from 'lucide-react';
import { ArmadoProfile } from '../hooks/useOperativeProfiles';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

interface ArmadosDataTableProps {
  data: ArmadoProfile[];
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

export function ArmadosDataTable({ data }: ArmadosDataTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [zonaFilter, setZonaFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('activo');
  
  // Get unique zones for filter
  const zones = useMemo(() => {
    const uniqueZones = [...new Set(data.map(a => a.zona_base).filter(Boolean))];
    return uniqueZones.sort() as string[];
  }, [data]);
  
  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(armado => {
      // Search filter
      const matchesSearch = !searchTerm || 
        armado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        armado.telefono?.includes(searchTerm) ||
        armado.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Zone filter
      const matchesZona = zonaFilter === 'all' || armado.zona_base === zonaFilter;
      
      // Type filter
      const matchesTipo = tipoFilter === 'all' || armado.tipo_armado === tipoFilter;
      
      // Activity filter
      const matchesActivity = activityFilter === 'all' || armado.nivel_actividad === activityFilter;
      
      return matchesSearch && matchesZona && matchesTipo && matchesActivity;
    });
  }, [data, searchTerm, zonaFilter, tipoFilter, activityFilter]);
  
  const hasFilters = searchTerm || zonaFilter !== 'all' || tipoFilter !== 'all' || activityFilter !== 'activo';
  
  const clearFilters = () => {
    setSearchTerm('');
    setZonaFilter('all');
    setTipoFilter('all');
    setActivityFilter('activo');
  };
  
  // Check if license is expiring soon
  const getLicenseStatus = (fechaVencimiento: string | null): { status: 'ok' | 'warning' | 'expired' | 'unknown'; label: string } => {
    if (!fechaVencimiento) return { status: 'unknown', label: 'Sin info' };
    
    const diasRestantes = differenceInDays(parseISO(fechaVencimiento), new Date());
    
    if (diasRestantes < 0) return { status: 'expired', label: 'Vencida' };
    if (diasRestantes <= 30) return { status: 'warning', label: `${diasRestantes}d` };
    return { status: 'ok', label: 'Vigente' };
  };
  
  const columns: ColumnDef<ArmadoProfile>[] = [
    {
      accessorKey: 'nombre',
      header: 'Armado',
      cell: ({ row }) => (
        <div className="flex flex-col">
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
      accessorKey: 'zona_base',
      header: 'Zona',
      cell: ({ row }) => {
        const zona = row.getValue('zona_base') as string | null;
        if (!zona) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{zona}</span>
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
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs font-normal', statusConfig[status])}>
              {status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {label}
            </Badge>
          </div>
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
      accessorKey: 'fecha_ultimo_servicio',
      header: 'Último Servicio',
      cell: ({ row }) => {
        const dias = row.original.dias_sin_actividad;
        if (dias === 999) return <span className="text-muted-foreground">Nunca</span>;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{dias === 0 ? 'Hoy' : dias === 1 ? 'Ayer' : `hace ${dias}d`}</span>
          </div>
        );
      },
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
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/perfiles-operativos/armado/${row.original.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  
  return (
    <div className="space-y-4">
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
    </div>
  );
}
