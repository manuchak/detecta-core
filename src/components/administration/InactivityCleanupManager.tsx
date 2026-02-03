import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, UserX, Users, Calendar, Loader2 } from 'lucide-react';

interface InactiveCustodio {
  id: string;
  nombre: string;
  telefono: string | null;
  zona_base: string | null;
  fecha_ultimo_servicio: string | null;
  dias_sin_actividad: number | null;
}

const BATCH_SIZE = 50;
const INACTIVITY_OPTIONS = [
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
  { value: '120', label: '120 días' },
  { value: '150', label: '150 días' },
  { value: '180', label: '180 días' },
];

export default function InactivityCleanupManager() {
  const queryClient = useQueryClient();
  const [inactivityDays, setInactivityDays] = useState('120');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);

  // Fetch inactive custodians
  const { data: custodios = [], isLoading, refetch } = useQuery({
    queryKey: ['inactive-custodios', inactivityDays],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(inactivityDays));
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('custodios_operativos')
        .select('id, nombre, telefono, zona_base, fecha_ultimo_servicio')
        .eq('estado', 'activo')
        .or(`fecha_ultimo_servicio.is.null,fecha_ultimo_servicio.lt.${cutoffStr}`)
        .order('fecha_ultimo_servicio', { ascending: true, nullsFirst: true });

      if (error) throw error;

      // Calculate days of inactivity
      return (data || []).map((c): InactiveCustodio => {
        const dias = c.fecha_ultimo_servicio
          ? Math.floor((Date.now() - new Date(c.fecha_ultimo_servicio).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return { ...c, dias_sin_actividad: dias };
      });
    },
  });

  // Stats
  const noServiceCount = custodios.filter(c => c.fecha_ultimo_servicio === null).length;
  const withServiceCount = custodios.length - noServiceCount;

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === custodios.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(custodios.map(c => c.id)));
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

  // Batch deactivation
  const handleDeactivate = async () => {
    setShowConfirmDialog(false);
    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setCancelRequested(false);

    const selectedCustodios = custodios.filter(c => selectedIds.has(c.id));
    const totalBatches = Math.ceil(selectedCustodios.length / BATCH_SIZE);
    let successCount = 0;
    let errorCount = 0;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Error de autenticación');
      setIsProcessing(false);
      return;
    }

    for (let i = 0; i < totalBatches; i++) {
      if (cancelRequested) {
        toast.info(`Operación cancelada. ${successCount} custodios procesados.`);
        break;
      }

      const batch = selectedCustodios.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const batchIds = batch.map(c => c.id);

      try {
        // Update custodios_operativos
        const { error: updateError } = await supabase
          .from('custodios_operativos')
          .update({
            estado: 'inactivo',
            fecha_inactivacion: new Date().toISOString().split('T')[0],
            motivo_inactivacion: 'Dado de baja por inactividad',
            tipo_inactivacion: 'permanente',
            fecha_reactivacion_programada: null,
            updated_at: new Date().toISOString(),
          })
          .in('id', batchIds);

        if (updateError) throw updateError;

        // Insert history records
        const historyRecords = batch.map(c => ({
          operativo_id: c.id,
          operativo_tipo: 'custodio' as const,
          estatus_anterior: 'activo',
          estatus_nuevo: 'inactivo',
          tipo_cambio: 'permanente',
          motivo: 'Dado de baja por inactividad',
          notas: c.dias_sin_actividad 
            ? `Baja automática: ${c.dias_sin_actividad} días sin actividad`
            : 'Baja automática: Sin servicios registrados',
          creado_por: user.id,
        }));

        const { error: historyError } = await supabase
          .from('operativo_estatus_historial')
          .insert(historyRecords);

        if (historyError) {
          console.warn('Error recording history:', historyError);
        }

        successCount += batch.length;
      } catch (error) {
        console.error('Batch error:', error);
        errorCount += batch.length;
      }

      setProcessedCount(successCount);
      setProgress(((i + 1) / totalBatches) * 100);
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['custodios'] });
    queryClient.invalidateQueries({ queryKey: ['inactive-custodios'] });
    queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });

    setIsProcessing(false);
    setSelectedIds(new Set());

    if (errorCount === 0) {
      toast.success(`${successCount} custodios dados de baja exitosamente`);
    } else {
      toast.warning(`${successCount} procesados, ${errorCount} errores`);
    }

    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{custodios.length}</p>
                <p className="text-xs text-muted-foreground">Total inactivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{noServiceCount}</p>
                <p className="text-xs text-muted-foreground">Sin servicios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{withServiceCount}</p>
                <p className="text-xs text-muted-foreground">&gt;{inactivityDays} días</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Criterio:</span>
          <Select value={inactivityDays} onValueChange={setInactivityDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INACTIVITY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>

      {/* Progress bar during processing */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Procesando custodios...</span>
              <span>{processedCount} / {selectedIds.size}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setCancelRequested(true)}
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Custodios Inactivos</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={custodios.length > 0 && selectedIds.size === custodios.length}
                onCheckedChange={toggleSelectAll}
                disabled={isProcessing || custodios.length === 0}
              />
              <span className="text-sm text-muted-foreground">
                Seleccionar todos ({custodios.length})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : custodios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay custodios que cumplan el criterio de inactividad
            </div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Inactividad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custodios.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                          disabled={isProcessing}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.telefono || '-'}</TableCell>
                      <TableCell>{c.zona_base || '-'}</TableCell>
                      <TableCell>
                        {c.fecha_ultimo_servicio === null ? (
                          <Badge variant="destructive">Sin servicios</Badge>
                        ) : (
                          <Badge variant="secondary">{c.dias_sin_actividad} días</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action button */}
      <div className="flex justify-end">
        <Button
          variant="destructive"
          disabled={selectedIds.size === 0 || isProcessing}
          onClick={() => setShowConfirmDialog(true)}
        >
          <UserX className="h-4 w-4 mr-2" />
          Dar de baja seleccionados ({selectedIds.size})
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar baja masiva
            </DialogTitle>
            <DialogDescription>
              Estás a punto de dar de baja a <strong>{selectedIds.size} custodios</strong> por inactividad. 
              Esta acción:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Cambiará su estado a "inactivo"</li>
            <li>Registrará el motivo como "Dado de baja por inactividad"</li>
            <li>Creará un registro en el historial para cada custodio</li>
            <li>No eliminará ningún dato</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Confirmar baja ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
