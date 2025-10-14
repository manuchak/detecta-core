import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TestTube2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/contexts/SandboxContext";
import { useEffect, useState } from "react";

export const SandboxBanner = () => {
  const { isSandboxMode, toggleSandboxMode } = useSandbox();
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const timestamp = localStorage.getItem('sandbox-mode-timestamp');
    if (timestamp) {
      const date = new Date(timestamp);
      setLastUpdate(date.toLocaleString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      }));
    }
  }, [isSandboxMode]);

  if (!isSandboxMode) return null;

  return (
    <Alert className="border-warning bg-warning/20 mb-4 shadow-lg">
      <AlertTriangle className="h-5 w-5 text-warning" />
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="text-base font-bold text-warning mb-1">
            🧪 MODO SANDBOX ACTIVO
          </AlertTitle>
          <AlertDescription className="text-sm text-warning/90">
            Estás en ambiente de pruebas. Los datos NO afectarán producción.
            {lastUpdate && <span className="ml-2 opacity-70">(Desde {lastUpdate})</span>}
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSandboxMode}
          className="h-auto p-2 hover:bg-warning/10"
        >
          <X className="h-4 w-4 text-warning" />
        </Button>
      </div>
    </Alert>
  );
};
