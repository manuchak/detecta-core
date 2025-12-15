import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { MaintenanceStatus, MaintenanceType } from "@/hooks/useCustodianMaintenance";

interface RecordMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: MaintenanceStatus | null;
  currentKm: number;
  onConfirm: (data: {
    tipo_mantenimiento: MaintenanceType;
    km_al_momento: number;
    costo_estimado?: number;
    taller_mecanico?: string;
    notas?: string;
  }) => Promise<boolean>;
}

const RecordMaintenanceDialog = ({
  open,
  onOpenChange,
  maintenance,
  currentKm,
  onConfirm,
}: RecordMaintenanceDialogProps) => {
  const [km, setKm] = useState(currentKm.toString());
  const [costo, setCosto] = useState("");
  const [taller, setTaller] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!maintenance) return;
    
    setLoading(true);
    try {
      await onConfirm({
        tipo_mantenimiento: maintenance.tipo,
        km_al_momento: parseInt(km) || currentKm,
        costo_estimado: costo ? parseFloat(costo) : undefined,
        taller_mecanico: taller || undefined,
        notas: notas || undefined,
      });
    } finally {
      setLoading(false);
      // Reset form
      setCosto("");
      setTaller("");
      setNotas("");
    }
  };

  if (!maintenance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{maintenance.icono}</span>
            {maintenance.nombre}
          </DialogTitle>
          <DialogDescription>
            ¿Realizaste este mantenimiento?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Km actual */}
          <div className="space-y-2">
            <Label htmlFor="km">Kilometraje actual *</Label>
            <Input
              id="km"
              type="number"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="Ej: 45000"
              className="h-12 text-lg"
            />
          </div>

          {/* Costo (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="costo">Costo aproximado (opcional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="costo"
                type="number"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                placeholder="0.00"
                className="h-12 pl-8"
              />
            </div>
          </div>

          {/* Taller (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="taller">Taller o mecánico (opcional)</Label>
            <Input
              id="taller"
              value={taller}
              onChange={(e) => setTaller(e.target.value)}
              placeholder="Ej: Taller López"
              className="h-12"
            />
          </div>

          {/* Notas (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Algún comentario sobre el servicio..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 h-12 gap-2"
            disabled={loading || !km}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordMaintenanceDialog;
