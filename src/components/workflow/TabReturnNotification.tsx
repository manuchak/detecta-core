import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabReturnNotificationProps {
  currentStep: string;
  lastSaved: Date | null;
  onDismiss: () => void;
}

const stepLabels: Record<string, string> = {
  route: 'Búsqueda de Ruta',
  service: 'Configuración del Servicio',
  assignment: 'Asignación de Custodio',
  armed_assignment: 'Asignación de Armado',
  final_confirmation: 'Confirmación Final'
};

export const TabReturnNotification = ({ 
  currentStep, 
  lastSaved, 
  onDismiss 
}: TabReturnNotificationProps) => {
  const timeSince = lastSaved 
    ? Math.floor((Date.now() - lastSaved.getTime()) / 1000)
    : null;
  
  return (
    <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Bienvenido de vuelta
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <div className="text-blue-800 dark:text-blue-200">
          Continuando en: <strong>{stepLabels[currentStep] || currentStep}</strong>
          {timeSince && timeSince < 60 && (
            <span className="ml-2 text-xs">(guardado hace {timeSince}s)</span>
          )}
        </div>
        <Button 
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-4 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900"
        >
          Entendido
        </Button>
      </AlertDescription>
    </Alert>
  );
};
