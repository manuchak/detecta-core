import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, AlertTriangle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AssignedLead } from "@/types/leadTypes";

interface SessionRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead | null;
  recoveryData: {
    hasRecoveryData: boolean;
    sessionId?: string;
    data?: Record<string, any>;
    interruptionReason?: string;
  };
  onContinueSession: () => void;
  onStartNewSession: () => void;
}

export const SessionRecoveryDialog = ({
  open,
  onOpenChange,
  lead,
  recoveryData,
  onContinueSession,
  onStartNewSession
}: SessionRecoveryDialogProps) => {
  if (!lead || !recoveryData.hasRecoveryData) return null;

  const formatRecoveryData = (data: Record<string, any>): string[] => {
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    return entries.slice(0, 5).map(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
      return `${displayKey}: ${displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue}`;
    });
  };

  const recoveredFields = recoveryData.data ? formatRecoveryData(recoveryData.data) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Sesión de Entrevista Recuperada
          </DialogTitle>
          <DialogDescription>
            Se encontró una sesión de entrevista interrumpida para{' '}
            <strong>{lead.lead_nombre}</strong>. 
            Puedes continuar desde donde se quedó o empezar una nueva entrevista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la sesión */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Sesión Interrumpida</span>
              </div>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                <Clock className="h-3 w-3 mr-1" />
                ID: {recoveryData.sessionId?.substring(0, 8)}...
              </Badge>
            </div>

            {recoveryData.interruptionReason && (
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Motivo de la interrupción:</p>
                  <p className="text-sm text-gray-600">{recoveryData.interruptionReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Datos recuperados */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Información Guardada</h4>
            <Separator />
            
            {recoveredFields.length > 0 ? (
              <div className="space-y-2">
                {recoveredFields.map((field, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700 font-mono">{field}</p>
                  </div>
                ))}
                {Object.keys(recoveryData.data || {}).length > 5 && (
                  <p className="text-xs text-gray-500 italic">
                    ... y {Object.keys(recoveryData.data || {}).length - 5} campos más
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No se encontraron datos específicos de la entrevista
              </p>
            )}
          </div>

          {/* Opciones */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-2">¿Qué deseas hacer?</h4>
            <div className="space-y-2 text-sm text-amber-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <span><strong>Continuar sesión:</strong> Recupera todos los datos guardados y continúa la entrevista</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span><strong>Nueva entrevista:</strong> Inicia desde cero (los datos guardados se perderán)</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={onStartNewSession}>
            Nueva Entrevista
          </Button>
          <Button onClick={onContinueSession} className="bg-green-600 hover:bg-green-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Continuar Sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};