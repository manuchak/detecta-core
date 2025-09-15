import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAutoSaveForm } from "@/hooks/useAutoSaveForm";
import { CheckCircle, Clock, AlertCircle, Phone, XCircle } from "lucide-react";

interface ManualInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onComplete: () => void;
  onReject?: (lead: any) => void;
}

export const ManualInterviewDialog = ({ open, onOpenChange, lead, onComplete, onReject }: ManualInterviewDialogProps) => {
  const { toast } = useToast();
  const [interviewNotes, setInterviewNotes] = useState('');
  const [decision, setDecision] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // Auto-save functionality
  const {
    formData,
    updateFormData,
    saveProgress,
    clearProgress,
    autoSaveState,
  } = useAutoSaveForm({
    leadId: lead?.id || lead?.lead_id || '',
    interval: 10000, // 10 seconds
    onAutoSave: (data) => {
      // Silent auto-save, no toast notification to avoid UI clutter
      console.log('Auto-saved interview progress:', data);
    },
    onRecover: (data) => {
      if (data.interviewNotes || data.decision || data.decisionReason) {
        setShowRecoveryBanner(true);
        setInterviewNotes(data.interviewNotes || '');
        setDecision(data.decision || '');
        setDecisionReason(data.decisionReason || '');
      }
    },
  });

  // Debounced field update handlers for better performance
  const handleNotesChange = useCallback((value: string) => {
    setInterviewNotes(value);
    updateFormData('interviewNotes', value);
  }, [updateFormData]);

  const handleDecisionChange = useCallback((value: string) => {
    setDecision(value);
    updateFormData('decision', value);
  }, [updateFormData]);

  const handleReasonChange = useCallback((value: string) => {
    setDecisionReason(value);
    updateFormData('decisionReason', value);
  }, [updateFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead || !decision) return;
    
    if (!interviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa las notas de la entrevista",
        variant: "destructive",
      });
      return;
    }

    // Reject the lead if the decision is "rejected"
    if (decision === 'rejected') {
      if (onReject && lead) {
        onOpenChange(false);
        onReject(lead);
        return;
      }
    }

    if ((decision === 'rejected' || decision === 'approved') && !decisionReason.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona una razón para tu decisión",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Determine the correct lead ID (handle both id and lead_id)
      const leadId = lead.id || lead.lead_id;
      if (!leadId) {
        throw new Error('No se pudo encontrar el ID del candidato');
      }

      // Prepare interview notes
      const fullInterviewNotes = `Notas de entrevista: ${interviewNotes}\n\nDecisión: ${decision}\nRazón: ${decisionReason || 'No especificada'}`;
      
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

      // Clear auto-saved progress on successful completion
      await clearProgress();

      onComplete();
      onOpenChange(false);
      
      // Reset form
      setInterviewNotes('');
      setDecision('');
      setDecisionReason('');
      setShowRecoveryBanner(false);

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

  const handleCancel = useCallback(async () => {
    if (autoSaveState.hasUnsavedChanges) {
      // Save progress before closing
      await saveProgress();
      toast({
        title: "Progreso guardado",
        description: "Tu progreso ha sido guardado automáticamente",
      });
    }
    onOpenChange(false);
  }, [autoSaveState.hasUnsavedChanges, saveProgress, onOpenChange, toast]);

  // Auto-save indicator component
  const AutoSaveIndicator = useMemo(() => {
    if (autoSaveState.isSaving) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Guardando...</span>
        </div>
      );
    }
    
    if (autoSaveState.lastSaved) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>
            Guardado a las {new Date(autoSaveState.lastSaved).toLocaleTimeString()}
          </span>
        </div>
      );
    }
    
    if (autoSaveState.hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span>Cambios sin guardar</span>
        </div>
      );
    }
    
    return null;
  }, [autoSaveState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Entrevista Manual
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Registra los resultados de la entrevista telefónica manual</span>
            {AutoSaveIndicator}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recovery banner */}
          {showRecoveryBanner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Progreso recuperado
                  </p>
                  <p className="text-sm text-blue-700">
                    Se ha restaurado el progreso de tu entrevista anterior
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecoveryBanner(false)}
                  className="shrink-0"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidato</CardTitle>
              <CardDescription>{lead?.lead_nombre || lead?.nombre}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Email:</strong> {lead?.lead_email || lead?.email}
                </div>
                <div>
                  <strong>Teléfono:</strong> {lead?.lead_telefono || lead?.telefono}
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
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Escribe aquí las notas de la entrevista, respuestas del candidato, impresiones, etc."
                rows={5}
                required
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="decision">Decisión *</Label>
              <Select value={decision} onValueChange={handleDecisionChange} required>
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
                  onChange={(e) => handleReasonChange(e.target.value)}
                  placeholder="Explica la razón de esta decisión..."
                  rows={3}
                  required
                  className="min-h-[80px]"
                />
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                * Los cambios se guardan automáticamente cada 10 segundos
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {autoSaveState.hasUnsavedChanges ? "Guardar y salir" : "Cancelar"}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Completar entrevista'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};