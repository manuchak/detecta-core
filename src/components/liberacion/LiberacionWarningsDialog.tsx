import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Info } from "lucide-react";

interface LiberacionWarningsDialogProps {
  open: boolean;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LiberacionWarningsDialog({ 
  open,
  warnings, 
  onConfirm, 
  onCancel,
  isLoading = false
}: LiberacionWarningsDialogProps) {
  // Separar warnings críticos de informativos
  const criticalWarnings = warnings.filter(w => w.includes('⚠️'));
  const infoWarnings = warnings.filter(w => w.includes('ℹ️'));

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Liberación con Advertencias
          </AlertDialogTitle>
          <AlertDialogDescription>
            El custodio no cumple con todos los requisitos del workflow completo, 
            pero <strong>puedes continuar</strong> la liberación mientras se completan las fases faltantes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3 my-4 max-h-[300px] overflow-y-auto">
          {/* Warnings críticos */}
          {criticalWarnings.length > 0 && (
            <div className="space-y-2">
              {criticalWarnings.map((warning, idx) => (
                <div 
                  key={`critical-${idx}`} 
                  className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                >
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    {warning.replace('⚠️ ', '')}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Warnings informativos */}
          {infoWarnings.length > 0 && (
            <div className="space-y-2">
              {infoWarnings.map((warning, idx) => (
                <div 
                  key={`info-${idx}`} 
                  className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md"
                >
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    {warning.replace('ℹ️ ', '')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
          <strong>Nota:</strong> Esta liberación será registrada en auditoría con las advertencias listadas. 
          El sistema permite operación flexible durante la implementación del workflow completo.
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isLoading ? 'Liberando...' : 'Liberar de todas formas'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
