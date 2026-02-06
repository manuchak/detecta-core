/**
 * CambioEstatusModal - Modal for changing operative status (active/inactive)
 * Supports temporary and permanent deactivation with audit trail
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCambioEstatusOperativo } from '@/hooks/useCambioEstatusOperativo';
import { useFormPersistence } from '@/hooks/useFormPersistence';

const motivosBaja = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'incapacidad_medica', label: 'Incapacidad médica' },
  { value: 'sancion_disciplinaria', label: 'Sanción disciplinaria' },
  { value: 'baja_voluntaria', label: 'Baja voluntaria' },
  { value: 'terminacion_relacion', label: 'Terminación de relación' },
  { value: 'capacitacion', label: 'En capacitación' },
  { value: 'otro', label: 'Otro (especificar)' },
];

const motivosReactivacion = [
  { value: 'fin_vacaciones', label: 'Fin de vacaciones' },
  { value: 'alta_medica', label: 'Alta médica' },
  { value: 'fin_sancion', label: 'Fin de sanción' },
  { value: 'reincorporacion', label: 'Reincorporación' },
  { value: 'otro', label: 'Otro (especificar)' },
];

const formSchema = z.object({
  nuevoEstatus: z.enum(['activo', 'inactivo']),
  tipoCambio: z.enum(['temporal', 'permanente']).optional(),
  motivo: z.string().min(1, 'Selecciona un motivo'),
  fechaReactivacion: z.date().optional(),
  notas: z.string().optional(),
}).refine((data) => {
  if (data.nuevoEstatus === 'inactivo') {
    return !!data.tipoCambio;
  }
  return true;
}, {
  message: 'Selecciona el tipo de baja',
  path: ['tipoCambio'],
}).refine((data) => {
  if (data.nuevoEstatus === 'inactivo' && data.tipoCambio === 'temporal') {
    return !!data.fechaReactivacion;
  }
  return true;
}, {
  message: 'Selecciona la fecha de reactivación',
  path: ['fechaReactivacion'],
});

type FormData = z.infer<typeof formSchema>;

interface CambioEstatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operativo: {
    id: string;
    nombre: string;
    estado: string;
    tipo: 'custodio' | 'armado';
  };
  onSuccess?: () => void;
}

export function CambioEstatusModal({
  open,
  onOpenChange,
  operativo,
  onSuccess,
}: CambioEstatusModalProps) {
  const { cambiarEstatus, isLoading } = useCambioEstatusOperativo();
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const esActivo = operativo.estado === 'activo';
  
  // Light persistence for quick form
  const persistence = useFormPersistence<Partial<FormData>>({
    key: `cambio_estatus_${operativo.id}`,
    initialData: {},
    level: 'light',
    isMeaningful: (data) => !!(data.motivo || data.notas),
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nuevoEstatus: esActivo ? 'inactivo' : 'activo',
      tipoCambio: undefined,
      motivo: '',
      fechaReactivacion: undefined,
      notas: '',
    },
  });

  // Sync form to persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      persistence.updateData(values as Partial<FormData>);
    });
    return () => subscription.unsubscribe();
  }, [form, persistence.updateData]);

  const nuevoEstatus = form.watch('nuevoEstatus');
  const tipoCambio = form.watch('tipoCambio');
  const fechaReactivacion = form.watch('fechaReactivacion');

  const motivos = nuevoEstatus === 'inactivo' ? motivosBaja : motivosReactivacion;

  const handleSubmit = async (data: FormData) => {
    const success = await cambiarEstatus({
      operativoId: operativo.id,
      operativoTipo: operativo.tipo,
      operativoNombre: operativo.nombre,
      estatusAnterior: operativo.estado,
      estatusNuevo: data.nuevoEstatus,
      tipoCambio: data.tipoCambio || 'permanente',
      motivo: data.motivo,
      fechaReactivacion: data.fechaReactivacion,
      notas: data.notas,
    });

    if (success) {
      persistence.clearDraft(true);
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cambiar Estatus</DialogTitle>
          <DialogDescription>
            {operativo.nombre} ({operativo.tipo})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Estatus actual:</span>
            <Badge variant={esActivo ? 'default' : 'secondary'}>
              {operativo.estado}
            </Badge>
          </div>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label>Nuevo estatus</Label>
            <RadioGroup
              value={nuevoEstatus}
              onValueChange={(v) => form.setValue('nuevoEstatus', v as 'activo' | 'inactivo')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="activo" id="activo" disabled={esActivo} />
                <Label 
                  htmlFor="activo" 
                  className={cn("cursor-pointer", esActivo && "opacity-50")}
                >
                  <CheckCircle2 className="h-4 w-4 inline mr-1 text-success" />
                  Activo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactivo" id="inactivo" disabled={!esActivo} />
                <Label 
                  htmlFor="inactivo" 
                  className={cn("cursor-pointer", !esActivo && "opacity-50")}
                >
                  <AlertTriangle className="h-4 w-4 inline mr-1 text-warning" />
                  Inactivo
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Type of change (only for deactivation) */}
          {nuevoEstatus === 'inactivo' && (
            <div className="space-y-3">
              <Label>Tipo de baja</Label>
              <RadioGroup
                value={tipoCambio}
                onValueChange={(v) => form.setValue('tipoCambio', v as 'temporal' | 'permanente')}
                className="space-y-2"
              >
                <div 
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-all",
                    tipoCambio === 'temporal' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  )}
                  onClick={() => form.setValue('tipoCambio', 'temporal')}
                >
                  <RadioGroupItem value="temporal" id="temporal" />
                  <div>
                    <Label htmlFor="temporal" className="cursor-pointer font-medium">
                      Temporal
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Reactivar en fecha específica
                    </p>
                  </div>
                </div>
                <div 
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-all",
                    tipoCambio === 'permanente' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  )}
                  onClick={() => form.setValue('tipoCambio', 'permanente')}
                >
                  <RadioGroupItem value="permanente" id="permanente" />
                  <div>
                    <Label htmlFor="permanente" className="cursor-pointer font-medium">
                      Permanente
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Baja definitiva
                    </p>
                  </div>
                </div>
              </RadioGroup>
              {form.formState.errors.tipoCambio && (
                <p className="text-xs text-destructive">{form.formState.errors.tipoCambio.message}</p>
              )}
            </div>
          )}

          {/* Reactivation date (only for temporary) */}
          {nuevoEstatus === 'inactivo' && tipoCambio === 'temporal' && (
            <div className="space-y-3">
              <Label>Fecha de reactivación</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaReactivacion && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaReactivacion
                      ? format(fechaReactivacion, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaReactivacion}
                    onSelect={(date) => {
                      form.setValue('fechaReactivacion', date);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date < addDays(new Date(), 1)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.fechaReactivacion && (
                <p className="text-xs text-destructive">{form.formState.errors.fechaReactivacion.message}</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-3">
            <Label>Motivo</Label>
            <Select
              value={form.watch('motivo')}
              onValueChange={(v) => form.setValue('motivo', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivos.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.motivo && (
              <p className="text-xs text-destructive">{form.formState.errors.motivo.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label>Notas adicionales (opcional)</Label>
            <Textarea
              placeholder="Detalles adicionales sobre el cambio de estatus..."
              {...form.register('notas')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Confirmar Cambio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
