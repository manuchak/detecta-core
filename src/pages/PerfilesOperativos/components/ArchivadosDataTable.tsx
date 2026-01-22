import { useState, useMemo } from 'react';
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
  Search, RotateCcw, Shield, Users, Calendar, Filter, X 
} from 'lucide-react';
import { ArchivedProfile } from '../hooks/useOperativeProfiles';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArchivadosDataTableProps {
  data: ArchivedProfile[];
}

export function ArchivadosDataTable({ data }: ArchivadosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  
  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(profile => {
      const matchesSearch = !searchTerm || 
        profile.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.telefono?.includes(searchTerm);
      
      const matchesTipo = tipoFilter === 'all' || profile.personal_tipo === tipoFilter;
      
      return matchesSearch && matchesTipo;
    });
  }, [data, searchTerm, tipoFilter]);
  
  const hasFilters = searchTerm || tipoFilter !== 'all';
  
  const clearFilters = () => {
    setSearchTerm('');
    setTipoFilter('all');
  };
  
  const columns: ColumnDef<ArchivedProfile>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue('nombre')}</span>
          {row.original.telefono && (
            <span className="text-xs text-muted-foreground">{row.original.telefono}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'personal_tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.original.personal_tipo;
        return (
          <Badge variant="outline" className="text-xs">
            {tipo === 'custodio' ? (
              <><Shield className="h-3 w-3 mr-1" /> Custodio</>
            ) : (
              <><Users className="h-3 w-3 mr-1" /> Armado</>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'motivo_archivo',
      header: 'Motivo de Baja',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue('motivo_archivo')}
        </span>
      ),
    },
    {
      accessorKey: 'fecha_archivo',
      header: 'Fecha de Archivo',
      cell: ({ row }) => {
        const fecha = row.getValue('fecha_archivo') as string;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {format(parseISO(fecha), "d 'de' MMM, yyyy", { locale: es })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        if (!row.original.puede_reactivar) {
          return <span className="text-xs text-muted-foreground">No reactivable</span>;
        }
        
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement reactivation
              console.log('Reactivar:', row.original.id);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reactivar
          </Button>
        );
      },
    },
  ];
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No hay personal archivado</p>
        <p className="text-sm">El personal dado de baja aparecerá aquí</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="custodio">Custodios</SelectItem>
              <SelectItem value="armado">Armados</SelectItem>
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
            {filteredData.length} archivado(s)
          </Badge>
        </div>
      </div>
      
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
