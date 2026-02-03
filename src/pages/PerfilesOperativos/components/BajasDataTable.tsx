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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, RefreshCw, Calendar, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [motivoFilter, setMotivoFilter] = useState<string>('todos');
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [confirmReactivate, setConfirmReactivate] = useState<BajaProfile | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm || 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.telefono && item.telefono.includes(searchTerm));
      
      const matchesTipo = tipoFilter === 'todos' || 
        (tipoFilter === 'temporal' && item.tipo_inactivacion === 'temporal') ||
        (tipoFilter === 'permanente' && item.tipo_inactivacion === 'permanente');
      
      const matchesMotivo = motivoFilter === 'todos' || 
        item.motivo_inactivacion === motivoFilter;
      
      return matchesSearch && matchesTipo && matchesMotivo;
    });
  }, [data, searchTerm, tipoFilter, motivoFilter]);

  const uniqueMotivos = useMemo(() => {
    const motivos = new Set(data.map(d => d.motivo_inactivacion).filter(Boolean));
    return Array.from(motivos) as string[];
  }, [data]);

  const handleReactivate = async (profile: BajaProfile) => {
    setReactivatingId(profile.id);
    try {
      // Update custodio status
      const { error: updateError } = await supabase
        .from('custodios_operativos')
        .update({
          estado: 'activo',
          fecha_inactivacion: null,
          motivo_inactivacion: null,
          tipo_inactivacion: null,
          fecha_reactivacion_programada: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Record in history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('operativo_estatus_historial')
        .insert({
          operativo_id: profile.id,
          operativo_tipo: 'custodio',
          estatus_anterior: profile.estado,
          estatus_nuevo: 'activo',
          tipo_cambio: 'reactivacion',
          motivo: 'Reactivación manual',
          notas: `Reactivado desde panel de bajas`,
          creado_por: user?.id
        });

      toast.success(`${profile.nombre} reactivado correctamente`);
      queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });
      onRefresh?.();
    } catch (error) {
      console.error('Error reactivating:', error);
      toast.error('Error al reactivar custodio');
    } finally {
      setReactivatingId(null);
      setConfirmReactivate(null);
    }
  };

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
        
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="temporal">Temporal</SelectItem>
            <SelectItem value="permanente">Permanente</SelectItem>
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
              <TableHead>Reactivación</TableHead>
              <TableHead className="w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserX className="h-8 w-8" />
                    <span>No hay custodios dados de baja</span>
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
                    <Badge 
                      variant={profile.tipo_inactivacion === 'temporal' ? 'secondary' : 'destructive'}
                      className="capitalize"
                    >
                      {profile.estado === 'suspendido' ? 'Suspendido' : 'Inactivo'}
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
                    {profile.fecha_reactivacion_programada ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(profile.fecha_reactivacion_programada), 'd MMM', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Permanente</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.tipo_inactivacion === 'temporal' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmReactivate(profile)}
                        disabled={reactivatingId === profile.id}
                      >
                        <RefreshCw className={`h-4 w-4 ${reactivatingId === profile.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmReactivate} onOpenChange={() => setConfirmReactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar custodio?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmReactivate && (
                <>
                  Se reactivará a <strong>{confirmReactivate.nombre}</strong> y volverá a estar disponible para asignaciones.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmReactivate && handleReactivate(confirmReactivate)}>
              Reactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
