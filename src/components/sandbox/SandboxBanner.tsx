import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TestTube2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSandbox } from "@/contexts/SandboxContext";
import { useEffect, useState } from "react";

interface SandboxBannerProps {
  dataCount?: number;
}

export const SandboxBanner = ({ dataCount }: SandboxBannerProps) => {
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
    <Alert className="sticky top-0 z-50 border-warning bg-warning/20 mb-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="h-5 w-5 text-warning animate-pulse" />
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="text-base font-bold text-warning mb-1 flex items-center gap-2">
            🧪 MODO SANDBOX ACTIVO
            {dataCount !== undefined && (
              <Badge variant="outline" className="border-warning text-warning bg-warning/10">
                {dataCount} registros de prueba
              </Badge>
            )}
          </AlertTitle>
          <AlertDescription className="text-sm text-warning/90">
            Estás en ambiente de pruebas. Los datos NO afectarán producción.
            {lastUpdate && <span className="ml-2 opacity-70">(Activado: {lastUpdate})</span>}
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
