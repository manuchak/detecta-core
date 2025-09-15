
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Phone, Loader2, CheckCircle, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VapiCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onCallComplete: () => void;
}

export const VapiCallDialog = ({ open, onOpenChange, lead, onCallComplete }: VapiCallDialogProps) => {
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const { toast } = useToast();

  const initiateVapiCall = async () => {
    if (!lead.lead_telefono) {
      toast({
        title: "Error",
        description: "El candidato no tiene número de teléfono registrado.",
        variant: "destructive",
      });
      return;
    }

    setCalling(true);
    setCallStatus('Iniciando llamada...');

    try {
      // Llamada a la función edge de Supabase que manejará la integración con VAPI
      const { data, error } = await supabase.functions.invoke('vapi-call', {
        body: {
          phoneNumber: lead.lead_telefono,
          leadId: lead.lead_id,
          leadName: lead.lead_nombre,
          assistantId: '0b7c2a96-0360-4fef-9956-e847fd696ea2'
        }
      });

      if (error) throw error;

      setCallStatus('Llamada iniciada exitosamente');
      
      // Crear registro en la base de datos
      await supabase.rpc('create_vapi_call_log', {
        p_lead_id: lead.lead_id,
        p_vapi_call_id: data.callId,
        p_phone_number: lead.lead_telefono
      });

      toast({
        title: "Llamada iniciada",
        description: "La llamada con VAPI ha sido iniciada exitosamente.",
      });

      onCallComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Error initiating VAPI call:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la llamada con VAPI.",
        variant: "destructive",
      });
      setCallStatus('Error al iniciar la llamada');
    } finally {
      setCalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Llamada con VAPI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidato</CardTitle>
              <CardDescription>{lead?.lead_nombre}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{lead?.lead_telefono}</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Bot className="h-3 w-3 mr-1" />
                  Asistente VAPI
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Entrevista Automatizada con IA
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-3 w-3" />
                  <span>Evaluación estructurada automática</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="h-3 w-3" />
                  <span>Duración: 8-12 minutos</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-3 w-3" />
                  <span>Scoring inteligente (1-10)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-800">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Detección automática de red flags</span>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <Phone className="h-3 w-3" />
                  <span>Grabación y transcripción completa</span>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <Bot className="h-3 w-3" />
                  <span>Decisión automática al finalizar</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-white/50 rounded border-l-4 border-blue-400">
              <p className="text-xs text-blue-900 font-medium">
                💡 El asistente evaluará: experiencia, disponibilidad, confiabilidad, comunicación y detectará posibles problemas automáticamente.
              </p>
            </div>
          </div>

          {callStatus && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{callStatus}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={calling}
            >
              Cancelar
            </Button>
            <Button 
              onClick={initiateVapiCall}
              disabled={calling}
            >
              {calling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Iniciar llamada
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
