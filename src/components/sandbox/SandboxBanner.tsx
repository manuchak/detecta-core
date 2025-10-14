import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestTube2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/contexts/SandboxContext";

export const SandboxBanner = () => {
  const { isSandboxMode, toggleSandboxMode } = useSandbox();

  if (!isSandboxMode) return null;

  return (
    <Alert className="border-warning bg-warning/10 mb-4">
      <TestTube2 className="h-4 w-4 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm font-medium">
          🧪 Modo Sandbox Activo - Los datos no afectarán producción
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSandboxMode}
          className="h-auto p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
