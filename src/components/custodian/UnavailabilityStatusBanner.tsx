import { AlertCircle, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface UnavailabilityStatusBannerProps {
  tipo: string;
  fechaFin?: string;
  motivo?: string;
  reportadoPor?: string | null;
  onCancel?: () => Promise<boolean>;
}

const tipoLabels: Record<string, string> = {
  falla_mecanica: '🔧 Falla mecánica',
  enfermedad: '🏥 Enfermedad',
  emergencia_familiar: '👨‍👩‍👧 Emergencia familiar',
  capacitacion: '📚 Capacitación',
  otro: '📋 Otro motivo',
};

const UnavailabilityStatusBanner = ({
  tipo,
  fechaFin,
  motivo,
  reportadoPor,
  onCancel,
}: UnavailabilityStatusBannerProps) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!onCancel) return;
    setLoading(true);
    try {
      await onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-red-600">
            Estado: No disponible
          </p>
          <p className="text-sm text-foreground mt-0.5">
            {tipoLabels[tipo] || tipo}
          </p>
          {fechaFin && (
            <p className="text-xs text-muted-foreground mt-1">
              Hasta: {new Date(fechaFin).toLocaleDateString('es-MX', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          )}
          {motivo && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              "{motivo}"
            </p>
          )}
          {reportadoPor && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              Reportado por: {reportadoPor}
            </p>
          )}
        </div>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-500/10 -mt-1 -mr-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default UnavailabilityStatusBanner;
