import { useState } from "react";
import { AlertCircle, Calendar, ChevronRight, Loader2, Wrench, Stethoscope, Users, BookOpen, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const UNAVAILABILITY_REASONS = [
  { id: 'falla_mecanica', icon: Wrench, label: 'Falla mecánica', sublabel: 'Carro en taller', color: 'text-orange-600 bg-orange-500/10' },
  { id: 'enfermedad', icon: Stethoscope, label: 'Enfermedad', sublabel: 'Incapacidad médica', color: 'text-red-600 bg-red-500/10' },
  { id: 'emergencia_familiar', icon: Users, label: 'Emergencia familiar', sublabel: 'Asunto personal', color: 'text-purple-600 bg-purple-500/10' },
  { id: 'capacitacion', icon: BookOpen, label: 'Capacitación', sublabel: 'Curso o entrenamiento', color: 'text-blue-600 bg-blue-500/10' },
  { id: 'otro', icon: HelpCircle, label: 'Otro motivo', sublabel: 'Especificar en notas', color: 'text-gray-600 bg-gray-500/10' },
];

const DURATION_OPTIONS = [
  { id: 'hoy', label: 'Solo hoy', days: 1 },
  { id: '2-3_dias', label: '2-3 días', days: 3 },
  { id: '1_semana', label: '1 semana', days: 7 },
  { id: 'indefinido', label: 'Hasta nuevo aviso', days: null },
];

interface ReportUnavailabilityCardProps {
  onReportUnavailability: (data: {
    tipo: string;
    motivo?: string;
    dias: number | null;
  }) => Promise<boolean>;
  isCurrentlyUnavailable?: boolean;
  currentUnavailability?: {
    tipo: string;
    fecha_fin?: string;
    motivo?: string;
  } | null;
  onCancelUnavailability?: () => Promise<boolean>;
}

const ReportUnavailabilityCard = ({
  onReportUnavailability,
  isCurrentlyUnavailable = false,
  currentUnavailability = null,
  onCancelUnavailability,
}: ReportUnavailabilityCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('hoy');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: 'Selecciona un motivo',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const duration = DURATION_OPTIONS.find(d => d.id === selectedDuration);
      const success = await onReportUnavailability({
        tipo: selectedReason,
        motivo: notas || undefined,
        dias: duration?.days ?? null,
      });

      if (success) {
        setDialogOpen(false);
        setSelectedReason('');
        setSelectedDuration('hoy');
        setNotas('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUnavailability = async () => {
    if (!onCancelUnavailability) return;
    
    setLoading(true);
    try {
      await onCancelUnavailability();
    } finally {
      setLoading(false);
    }
  };

  // Si ya está no disponible, mostrar estado actual
  if (isCurrentlyUnavailable && currentUnavailability) {
    const reason = UNAVAILABILITY_REASONS.find(r => r.id === currentUnavailability.tipo);
    const ReasonIcon = reason?.icon || AlertCircle;

    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <ReasonIcon className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-600">No disponible</p>
            <p className="text-sm text-muted-foreground">
              {reason?.label || currentUnavailability.tipo}
            </p>
            {currentUnavailability.fecha_fin && (
              <p className="text-xs text-muted-foreground mt-1">
                Hasta: {new Date(currentUnavailability.fecha_fin).toLocaleDateString('es-MX')}
              </p>
            )}
          </div>
          {onCancelUnavailability && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelUnavailability}
              disabled={loading}
              className="text-xs"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancelar'}
            </Button>
          )}
        </div>
        {currentUnavailability.motivo && (
          <p className="text-xs text-muted-foreground mt-2 pl-15">
            "{currentUnavailability.motivo}"
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left active:scale-[0.98]"
      >
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">¿No puedes trabajar?</p>
          <p className="text-sm text-muted-foreground">Reportar indisponibilidad</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reportar indisponibilidad</DialogTitle>
            <DialogDescription>
              Planeación verá tu estado y no te asignarán servicios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Motivo */}
            <div className="space-y-3">
              <Label>¿Cuál es el motivo?</Label>
              <div className="space-y-2">
                {UNAVAILABILITY_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReason(reason.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      selectedReason === reason.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", reason.color)}>
                      <reason.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{reason.label}</p>
                      <p className="text-xs text-muted-foreground">{reason.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duración */}
            <div className="space-y-3">
              <Label>¿Por cuánto tiempo?</Label>
              <RadioGroup value={selectedDuration} onValueChange={setSelectedDuration}>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                        selectedDuration === option.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={option.id} className="sr-only" />
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas adicionales (opcional)</Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Algún detalle que quieras compartir..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1 h-12"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700"
              disabled={loading || !selectedReason}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Reportar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportUnavailabilityCard;
