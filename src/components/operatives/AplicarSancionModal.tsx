/**
 * AplicarSancionModal - Modal for applying sanctions to operatives
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Shield } from 'lucide-react';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftAutoRestorePrompt';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCatalogoSanciones, useAplicarSancion, type CatalogoSancion } from '@/hooks/useSanciones';

const formSchema = z.object({
  sancionId: z.string().min(1, 'Selecciona un tipo de sanción'),
  diasSuspension: z.number().min(0, 'Mínimo 0 días'),
  puntosPerdidos: z.number().min(0, 'Mínimo 0 puntos'),
  notas: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AplicarSancionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operativo: {
    id: string;
    nombre: string;
    tipo: 'custodio' | 'armado';
  };
  servicioRelacionadoId?: string;
  onSuccess?: () => void;
}

const categoriaBadgeColors: Record<string, string> = {
  leve: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  moderada: 'bg-warning/10 text-warning border-warning/30',
  grave: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  muy_grave: 'bg-destructive/10 text-destructive border-destructive/30',
};

export function AplicarSancionModal({
  open,
  onOpenChange,
  operativo,
  servicioRelacionadoId,
  onSuccess,
}: AplicarSancionModalProps) {
  const { data: catalogo, isLoading: loadingCatalogo } = useCatalogoSanciones();
  const { mutate: aplicarSancion, isPending } = useAplicarSancion();
  
  const [selectedSancion, setSelectedSancion] = useState<CatalogoSancion | null>(null);
  
  // Light persistence
  const persistence = useFormPersistence<Partial<FormData>>({
    key: `aplicar_sancion_${operativo.id}`,
    initialData: {},
    level: 'light',
    isMeaningful: (data) => !!(data.sancionId || data.notas),
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sancionId: '',
      diasSuspension: 0,
      puntosPerdidos: 0,
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

  const diasSuspension = form.watch('diasSuspension');
  const fechaInicio = new Date();
  const fechaFin = addDays(fechaInicio, diasSuspension || 0);

  const handleSancionChange = (sancionId: string) => {
    form.setValue('sancionId', sancionId);
    const sancion = catalogo?.find(s => s.id === sancionId);
    if (sancion) {
      setSelectedSancion(sancion);
      form.setValue('diasSuspension', sancion.dias_suspension_default);
      form.setValue('puntosPerdidos', sancion.puntos_score_perdidos);
    }
  };

  const handleSubmit = (data: FormData) => {
    aplicarSancion({
      operativoId: operativo.id,
      operativoTipo: operativo.tipo,
      sancionId: data.sancionId,
      diasSuspension: data.diasSuspension,
      puntosPerdidos: data.puntosPerdidos,
      servicioRelacionadoId,
      notas: data.notas,
    }, {
      onSuccess: () => {
        persistence.clearDraft(true);
        onOpenChange(false);
        form.reset();
        setSelectedSancion(null);
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Aplicar Sanción
          </DialogTitle>
          <DialogDescription>
            {operativo.nombre} ({operativo.tipo})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Sanction Type */}
          <div className="space-y-3">
            <Label>Tipo de sanción *</Label>
            <Select
              value={form.watch('sancionId')}
              onValueChange={handleSancionChange}
              disabled={loadingCatalogo}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCatalogo ? "Cargando..." : "Seleccionar tipo"} />
              </SelectTrigger>
              <SelectContent>
                {catalogo?.map((sancion) => (
                  <SelectItem key={sancion.id} value={sancion.id}>
                    <div className="flex items-center gap-2">
                      <span>{sancion.nombre}</span>
                      <Badge 
                        variant="outline" 
                        className={categoriaBadgeColors[sancion.categoria]}
                      >
                        {sancion.categoria.replace('_', ' ')}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.sancionId && (
              <p className="text-xs text-destructive">{form.formState.errors.sancionId.message}</p>
            )}
          </div>

          {/* Selected sanction details */}
          {selectedSancion && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Categoría:</span>
                <Badge 
                  variant="outline" 
                  className={categoriaBadgeColors[selectedSancion.categoria]}
                >
                  {selectedSancion.categoria.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              {selectedSancion.descripcion && (
                <p className="text-xs text-muted-foreground">
                  {selectedSancion.descripcion}
                </p>
              )}
            </div>
          )}

          {/* Days and Points */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Días de suspensión</Label>
              <Input
                type="number"
                min={0}
                {...form.register('diasSuspension', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Puntos a descontar</Label>
              <Input
                type="number"
                min={0}
                {...form.register('puntosPerdidos', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Calculated dates */}
          {diasSuspension > 0 && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Fechas de suspensión:</p>
                  <p className="text-muted-foreground">
                    Inicio: {format(fechaInicio, "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  <p className="text-muted-foreground">
                    Fin: {format(fechaFin, "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Detalles adicionales sobre la sanción..."
              {...form.register('notas')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isPending || !selectedSancion}
            >
              {isPending ? 'Aplicando...' : 'Aplicar Sanción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
