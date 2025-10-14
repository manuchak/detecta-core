import React, { useState } from 'react';
import { TestTube2, Shield, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useSandbox } from '@/contexts/SandboxContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
              className={`w-full p-3 flex items-center justify-center transition-colors border-l-4 ${
                isSandboxMode
                  ? 'bg-warning/20 border-warning hover:bg-warning/30'
                  : 'bg-success/20 border-success hover:bg-success/30'
              }`}
            >
              {isSandboxMode ? (
                <TestTube2 className="h-5 w-5 text-warning" />
              ) : (
                <Shield className="h-5 w-5 text-success" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold">
              {isSandboxMode ? 'Modo Sandbox' : 'Producción'}
            </p>
            <p className="text-xs text-muted-foreground">
              Click para cambiar a {isSandboxMode ? 'Producción' : 'Sandbox'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div
        className={`p-4 border-l-4 transition-all ${
          isSandboxMode
            ? 'bg-warning/10 border-warning'
            : 'bg-success/10 border-success'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isSandboxMode ? (
              <TestTube2 className="h-5 w-5 text-warning" />
            ) : (
              <Shield className="h-5 w-5 text-success" />
            )}
            <span className="font-bold text-sm">
              {isSandboxMode ? 'MODO SANDBOX' : 'PRODUCCIÓN'}
            </span>
          </div>
          <Badge variant={isSandboxMode ? 'outline' : 'default'}>
            {isSandboxMode ? 'PRUEBAS' : 'LIVE'}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {isSandboxMode
            ? 'Probando cambios sin riesgo'
            : 'Datos reales - Ten cuidado'}
        </p>

        <Button
          onClick={handleToggleRequest}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Cambiar a {isSandboxMode ? 'Producción' : 'Sandbox'}
        </Button>

        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs font-medium mb-2">Accesos rápidos:</p>
          <div className="space-y-1">
            {isSandboxMode ? (
              <>
                <button
                  onClick={() => navigate('/sandbox-testing')}
                  className="w-full text-left text-xs hover:bg-background/50 p-1.5 rounded transition-colors"
                >
                  🧪 Panel de Pruebas
                </button>
                <button
                  onClick={() => navigate('/sandbox-deployment')}
                  className="w-full text-left text-xs hover:bg-background/50 p-1.5 rounded transition-colors"
                >
                  📊 Ver Promociones
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/')}
                  className="w-full text-left text-xs hover:bg-background/50 p-1.5 rounded transition-colors"
                >
                  📈 Métricas en vivo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Cambio de Ambiente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-success" />
                  <span className="font-bold">PRODUCCIÓN (LIVE)</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">IMPORTANTE:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Los cambios afectarán datos reales</li>
                  <li>• Las llamadas consumirán créditos</li>
                  <li>• Las modificaciones serán permanentes</li>
                </ul>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="understand-risks"
                  checked={understoodRisks}
                  onCheckedChange={(checked) => setUnderstoodRisks(checked === true)}
                />
                <Label
                  htmlFor="understand-risks"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Entiendo los riesgos
                </Label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setUnderstoodRisks(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmChange}
              disabled={!understoodRisks}
            >
              Cambiar a Producción
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
