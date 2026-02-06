import React, { useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RotateCcw, 
  Calendar, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useComodatosGPS } from '@/hooks/useComodatosGPS';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DevolucionForm } from '@/types/comodatos';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftAutoRestorePrompt';

const devolucionSchema = z.object({
  fecha_devolucion_real: z.string().min(1, 'Selecciona la fecha de devolución'),
  condiciones_devolucion: z.string().optional(),
  observaciones: z.string().optional()
});

interface DevolucionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comodatoId: string | null;
}

export const DevolucionDialog: React.FC<DevolucionDialogProps> = ({
  open,
  onOpenChange,
  comodatoId
}) => {
  const { procesarDevolucion } = useComodatosGPS();

  // Form persistence
  const persistence = useFormPersistence<Partial<DevolucionForm>>({
    key: `devolucion_gps_${comodatoId || 'unknown'}`,
    level: 'light',
    initialData: {},
    isMeaningful: (data) => !!(data?.condiciones_devolucion || data?.observaciones),
  });

  // Query para obtener detalles del comodato
  const { data: comodato, isLoading } = useQuery({
    queryKey: ['comodato-detalle', comodatoId],
    queryFn: async () => {
      if (!comodatoId) return null;
      
      const { data, error } = await supabase
        .from('comodatos_gps')
        .select('*')
        .eq('id', comodatoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!comodatoId && open
  });

  const form = useForm<DevolucionForm>({
    resolver: zodResolver(devolucionSchema),
    defaultValues: {
      fecha_devolucion_real: new Date().toISOString().split('T')[0],
      ...persistence.data,
    }
  });

  // Sync form to persistence
  const formValues = form.watch();
  useEffect(() => {
    if (open) {
      persistence.updateData(formValues);
    }
  }, [formValues, open]);

  const onSubmit = async (data: DevolucionForm) => {
    if (!comodatoId) return;
    
    try {
      await procesarDevolucion.mutateAsync({
        comodatoId,
        formData: data
      });
      persistence.clearDraft(true);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al procesar devolución:', error);
    }
  };

  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      persistence.confirmDiscard();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, persistence]);

  if (!comodatoId) return null;

  const getCustodioDisplay = () => {
    if (comodato?.custodio_operativo_nombre) {
      return {
        nombre: comodato.custodio_operativo_nombre,
        tipo: 'Operativo',
        contacto: comodato.custodio_operativo_telefono
      };
    } else if (comodato?.pc_custodio_id) {
      return {
        nombre: 'Custodio de Planeación',
        tipo: 'Planeación',
        contacto: 'ID: ' + comodato.pc_custodio_id
      };
    }
    return null;
  };

  const custodioInfo = getCustodioDisplay();
  const fechaAsignacion = comodato ? new Date(comodato.fecha_asignacion) : null;
  const fechaDevolucionProgramada = comodato ? new Date(comodato.fecha_devolucion_programada) : null;
  const hoy = new Date();
  
  const diasAsignado = fechaAsignacion 
    ? Math.floor((hoy.getTime() - fechaAsignacion.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const diasVencido = fechaDevolucionProgramada 
    ? Math.floor((hoy.getTime() - fechaDevolucionProgramada.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const estaVencido = diasVencido > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Procesar Devolución de GPS
            <DraftIndicator lastSaved={persistence.lastSaved} />
          </DialogTitle>
          <DialogDescription>
            Registra la devolución del GPS y actualiza el inventario
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Cargando información del comodato...</div>
        ) : !comodato ? (
          <div className="text-center py-8 text-destructive">
            No se pudo cargar la información del comodato
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información del GPS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del GPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Producto:</span>
                    <div className="font-medium">GPS - {comodato.numero_serie_gps}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Número de Serie:</span>
                    <div className="font-medium">{comodato.numero_serie_gps}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado Actual:</span>
                    <Badge variant={estaVencido ? 'destructive' : 'default'}>
                      {comodato.estado}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Producto:</span>
                    <div className="font-medium">
                      {comodato.producto_gps_id}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del Custodio */}
            {custodioInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Custodio Asignado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <div className="font-medium">{custodioInfo.nombre}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <div className="font-medium">{custodioInfo.tipo}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contacto:</span>
                      <div className="font-medium">{custodioInfo.contacto || 'No disponible'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Asignado por:</span>
                      <div className="font-medium">{comodato.asignado_por || 'Desconocido'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información de Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cronología del Comodato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fecha de Asignación:</span>
                    <div className="font-medium">
                      {fechaAsignacion ? format(fechaAsignacion, 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha Programada:</span>
                    <div className="font-medium">
                      {fechaDevolucionProgramada ? format(fechaDevolucionProgramada, 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Días Asignado:</span>
                    <div className="font-medium">{diasAsignado} días</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado de Entrega:</span>
                    <div className={`font-medium ${estaVencido ? 'text-destructive' : 'text-success'}`}>
                      {estaVencido ? `Vencido ${diasVencido} días` : 'En tiempo'}
                    </div>
                  </div>
                </div>

                {estaVencido && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      Este GPS está vencido desde hace {diasVencido} días
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Formulario de Devolución */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Datos de Devolución
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fecha_devolucion_real">Fecha Real de Devolución *</Label>
                  <Input
                    id="fecha_devolucion_real"
                    type="date"
                    {...form.register('fecha_devolucion_real')}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {form.formState.errors.fecha_devolucion_real && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.fecha_devolucion_real.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="condiciones_devolucion">Condiciones de Devolución</Label>
                  <Textarea
                    id="condiciones_devolucion"
                    {...form.register('condiciones_devolucion')}
                    placeholder="Describe el estado del GPS al momento de la devolución..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    {...form.register('observaciones')}
                    placeholder="Observaciones adicionales sobre la devolución..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información Original de Asignación */}
            {comodato.condiciones_asignacion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Condiciones Originales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {comodato.condiciones_asignacion}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={procesarDevolucion.isPending}
              >
                {procesarDevolucion.isPending ? 'Procesando...' : 'Procesar Devolución'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};