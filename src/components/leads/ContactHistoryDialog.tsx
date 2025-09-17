// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, User, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { AssignedLead } from "@/types/leadTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ContactHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead;
}

interface ContactLog {
  id: string;
  call_outcome: string;
  call_notes: string | null;
  created_at: string;
  created_by: string;
  scheduled_datetime: string | null;
}

export const ContactHistoryDialog = ({
  open,
  onOpenChange,
  lead
}: ContactHistoryDialogProps) => {
  const [contactHistory, setContactHistory] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const outcomeColors = {
    'successful': 'bg-emerald-100 text-emerald-800',
    'reschedule_requested': 'bg-blue-100 text-blue-800',
    'no_answer': 'bg-amber-100 text-amber-800',
    'busy': 'bg-orange-100 text-orange-800',
    'voicemail': 'bg-blue-100 text-blue-800',
    'wrong_number': 'bg-red-100 text-red-800',
    'non_existent_number': 'bg-red-100 text-red-800',
    'call_failed': 'bg-red-100 text-red-800',
    'numero_no_disponible': 'bg-gray-100 text-gray-800'
  };

  const outcomeLabels = {
    'successful': 'Llamada exitosa',
    'reschedule_requested': 'Solicita reprogramar',
    'no_answer': 'No contestó',
    'busy': 'Línea ocupada',
    'voicemail': 'Buzón de voz',
    'wrong_number': 'Número equivocado',
    'non_existent_number': 'Número inexistente',
    'call_failed': 'Llamada falló',
    'numero_no_disponible': 'Número no disponible'
  };

  useEffect(() => {
    if (open && lead.lead_id) {
      fetchContactHistory();
    }
  }, [open, lead.lead_id]);

  const fetchContactHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_call_logs')
        .select(`
          id,
          call_outcome,
          call_notes,
          created_at,
          created_by,
          scheduled_datetime
        `)
        .eq('lead_id', lead.lead_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactHistory(data || []);
    } catch (error) {
      console.error('Error fetching contact history:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de contactos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Historial de Contactos
          </DialogTitle>
          <DialogDescription>
            Todos los intentos de contacto realizados para este candidato
          </DialogDescription>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {lead.lead_nombre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Teléfono:</span> {lead.lead_telefono}
              </div>
              <div>
                <span className="font-medium">Email:</span> {lead.lead_email}
              </div>
              <div>
                <span className="font-medium">Total de intentos:</span>
                <Badge variant="outline" className="ml-2">
                  {contactHistory.length}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Estado:</span> {lead.lead_estado}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Historial de llamadas</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando historial...</p>
            </div>
          ) : contactHistory.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay intentos de contacto registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contactHistory.map((contact, index) => (
                <Card key={contact.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className={outcomeColors[contact.call_outcome as keyof typeof outcomeColors] || 'bg-gray-100 text-gray-800'}
                          >
                            {outcomeLabels[contact.call_outcome as keyof typeof outcomeLabels] || contact.call_outcome}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Intento #{contactHistory.length - index}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(contact.created_at), "PPP 'a las' p", { locale: es })}
                        </div>
                        
                        {contact.call_notes && (
                          <div className="flex items-start gap-2 mt-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm bg-muted/50 p-3 rounded-lg flex-1">
                              {contact.call_notes}
                            </p>
                          </div>
                        )}
                        
                        {contact.scheduled_datetime && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              📅 Reprogramada para: {format(new Date(contact.scheduled_datetime), "PPP 'a las' p", { locale: es })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};