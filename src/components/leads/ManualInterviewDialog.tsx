
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManualInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onComplete: () => void;
  onReject?: (lead: any) => void;
}

export const ManualInterviewDialog = ({ open, onOpenChange, lead, onComplete, onReject }: ManualInterviewDialogProps) => {
  const [interviewNotes, setInterviewNotes] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead || !decision) return;
    
    // Si la decisión es rechazar, abrir el diálogo de razones de rechazo
    if (decision === 'rejected') {
      if (onReject && lead) {
        onOpenChange(false);
        onReject(lead);
        return;
      }
    }
    
    setLoading(true);

    try {
      // Determine the correct lead ID (handle both id and lead_id)
      const leadId = lead.id || lead.lead_id;
      if (!leadId) {
        throw new Error('No se pudo encontrar el ID del candidato');
      }

      // Prepare interview notes
      const fullInterviewNotes = `Notas de entrevista: ${interviewNotes || 'No se proporcionaron notas específicas'}\n\nDecisión: ${decision}\nRazón: ${decisionReason || 'No especificada'}`;
      
      // Determine new status based on decision
      const newStatus = decision === 'approved' ? 'approved' : 
                       decision === 'second_interview' ? 'second_interview_needed' : 'rejected';

      // Update approval process first
      const { error: approvalError } = await supabase.rpc('update_approval_process', {
        p_lead_id: leadId,
        p_stage: newStatus === 'approved' ? 'approved' : 'phone_interview',
        p_interview_method: 'manual',
        p_notes: fullInterviewNotes,
        p_decision: decision === 'approved' ? 'approved' : null,
        p_decision_reason: decisionReason
      });

      if (approvalError) {
        console.error('Error updating approval process:', approvalError);
        toast({
          title: "Error",
          description: "Error al actualizar el proceso de aprobación: " + approvalError.message,
          variant: "destructive",
        });
        return;
      }

      // Use the new secure RPC function to update lead state
      const { error: leadStateError } = await supabase.rpc('update_lead_state_after_interview', {
        p_lead_id: leadId,
        p_new_status: newStatus,
        p_interview_notes: fullInterviewNotes,
        p_rejection_reason: decision === 'rejected' ? decisionReason : null
      });

      if (leadStateError) {
        console.error('Error updating lead state:', leadStateError);
        // Still show success for process update but warn about status update
        toast({
          title: "Advertencia",
          description: "Proceso de entrevista guardado. Nota: El estado del candidato podría no haberse actualizado debido a permisos.",
          variant: "default",
        });
      } else {
        toast({
          title: "Entrevista completada",
          description: "Los resultados de la entrevista han sido guardados exitosamente.",
        });
      }

      onComplete();
      onOpenChange(false);
      
      // Reset form
      setInterviewNotes('');
      setDecision('');
      setDecisionReason('');

    } catch (error) {
      console.error('Error saving interview results:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los resultados de la entrevista: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Entrevista Manual
          </DialogTitle>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Candidato</CardTitle>
            <CardDescription>{lead?.lead_nombre}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Email:</strong> {lead?.lead_email}
              </div>
              <div>
                <strong>Teléfono:</strong> {lead?.lead_telefono}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notes">Notas de la entrevista *</Label>
            <Textarea
              id="notes"
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder="Escribe aquí las notas de la entrevista, respuestas del candidato, impresiones, etc."
              rows={5}
              required
            />
          </div>

          <div>
            <Label htmlFor="decision">Decisión *</Label>
            <Select value={decision} onValueChange={setDecision} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar decisión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Aprobar directamente
                  </div>
                </SelectItem>
                <SelectItem value="second_interview">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    Requiere segunda entrevista
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Rechazar
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(decision === 'approved' || decision === 'rejected') && (
            <div>
              <Label htmlFor="reason">Razón de la decisión *</Label>
              <Textarea
                id="reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Explica la razón de esta decisión..."
                rows={3}
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar resultados'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
