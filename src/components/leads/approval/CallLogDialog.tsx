import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Clock, User, Calendar } from "lucide-react";
import { AssignedLead, ManualCallLog } from "@/types/leadTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead;
  onCallLogged: () => void;
}

export const CallLogDialog = ({
  open,
  onOpenChange,
  lead,
  onCallLogged
}: CallLogDialogProps) => {
  const [callOutcome, setCallOutcome] = useState<string>("");
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callOutcomeOptions = [
    { value: 'successful', label: 'Llamada exitosa - Candidato disponible', color: 'text-emerald-600' },
    { value: 'reschedule_requested', label: 'Candidato solicita reprogramar', color: 'text-blue-600' },
    { value: 'no_answer', label: 'No contestó', color: 'text-amber-600' },
    { value: 'busy', label: 'Línea ocupada', color: 'text-orange-600' },
    { value: 'voicemail', label: 'Buzón de voz', color: 'text-blue-600' },
    { value: 'wrong_number', label: 'Número equivocado', color: 'text-red-600' },
    { value: 'call_failed', label: 'Llamada falló', color: 'text-red-600' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callOutcome) {
      toast({
        title: "Error",
        description: "Por favor selecciona el resultado de la llamada",
        variant: "destructive"
      });
      return;
    }

    // Validar campos de reprogramación si es necesario
    if (callOutcome === 'reschedule_requested') {
      if (!rescheduleDate || !rescheduleTime) {
        toast({
          title: "Error",
          description: "Por favor selecciona fecha y hora para la reprogramación",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Preparar datos del insert
      const insertData: any = {
        lead_id: lead.lead_id,
        call_outcome: callOutcome,
        call_notes: callNotes || null,
      };

      // Solo incluir duración si la llamada no falló
      const failedOutcomes = ['call_failed', 'wrong_number', 'no_answer'];
      if (!failedOutcomes.includes(callOutcome) && callDuration) {
        insertData.call_duration_minutes = parseInt(callDuration);
      }

      // Agregar datos de reprogramación si aplica
      if (callOutcome === 'reschedule_requested' && rescheduleDate && rescheduleTime) {
        const scheduledDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
        insertData.scheduled_datetime = scheduledDateTime.toISOString();
        insertData.requires_reschedule = true;
      }

      const { error } = await supabase
        .from('manual_call_logs')
        .insert(insertData);

      if (error) throw error;

      const successMessage = callOutcome === 'reschedule_requested' 
        ? "Llamada registrada y reprogramada exitosamente"
        : "El resultado de la llamada ha sido guardado exitosamente";

      toast({
        title: "Llamada registrada",
        description: successMessage
      });

      onCallLogged();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error logging call:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la llamada. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCallOutcome("");
    setCallNotes("");
    setCallDuration("");
    setRescheduleDate("");
    setRescheduleTime("");
  };

  const selectedOption = callOutcomeOptions.find(option => option.value === callOutcome);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Registrar Llamada Manual
          </DialogTitle>
          <DialogDescription>
            Registra el resultado de tu llamada telefónica con el candidato
          </DialogDescription>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Información del Candidato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> {lead.lead_nombre}
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {lead.lead_telefono}
              </div>
              <div>
                <span className="font-medium">Email:</span> {lead.lead_email}
              </div>
              <div>
                <span className="font-medium">Estado:</span> {lead.lead_estado}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="outcome">Resultado de la llamada *</Label>
            <Select value={callOutcome} onValueChange={setCallOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el resultado de la llamada" />
              </SelectTrigger>
              <SelectContent>
                {callOutcomeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOption && (
              <p className={`text-sm ${selectedOption.color} mt-1`}>
                {callOutcome === 'successful' 
                  ? "✅ El candidato podrá continuar al formulario de completar información"
                  : "⚠️ Se requiere una llamada exitosa para continuar con el proceso"
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duración de la llamada (minutos)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="duration"
                type="number"
                placeholder="Ej: 5"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                className="pl-10"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas de la llamada</Label>
            <Textarea
              id="notes"
              placeholder="Describe brevemente la conversación, observaciones importantes, próximos pasos, etc."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={4}
            />
          </div>

          {callOutcome === 'reschedule_requested' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  Programar Nueva Llamada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reschedule-date">Fecha *</Label>
                    <Input
                      id="reschedule-date"
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reschedule-time">Hora *</Label>
                    <Input
                      id="reschedule-time"
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm text-blue-600">
                  📅 Se creará una nueva tarea programada para contactar al candidato en la fecha y hora especificada
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Registrar Llamada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};