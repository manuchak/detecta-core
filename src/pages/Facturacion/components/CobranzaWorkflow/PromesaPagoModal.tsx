import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, HandCoins, User, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreatePromesaPago } from '../../hooks/useCobranzaWorkflow';
import { formatCurrency } from '@/utils/formatUtils';

interface PromesaPagoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNombre: string;
  facturaId?: string;
  numeroFactura?: string;
  montoSugerido?: number;
}

export function PromesaPagoModal({
  open,
  onOpenChange,
  clienteId,
  clienteNombre,
  facturaId,
  numeroFactura,
  montoSugerido = 0,
}: PromesaPagoModalProps) {
  const [monto, setMonto] = useState(montoSugerido.toString());
  const [fecha, setFecha] = useState<Date | undefined>(undefined);
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const createPromesa = useCreatePromesaPago();

  useEffect(() => {
    if (open) {
      setMonto(montoSugerido.toString());
      setFecha(undefined);
      setContactoNombre('');
      setContactoTelefono('');
      setDescripcion('');
    }
  }, [open, montoSugerido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fecha || !monto) return;

    await createPromesa.mutateAsync({
      cliente_id: clienteId,
      factura_id: facturaId,
      monto_prometido: parseFloat(monto),
      fecha_promesa: format(fecha, 'yyyy-MM-dd'),
      contacto_nombre: contactoNombre || undefined,
      contacto_telefono: contactoTelefono || undefined,
      descripcion: descripcion || undefined,
    });

    onOpenChange(false);
  };

  const isValid = fecha && parseFloat(monto) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-purple-600" />
            Registrar Promesa de Pago
          </DialogTitle>
          <DialogDescription>
            {clienteNombre}
            {numeroFactura && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                Factura: {numeroFactura}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto prometido */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto Prometido *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            {montoSugerido > 0 && (
              <p className="text-xs text-muted-foreground">
                Saldo pendiente: {formatCurrency(montoSugerido)}
              </p>
            )}
          </div>

          {/* Fecha de promesa */}
          <div className="space-y-2">
            <Label>Fecha de Pago Prometida *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !fecha && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? format(fecha, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={setFecha}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contacto-nombre" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Contacto
              </Label>
              <Input
                id="contacto-nombre"
                value={contactoNombre}
                onChange={(e) => setContactoNombre(e.target.value)}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto-telefono" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Teléfono
              </Label>
              <Input
                id="contacto-telefono"
                value={contactoTelefono}
                onChange={(e) => setContactoTelefono(e.target.value)}
                placeholder="Teléfono"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Notas / Observaciones</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales sobre la promesa de pago..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createPromesa.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createPromesa.isPending ? 'Guardando...' : 'Registrar Promesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
