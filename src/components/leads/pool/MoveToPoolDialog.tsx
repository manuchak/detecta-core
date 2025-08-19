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

// Estados de la República Mexicana para ubicación geográfica
const ESTADOS_MEXICO = [
  { id: 'aguascalientes', name: 'Aguascalientes', description: 'Estado de Aguascalientes' },
  { id: 'baja_california', name: 'Baja California', description: 'Estado de Baja California' },
  { id: 'baja_california_sur', name: 'Baja California Sur', description: 'Estado de Baja California Sur' },
  { id: 'campeche', name: 'Campeche', description: 'Estado de Campeche' },
  { id: 'chiapas', name: 'Chiapas', description: 'Estado de Chiapas' },
  { id: 'chihuahua', name: 'Chihuahua', description: 'Estado de Chihuahua' },
  { id: 'ciudad_de_mexico', name: 'Ciudad de México', description: 'Ciudad de México' },
  { id: 'coahuila', name: 'Coahuila', description: 'Estado de Coahuila' },
  { id: 'colima', name: 'Colima', description: 'Estado de Colima' },
  { id: 'durango', name: 'Durango', description: 'Estado de Durango' },
  { id: 'estado_de_mexico', name: 'Estado de México', description: 'Estado de México' },
  { id: 'guanajuato', name: 'Guanajuato', description: 'Estado de Guanajuato' },
  { id: 'guerrero', name: 'Guerrero', description: 'Estado de Guerrero' },
  { id: 'hidalgo', name: 'Hidalgo', description: 'Estado de Hidalgo' },
  { id: 'jalisco', name: 'Jalisco', description: 'Estado de Jalisco' },
  { id: 'michoacan', name: 'Michoacán', description: 'Estado de Michoacán' },
  { id: 'morelos', name: 'Morelos', description: 'Estado de Morelos' },
  { id: 'nayarit', name: 'Nayarit', description: 'Estado de Nayarit' },
  { id: 'nuevo_leon', name: 'Nuevo León', description: 'Estado de Nuevo León' },
  { id: 'oaxaca', name: 'Oaxaca', description: 'Estado de Oaxaca' },
  { id: 'puebla', name: 'Puebla', description: 'Estado de Puebla' },
  { id: 'queretaro', name: 'Querétaro', description: 'Estado de Querétaro' },
  { id: 'quintana_roo', name: 'Quintana Roo', description: 'Estado de Quintana Roo' },
  { id: 'san_luis_potosi', name: 'San Luis Potosí', description: 'Estado de San Luis Potosí' },
  { id: 'sinaloa', name: 'Sinaloa', description: 'Estado de Sinaloa' },
  { id: 'sonora', name: 'Sonora', description: 'Estado de Sonora' },
  { id: 'tabasco', name: 'Tabasco', description: 'Estado de Tabasco' },
  { id: 'tamaulipas', name: 'Tamaulipas', description: 'Estado de Tamaulipas' },
  { id: 'tlaxcala', name: 'Tlaxcala', description: 'Estado de Tlaxcala' },
  { id: 'veracruz', name: 'Veracruz', description: 'Estado de Veracruz' },
  { id: 'yucatan', name: 'Yucatán', description: 'Estado de Yucatán' },
  { id: 'zacatecas', name: 'Zacatecas', description: 'Estado de Zacatecas' }
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
    const selectedStateObj = ESTADOS_MEXICO.find(s => s.id === stateId);
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
            <Label htmlFor="estado">Estado de ubicación del candidato</Label>
            <Select
              value={selectedState}
              onValueChange={handleStateChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado de ubicación" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_MEXICO.map((state) => (
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