import React, { useState } from 'react';
import { TestTube2, Shield, AlertTriangle } from 'lucide-react';
import { useSandbox } from '@/contexts/SandboxContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface SandboxEnvironmentIndicatorProps {
  collapsed?: boolean;
}

export const SandboxEnvironmentIndicator: React.FC<SandboxEnvironmentIndicatorProps> = ({ 
  collapsed = false 
}) => {
  const { isSandboxMode, toggleSandboxMode } = useSandbox();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [understoodRisks, setUnderstoodRisks] = useState(false);
  const navigate = useNavigate();

  const handleToggleRequest = () => {
    if (!isSandboxMode) {
      // Switching to Sandbox - no confirmation needed
      toggleSandboxMode();
      toast({
        title: "🧪 Modo Sandbox Activado",
        description: "Ahora puedes probar cambios sin riesgo",
      });
    } else {
      // Switching to Production - show confirmation
      setShowConfirmDialog(true);
      setUnderstoodRisks(false);
    }
  };

  const handleConfirmChange = () => {
    if (!understoodRisks) return;
    
    toggleSandboxMode();
    setShowConfirmDialog(false);
    setUnderstoodRisks(false);
    toast({
      title: "🛡️ Modo Producción Activado",
      description: "Ten cuidado - Los cambios afectarán datos reales",
      variant: "destructive",
    });
  };

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleToggleRequest}
              className="w-full p-3 flex items-center justify-center hover:bg-accent/50 transition-all duration-300 ease-out"
            >
              {isSandboxMode ? (
                <TestTube2 className="h-5 w-5 text-warning" />
              ) : (
                <Shield className="h-5 w-5 text-success" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p className="font-medium">
              {isSandboxMode ? 'Sandbox' : 'Producción'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div
        className={`px-4 py-5 border rounded-lg transition-all duration-300 ease-out ${
          isSandboxMode
            ? 'bg-warning/5 border-warning/20'
            : 'bg-success/5 border-success/20'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {isSandboxMode ? (
              <TestTube2 className="h-4 w-4 text-warning" />
            ) : (
              <Shield className="h-4 w-4 text-success" />
            )}
            <span className="font-medium text-sm tracking-tight">
              {isSandboxMode ? 'Sandbox' : 'Producción'}
            </span>
          </div>
          <div className={`h-2 w-2 rounded-full ${isSandboxMode ? 'bg-warning' : 'bg-success'}`} />
        </div>

        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          {isSandboxMode
            ? 'Entorno de pruebas seguro'
            : 'Operaciones en vivo'}
        </p>

        <Button
          onClick={handleToggleRequest}
          variant="ghost"
          size="sm"
          className="w-full justify-center h-8 text-xs font-normal hover:bg-accent/50 transition-all duration-300"
        >
          {isSandboxMode ? 'Ir a Producción' : 'Ir a Sandbox'}
        </Button>

        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="space-y-1.5">
            {isSandboxMode ? (
              <>
                <button
                  onClick={() => navigate('/sandbox-testing')}
                  className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30 px-2 py-1.5 rounded transition-all duration-200"
                >
                  Panel de Pruebas
                </button>
                <button
                  onClick={() => navigate('/sandbox-deployment')}
                  className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30 px-2 py-1.5 rounded transition-all duration-200"
                >
                  Ver Promociones
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30 px-2 py-1.5 rounded transition-all duration-200"
              >
                Métricas en vivo
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2.5 text-base font-medium">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Cambiar a Producción
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-6 pt-6">
              <div className="flex items-center gap-3 px-1">
                <Shield className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Entorno de Producción</span>
              </div>

              <div className="space-y-3 px-1">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Los cambios afectarán datos reales
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Las llamadas consumirán créditos
                </p>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Las modificaciones serán permanentes
                </p>
              </div>

              <div className="flex items-start space-x-3 pt-2 px-1">
                <Checkbox
                  id="understand-risks"
                  checked={understoodRisks}
                  onCheckedChange={(checked) => setUnderstoodRisks(checked === true)}
                />
                <Label
                  htmlFor="understand-risks"
                  className="text-[13px] font-normal leading-relaxed cursor-pointer"
                >
                  Entiendo los riesgos
                </Label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowConfirmDialog(false);
                setUnderstoodRisks(false);
              }}
              className="transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmChange}
              disabled={!understoodRisks}
              className="transition-all duration-200"
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
