import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, AlertTriangle, Phone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCallScheduling } from "@/hooks/useCallScheduling";
import { AssignedLead } from "@/types/leadTypes";

interface InterruptedInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead | null;
  sessionId?: string;
  recoveredData?: Record<string, any>;
  onConfirm: () => void;
}

const INTERRUPTION_REASONS = [
  { value: 'signal_loss', label: 'Pérdida de señal telefónica' },
  { value: 'technical_issues', label: 'Problemas técnicos' },
  { value: 'external_interruption', label: 'Interrupción externa' },
  { value: 'candidate_request', label: 'Solicitud del candidato' },
  { value: 'emergency', label: 'Emergencia' },
  { value: 'other', label: 'Otro motivo' }
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export const InterruptedInterviewDialog = ({
  open,
  onOpenChange,
  lead,
  sessionId,
  recoveredData,
  onConfirm
}: InterruptedInterviewDialogProps) => {
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState<Date>();
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [willReschedule, setWillReschedule] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  const { rescheduleInterruptedCall } = useCallScheduling();

  const handleConfirm = async () => {
    if (!lead || !reason) return;

    setIsLoading(true);
    try {
      const finalReason = reason === 'other' ? customReason : 
        INTERRUPTION_REASONS.find(r => r.value === reason)?.label || reason;

      // Si eligió reprogramar, crear la cita
      if (willReschedule && rescheduleDate && rescheduleTime) {
        const [hours, minutes] = rescheduleTime.split(':');
        const scheduledDateTime = new Date(rescheduleDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

        await rescheduleInterruptedCall({
          leadId: lead.lead_id,
          fecha: scheduledDateTime,
          motivo: finalReason,
          sessionId: sessionId || crypto.randomUUID()
        });
      }

      onConfirm();
      onOpenChange(false);
      
      // Reset form
      setReason('');
      setCustomReason('');
      setRescheduleDate(undefined);
      setRescheduleTime('');
      setWillReschedule(true);
    } catch (error) {
      console.error('Error al manejar entrevista interrumpida:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead) return null;

  const hasRecoveredData = recoveredData && Object.keys(recoveredData).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Entrevista Interrumpida
          </DialogTitle>
          <DialogDescription>
            La entrevista con <strong>{lead.lead_nombre}</strong> se ha interrumpido.
            {hasRecoveredData && (
              <span className="block mt-2 text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                ✓ Se ha guardado el progreso de la entrevista automáticamente
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Razón de la interrupción */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la interrupción *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el motivo..." />
              </SelectTrigger>
              <SelectContent>
                {INTERRUPTION_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo personalizado para "otro" */}
          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Especifica el motivo</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe el motivo de la interrupción..."
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Opción de reprogramar */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="willReschedule"
                checked={willReschedule}
                onChange={(e) => setWillReschedule(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="willReschedule" className="text-sm font-medium">
                Reprogramar la llamada
              </Label>
            </div>

            {willReschedule && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !rescheduleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {rescheduleDate ? (
                          format(rescheduleDate, "PPP", { locale: es })
                        ) : (
                          "Seleccionar fecha"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={rescheduleDate}
                        onSelect={setRescheduleDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Hora *</Label>
                  <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de datos guardados */}
          {hasRecoveredData && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Progreso guardado
                </span>
              </div>
              <p className="text-xs text-green-700">
                La información recolectada durante la entrevista se ha guardado automáticamente.
                {willReschedule ? 
                  ' Al reprogramar, podrás continuar desde donde se quedó.' :
                  ' Los datos estarán disponibles para la próxima sesión.'
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!reason || (reason === 'other' && !customReason) || 
                     (willReschedule && (!rescheduleDate || !rescheduleTime)) ||
                     isLoading}
          >
            {isLoading ? 'Procesando...' : willReschedule ? 'Reprogramar' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};