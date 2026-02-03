import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, UserX } from 'lucide-react';
import type { BajaProfile } from '../hooks/useOperativeProfiles';

interface BajasDataTableProps {
  data: BajaProfile[];
  onRefresh?: () => void;
}

const MOTIVO_LABELS: Record<string, string> = {
  'vacaciones': 'Vacaciones',
  'incapacidad_medica': 'Incapacidad Médica',
  'sancion_disciplinaria': 'Sanción Disciplinaria',
  'baja_voluntaria': 'Baja Voluntaria',
  'terminacion_relacion': 'Terminación Relación',
  'fallecimiento': 'Fallecimiento',
  'otro': 'Otro',
  'Dado de baja por inactividad': 'Inactividad',
};

export function BajasDataTable({ data }: BajasDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [motivoFilter, setMotivoFilter] = useState<string>('todos');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm || 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.telefono && item.telefono.includes(searchTerm));
      
      const matchesMotivo = motivoFilter === 'todos' || 
        item.motivo_inactivacion === motivoFilter;
      
      return matchesSearch && matchesMotivo;
    });
  }, [data, searchTerm, motivoFilter]);

  const uniqueMotivos = useMemo(() => {
    const motivos = new Set(data.map(d => d.motivo_inactivacion).filter(Boolean));
    return Array.from(motivos) as string[];
  }, [data]);

  const formatMotivoLabel = (motivo: string | null) => {
    if (!motivo) return '-';
    return MOTIVO_LABELS[motivo] || motivo;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={motivoFilter} onValueChange={setMotivoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Motivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los motivos</SelectItem>
            {uniqueMotivos.map(motivo => (
              <SelectItem key={motivo} value={motivo}>
                {formatMotivoLabel(motivo)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          {filteredData.length} de {data.length}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Fecha Baja</TableHead>
              <TableHead>Servicios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserX className="h-8 w-8" />
                    <span>No hay bajas definitivas registradas</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{profile.nombre}</p>
                      {profile.telefono && (
                        <p className="text-xs text-muted-foreground">{profile.telefono}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{profile.zona_base || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      Baja Definitiva
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatMotivoLabel(profile.motivo_inactivacion)}</span>
                  </TableCell>
                  <TableCell>
                    {profile.fecha_inactivacion ? (
                      <span className="text-sm">
                        {format(new Date(profile.fecha_inactivacion), 'd MMM yyyy', { locale: es })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{profile.numero_servicios || 0}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
