import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, User, Calendar as CalendarIcon, Clock, History, MessageSquare } from "lucide-react";
import { AssignedLead, ManualCallLog } from "@/types/leadTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ContactHistoryDialog } from "../ContactHistoryDialog";

interface CallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead;
  onCallLogged: () => void;
  onOpenCompleteInfo?: () => void;
}

export const CallLogDialog = ({
  open,
  onOpenChange,
  lead,
  onCallLogged,
  onOpenCompleteInfo
}: CallLogDialogProps) => {
  const [callOutcome, setCallOutcome] = useState<string>("");
  const [callNotes, setCallNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [contactAttempts, setContactAttempts] = useState(0);
  const [lastContactOutcome, setLastContactOutcome] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && lead.lead_id) {
      fetchContactSummary();
    }
  }, [open, lead.lead_id]);

  const fetchContactSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_call_logs')
        .select('call_outcome, created_at')
        .eq('lead_id', lead.lead_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setContactAttempts(data?.length || 0);
      setLastContactOutcome(data?.[0]?.call_outcome || null);
    } catch (error) {
      console.error('Error fetching contact summary:', error);
    }
  };

  const callOutcomeOptions = [
    { value: 'successful', label: 'Llamada exitosa - Candidato disponible', color: 'text-emerald-600' },
    { value: 'reschedule_requested', label: 'Candidato solicita reprogramar', color: 'text-blue-600' },
    { value: 'no_answer', label: 'No contestó', color: 'text-amber-600' },
    { value: 'busy', label: 'Línea ocupada', color: 'text-orange-600' },
    { value: 'voicemail', label: 'Buzón de voz', color: 'text-blue-600' },
    { value: 'wrong_number', label: 'Número equivocado', color: 'text-red-600' },
    { value: 'non_existent_number', label: 'Número inexistente', color: 'text-red-600' },
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
      if (!selectedDate || !selectedTime) {
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
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };


      // Agregar datos de reprogramación si aplica
      if (callOutcome === 'reschedule_requested' && selectedDate && selectedTime) {
        const scheduledDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
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

      // Si la llamada fue exitosa, abrir automáticamente el formulario de información
      if (callOutcome === 'successful' && onOpenCompleteInfo) {
        setTimeout(() => {
          onOpenCompleteInfo();
        }, 500); // Pequeño delay para que se cierre el diálogo actual primero
      }
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
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const selectedOption = callOutcomeOptions.find(option => option.value === callOutcome);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Candidato
              </div>
              {contactAttempts > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {contactAttempts} {contactAttempts === 1 ? 'intento' : 'intentos'}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                    className="text-sm"
                  >
                    <History className="h-4 w-4 mr-1" />
                    Ver historial
                  </Button>
                </div>
              )}
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
            
            {lastContactOutcome && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Último contacto:</span>
                  <Badge variant="outline" className="text-xs">
                    {callOutcomeOptions.find(opt => opt.value === lastContactOutcome)?.label || lastContactOutcome}
                  </Badge>
                </div>
              </div>
            )}
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
            <div className="mt-8 p-6 bg-card/50 rounded-2xl border-0 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-foreground mb-2">
                  Programar Nueva Llamada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecciona cuándo te gustaría contactar al candidato
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Fecha
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal rounded-xl border-input/50 hover:border-input",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0 shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => {
                          const day = date.getDay();
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today || day === 0 || day === 6;
                        }}
                        initialFocus
                        className="rounded-xl border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Hora
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {['09:00', '11:00', '14:00', '16:00'].map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        className={cn(
                          "h-10 rounded-xl border-input/50 hover:border-input transition-all duration-200",
                          selectedTime === time && "shadow-md"
                        )}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      min="09:00"
                      max="18:00"
                      className="h-10 rounded-xl border-input/50 focus:border-primary"
                      placeholder="O selecciona otra hora"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground text-center">
                  Horario laboral: Lunes a Viernes, 9:00 AM - 6:00 PM
                </p>
              </div>
            </div>
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
      
      <ContactHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        lead={lead}
      />
    </Dialog>
  );
};