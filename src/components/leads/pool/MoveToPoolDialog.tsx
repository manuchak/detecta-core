import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AssignedLead } from "@/types/leadTypes";
import { useToast } from "@/hooks/use-toast";

interface MoveToPoolDialogProps {
  lead: AssignedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (leadId: string, poolState: string, motivo: string) => Promise<boolean>;
}

// Estados del pool de reserva en lugar de zonas
const POOL_STATES = [
  { id: 'zona_saturada', name: 'Zona Saturada', description: 'La zona preferida está completa' },
  { id: 'documentacion_pendiente', name: 'Documentación Pendiente', description: 'Esperando completar documentos' },
  { id: 'segunda_entrevista', name: 'Segunda Entrevista Programada', description: 'Esperando segunda evaluación' },
  { id: 'disponibilidad_futura', name: 'Disponibilidad Futura', description: 'Candidato disponible en fecha posterior' },
  { id: 'capacitacion_requerida', name: 'Capacitación Requerida', description: 'Necesita entrenamiento previo' },
  { id: 'evaluacion_medica', name: 'Evaluación Médica Pendiente', description: 'Esperando exámenes médicos' },
];

export const MoveToPoolDialog = ({
  lead,
  open,
  onOpenChange,
  onConfirm
}: MoveToPoolDialogProps) => {
  const [selectedState, setSelectedState] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset form when opening
      setSelectedState("");
      setMotivo("");
    }
  }, [open, lead]);

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    const selectedStateObj = POOL_STATES.find(s => s.id === stateId);
    if (selectedStateObj) {
      setMotivo(selectedStateObj.description);
    }
  };

  const handleConfirm = async () => {
    if (!lead || !selectedState) return;

    setLoading(true);
    try {
      const success = await onConfirm(lead.lead_id, selectedState, motivo);
      if (success) {
        onOpenChange(false);
        toast({
          title: "Candidato movido al pool",
          description: `${lead.lead_nombre} ha sido movido al pool de reserva exitosamente.`,
        });
      }
    } catch (error) {
      console.error('Error moving to pool:', error);
      toast({
        title: "Error",
        description: "No se pudo mover el candidato al pool",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover al Pool de Reserva</DialogTitle>
          <DialogDescription>
            Vas a mover a <strong>{lead.lead_nombre}</strong> al pool de reserva. 
            Selecciona el estado y especifica el motivo del movimiento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="estado">Estado del candidato en pool</Label>
            <Select
              value={selectedState}
              onValueChange={handleStateChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado del candidato" />
              </SelectTrigger>
              <SelectContent>
                {POOL_STATES.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{state.name}</span>
                      <span className="text-xs text-muted-foreground">{state.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Detalles adicionales (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Agrega detalles específicos sobre el estado del candidato..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedState || loading}
          >
            {loading ? "Moviendo..." : "Mover al Pool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};