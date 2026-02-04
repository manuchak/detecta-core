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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Phone, Mail, AlertTriangle, Bell, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRegisterWorkflowAction } from '../../hooks/useCobranzaWorkflow';

interface RegistrarAccionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNombre: string;
  facturaId?: string;
  numeroFactura?: string;
}

const TIPOS_ACCION = [
  { value: 'llamada', label: 'Llamada telefónica', icon: Phone },
  { value: 'email', label: 'Correo electrónico', icon: Mail },
  { value: 'recordatorio', label: 'Recordatorio enviado', icon: Bell },
  { value: 'escalamiento', label: 'Escalamiento', icon: AlertTriangle },
  { value: 'visita', label: 'Visita presencial', icon: User },
  { value: 'otro', label: 'Otro', icon: MessageSquare },
];

const RESULTADOS = [
  { value: 'contactado', label: 'Contactado - Compromiso obtenido' },
  { value: 'no_contactado', label: 'No contestó / No disponible' },
  { value: 'buzon', label: 'Buzón de voz' },
  { value: 'rechazado', label: 'Rechazó pago / Sin intención' },
  { value: 'disputa', label: 'En disputa / Reclamo' },
  { value: 'pendiente', label: 'Pendiente de respuesta' },
];

export function RegistrarAccionModal({
  open,
  onOpenChange,
  clienteId,
  clienteNombre,
  facturaId,
  numeroFactura,
}: RegistrarAccionModalProps) {
  const [tipoAccion, setTipoAccion] = useState('llamada');
  const [descripcion, setDescripcion] = useState('');
  const [resultado, setResultado] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [proximaAccion, setProximaAccion] = useState<Date | undefined>(undefined);
  
  const registerAction = useRegisterWorkflowAction();

  useEffect(() => {
    if (open) {
      setTipoAccion('llamada');
      setDescripcion('');
      setResultado('');
      setContactoNombre('');
      setContactoTelefono('');
      setProximaAccion(undefined);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoAccion || !descripcion) return;

    await registerAction.mutateAsync({
      cliente_id: clienteId,
      factura_id: facturaId,
      tipo_accion: tipoAccion,
      descripcion,
      resultado: resultado || undefined,
      contacto_nombre: contactoNombre || undefined,
      contacto_telefono: contactoTelefono || undefined,
      proxima_accion: proximaAccion ? format(proximaAccion, 'yyyy-MM-dd') : undefined,
    });

    onOpenChange(false);
  };

  const isValid = tipoAccion && descripcion.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Registrar Acción de Cobranza
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
          {/* Tipo de acción */}
          <div className="space-y-2">
            <Label>Tipo de Acción *</Label>
            <Select value={tipoAccion} onValueChange={setTipoAccion}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACCION.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex items-center gap-2">
                      <tipo.icon className="h-4 w-4" />
                      {tipo.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle de la acción realizada..."
              rows={3}
            />
          </div>

          {/* Resultado */}
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select value={resultado} onValueChange={setResultado}>
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

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contacto-nombre">Contactó a</Label>
              <Input
                id="contacto-nombre"
                value={contactoNombre}
                onChange={(e) => setContactoNombre(e.target.value)}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto-telefono">Teléfono</Label>
              <Input
                id="contacto-telefono"
                value={contactoTelefono}
                onChange={(e) => setContactoTelefono(e.target.value)}
                placeholder="Teléfono"
              />
            </div>
          </div>

          {/* Próxima acción */}
          <div className="space-y-2">
            <Label>Programar Siguiente Acción</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !proximaAccion && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {proximaAccion 
                    ? format(proximaAccion, 'PPP', { locale: es }) 
                    : 'Seleccionar fecha (opcional)'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={proximaAccion}
                  onSelect={setProximaAccion}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
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
              disabled={!isValid || registerAction.isPending}
            >
              {registerAction.isPending ? 'Guardando...' : 'Registrar Acción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
