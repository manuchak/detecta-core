import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, Mail, Users, HandCoins, AlertTriangle, Save } from 'lucide-react';
import { AgingData, useCreateSeguimiento } from '../../hooks/useCuentasPorCobrar';
import { useQueryClient } from '@tanstack/react-query';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { toast } from 'sonner';

interface SeguimientoCobranzaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: AgingData | null;
}

const TIPOS_ACCION = [
  { value: 'llamada', label: 'Llamada', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'visita', label: 'Visita', icon: Users },
  { value: 'promesa_pago', label: 'Promesa de Pago', icon: HandCoins },
  { value: 'escalamiento', label: 'Escalamiento', icon: AlertTriangle },
];

const RESULTADOS = [
  { value: 'exitoso', label: 'Exitoso' },
  { value: 'sin_respuesta', label: 'Sin respuesta' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'reprogramar', label: 'Reprogramar' },
];

export function SeguimientoCobranzaModal({ 
  open, 
  onOpenChange, 
  cliente 
}: SeguimientoCobranzaModalProps) {
  const queryClient = useQueryClient();
  const { createSeguimiento } = useCreateSeguimiento();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Standard persistence
  const persistence = useFormPersistence<{
    tipo_accion: string;
    descripcion: string;
    contacto_nombre: string;
    contacto_telefono: string;
    resultado: string;
    fecha_promesa_pago: string;
    monto_prometido: string;
    proxima_accion: string;
  }>({
    key: `seguimiento_cobranza_${cliente?.cliente_id || 'new'}`,
    initialData: {
      tipo_accion: 'llamada',
      descripcion: '',
      contacto_nombre: '',
      contacto_telefono: '',
      resultado: '',
      fecha_promesa_pago: '',
      monto_prometido: '',
      proxima_accion: '',
    },
    level: 'standard',
    isMeaningful: (data) => !!(data.descripcion || data.contacto_nombre),
  });

  const [formData, setFormData] = useState(persistence.data);

  // Sync to persistence
  useEffect(() => {
    persistence.updateData(formData);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    setIsSubmitting(true);
    try {
      await createSeguimiento({
        cliente_id: cliente.cliente_id,
        factura_id: null,
        tipo_accion: formData.tipo_accion,
        descripcion: formData.descripcion,
        contacto_nombre: formData.contacto_nombre || null,
        contacto_telefono: formData.contacto_telefono || null,
        resultado: formData.resultado || null,
        fecha_promesa_pago: formData.fecha_promesa_pago || null,
        monto_prometido: formData.monto_prometido ? parseFloat(formData.monto_prometido) : null,
        proxima_accion: formData.proxima_accion || null,
        promesa_cumplida: null,
      });

      toast.success('Seguimiento registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['cobranza-seguimiento'] });
      persistence.clearDraft(true);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        tipo_accion: 'llamada',
        descripcion: '',
        contacto_nombre: '',
        contacto_telefono: '',
        resultado: '',
        fecha_promesa_pago: '',
        monto_prometido: '',
        proxima_accion: '',
      });
    } catch (error) {
      console.error('Error creating seguimiento:', error);
      toast.error('Error al registrar el seguimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Registrar Seguimiento de Cobranza
          </DialogTitle>
          <DialogDescription>
            {cliente?.cliente_nombre} - Saldo: ${cliente?.saldo_pendiente?.toLocaleString('es-MX') || 0}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de acción */}
          <div className="space-y-2">
            <Label>Tipo de Acción</Label>
            <div className="flex gap-2 flex-wrap">
              {TIPOS_ACCION.map((tipo) => (
                <Button
                  key={tipo.value}
                  type="button"
                  variant={formData.tipo_accion === tipo.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, tipo_accion: tipo.value })}
                  className="gap-1.5"
                >
                  <tipo.icon className="h-3.5 w-3.5" />
                  {tipo.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input
                placeholder="Nombre del contacto"
                value={formData.contacto_nombre}
                onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="55 1234 5678"
                value={formData.contacto_telefono}
                onChange={(e) => setFormData({ ...formData, contacto_telefono: e.target.value })}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Textarea
              placeholder="Detalle de la gestión realizada..."
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              required
              rows={3}
            />
          </div>

          {/* Resultado */}
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select
              value={formData.resultado}
              onValueChange={(value) => setFormData({ ...formData, resultado: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar resultado" />
              </SelectTrigger>
              <SelectContent>
                {RESULTADOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Promesa de pago (si aplica) */}
          {formData.tipo_accion === 'promesa_pago' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>Fecha Promesa</Label>
                <Input
                  type="date"
                  value={formData.fecha_promesa_pago}
                  onChange={(e) => setFormData({ ...formData, fecha_promesa_pago: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monto Prometido</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.monto_prometido}
                  onChange={(e) => setFormData({ ...formData, monto_prometido: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Próxima acción */}
          <div className="space-y-2">
            <Label>Próxima Acción</Label>
            <Input
              type="date"
              value={formData.proxima_accion}
              onChange={(e) => setFormData({ ...formData, proxima_accion: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.descripcion}>
              <Save className="h-4 w-4 mr-1.5" />
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
