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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, UserX, Eye, Shield, User, RefreshCw } from 'lucide-react';
import { BajaDetailsDialog } from './BajaDetailsDialog';
import { ReactivacionMasivaModal } from './ReactivacionMasivaModal';
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

export function BajasDataTable({ data, onRefresh }: BajasDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [motivoFilter, setMotivoFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [selectedCustodio, setSelectedCustodio] = useState<BajaProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reactivacionModalOpen, setReactivacionModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm || 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.telefono && item.telefono.includes(searchTerm));
      
      const matchesMotivo = motivoFilter === 'todos' || 
        item.motivo_inactivacion === motivoFilter;
      
      const matchesTipo = tipoFilter === 'todos' || 
        item.tipo_personal === tipoFilter;
      
      return matchesSearch && matchesMotivo && matchesTipo;
    });
  }, [data, searchTerm, motivoFilter, tipoFilter]);

  const uniqueMotivos = useMemo(() => {
    const motivos = new Set(data.map(d => d.motivo_inactivacion).filter(Boolean));
    return Array.from(motivos) as string[];
  }, [data]);

  const formatMotivoLabel = (motivo: string | null) => {
    if (!motivo) return '-';
    return MOTIVO_LABELS[motivo] || motivo;
  };

  const getUniqueKey = (profile: BajaProfile) => `${profile.tipo_personal}-${profile.id}`;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredData.map(getUniqueKey)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (profile: BajaProfile, checked: boolean) => {
    const key = getUniqueKey(profile);
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(key);
    } else {
      newSet.delete(key);
    }
    setSelectedIds(newSet);
  };

  const selectedOperativos = useMemo(() => {
    return filteredData.filter(p => selectedIds.has(getUniqueKey(p)));
  }, [filteredData, selectedIds]);

  const handleReactivacionSuccess = () => {
    setSelectedIds(new Set());
    onRefresh?.();
  };

  const allSelected = filteredData.length > 0 && filteredData.every(p => selectedIds.has(getUniqueKey(p)));
  const someSelected = filteredData.some(p => selectedIds.has(getUniqueKey(p)));

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="custodio">Custodios</SelectItem>
            <SelectItem value="armado">Armados</SelectItem>
          </SelectContent>
        </Select>

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

        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReactivacionModalOpen(true)}
            className="gap-2 ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Reactivar ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todos"
                  className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Fecha Baja</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserX className="h-8 w-8" />
                    <span>No hay bajas registradas</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((profile) => (
                <TableRow 
                  key={getUniqueKey(profile)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(getUniqueKey(profile))}
                      onCheckedChange={(checked) => handleSelectOne(profile, checked as boolean)}
                      aria-label={`Seleccionar ${profile.nombre}`}
                    />
                  </TableCell>
                  <TableCell 
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    <div>
                      <p className="font-medium">{profile.nombre}</p>
                      {profile.telefono && (
                        <p className="text-xs text-muted-foreground">{profile.telefono}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    {profile.tipo_personal === 'armado' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Armado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        Custodio
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    <span className="text-sm">{profile.zona_base || '-'}</span>
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    <Badge variant="destructive">
                      Baja Definitiva
                    </Badge>
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    <span className="text-sm">{formatMotivoLabel(profile.motivo_inactivacion)}</span>
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    {profile.fecha_inactivacion ? (
                      <span className="text-sm">
                        {format(new Date(profile.fecha_inactivacion), 'd MMM yyyy', { locale: es })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    <span className="text-sm font-medium">{profile.numero_servicios || 0}</span>
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      setSelectedCustodio(profile);
                      setDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <BajaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        custodio={selectedCustodio}
        onReactivated={handleReactivacionSuccess}
      />

      {/* Mass Reactivation Modal */}
      <ReactivacionMasivaModal
        open={reactivacionModalOpen}
        onOpenChange={setReactivacionModalOpen}
        operativos={selectedOperativos}
        onSuccess={handleReactivacionSuccess}
      />
    </div>
  );
}
