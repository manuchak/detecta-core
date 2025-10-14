import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestTube2 } from "lucide-react";
import { useSandbox } from "@/contexts/SandboxContext";
import { Badge } from "@/components/ui/badge";

interface SandboxDataWarningProps {
  entityType?: 'lead' | 'candidate' | 'call' | 'generic';
  action?: 'create' | 'update' | 'view';
}

/**
 * Componente de advertencia visual para modo Sandbox
 * Muestra mensajes contextuales dependiendo del tipo de entidad y acción
 * 
 * @example
 * ```tsx
 * <SandboxDataWarning entityType="lead" action="create" />
 * <SandboxDataWarning entityType="candidate" action="view" />
 * ```
 */
export const SandboxDataWarning = ({ 
  entityType = 'generic', 
  action = 'create' 
}: SandboxDataWarningProps) => {
  const { isSandboxMode } = useSandbox();

  if (!isSandboxMode) return null;

  const messages = {
    lead: {
      create: 'Los leads creados en Sandbox no aparecerán en producción',
      update: 'Solo puedes editar leads de prueba en Sandbox',
      view: 'Viendo únicamente leads de prueba'
    },
    candidate: {
      create: 'Los candidatos creados en Sandbox no afectarán la base real',
      update: 'Solo puedes editar candidatos de prueba',
      view: 'Viendo únicamente candidatos de prueba'
    },
    call: {
      create: 'Las llamadas en Sandbox son de prueba y no consumen créditos reales',
      update: 'Editando logs de llamadas de prueba',
      view: 'Viendo únicamente llamadas de prueba'
    },
    generic: {
      create: 'Los datos creados en Sandbox no afectarán producción',
      update: 'Solo puedes editar datos de prueba en Sandbox',
      view: 'Viendo únicamente datos de prueba'
    }
  };

  return (
    <Alert className="border-warning bg-warning/5 mb-4">
      <div className="flex items-start gap-3">
        <TestTube2 className="h-4 w-4 text-warning mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertDescription className="font-medium text-sm">
              Modo Sandbox Activo
            </AlertDescription>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-warning text-warning">
              PRUEBA
            </Badge>
          </div>
          <AlertDescription className="text-xs text-muted-foreground">
            {messages[entityType][action]}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
