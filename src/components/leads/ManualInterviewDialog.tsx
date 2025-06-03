
import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";

interface ManualInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onComplete: () => void;
}

export const ManualInterviewDialog = ({ open, onOpenChange, lead, onComplete }: ManualInterviewDialogProps) => {
  const [interviewNotes, setInterviewNotes] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [secondInterviewRequired, setSecondInterviewRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let stage = 'phone_interview';
      let finalDecision = null;
      
      if (decision === 'approved') {
        stage = 'approved';
        finalDecision = 'approved';
      } else if (decision === 'rejected') {
        stage = 'rejected';
        finalDecision = 'rejected';
      } else if (secondInterviewRequired) {
        stage = 'second_interview';
      }

      // Actualizar el proceso de aprobación
      const { error: approvalError } = await supabase.rpc('update_approval_process', {
        p_lead_id: lead.lead_id,
        p_stage: stage,
        p_interview_method: 'manual',
        p_notes: interviewNotes,
        p_decision: finalDecision,
        p_decision_reason: decisionReason
      });

      if (approvalError) throw approvalError;

      // Actualizar el estado del lead si fue aprobado o rechazado
      if (finalDecision) {
        const { error: leadError } = await supabase
          .from('leads')
          .update({
            estado: finalDecision === 'approved' ? 'aprobado' : 'rechazado',
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.lead_id);

        if (leadError) throw leadError;
      }

      toast({
        title: "Entrevista completada",
        description: "Los resultados de la entrevista han sido guardados.",
      });

      onComplete();
      onOpenChange(false);
      
      // Reset form
      setInterviewNotes('');
      setDecision('');
      setDecisionReason('');
      setSecondInterviewRequired(false);

    } catch (error) {
      console.error('Error saving interview results:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los resultados de la entrevista.",
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
