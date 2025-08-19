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
  onConfirm: (leadId: string, zonaId: string, motivo: string) => Promise<boolean>;
}

// Lista estática de zonas comunes (se puede expandir después)
const ZONES = [
  { id: 'zona-norte', name: 'Zona Norte' },
  { id: 'zona-sur', name: 'Zona Sur' },
  { id: 'zona-centro', name: 'Zona Centro' },
  { id: 'zona-este', name: 'Zona Este' },
  { id: 'zona-oeste', name: 'Zona Oeste' },
];

export const MoveToPoolDialog = ({
  lead,
  open,
  onOpenChange,
  onConfirm
}: MoveToPoolDialogProps) => {
  const [selectedZona, setSelectedZona] = useState<string>("");
  const [motivo, setMotivo] = useState("Zona saturada");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Reset form when opening
      setSelectedZona(lead?.zona_preferida_id || "");
      setMotivo("Zona saturada");
    }
  }, [open, lead]);

  const handleConfirm = async () => {
    if (!lead || !selectedZona) return;

    setLoading(true);
    try {
      const success = await onConfirm(lead.lead_id, selectedZona, motivo);
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
            Selecciona la zona y el motivo del movimiento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="zona">Zona de destino</Label>
            <Select
              value={selectedZona}
              onValueChange={setSelectedZona}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una zona" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((zona) => (
                  <SelectItem key={zona.id} value={zona.id}>
                    {zona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del movimiento</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo del movimiento al pool..."
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
            disabled={!selectedZona || !motivo.trim() || loading}
          >
            {loading ? "Moviendo..." : "Mover al Pool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};