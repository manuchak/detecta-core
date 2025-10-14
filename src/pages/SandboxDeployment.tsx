import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SandboxDeployment = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin', 'owner']);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="p-12 text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            Solo administradores pueden acceder al panel de promoción a producción
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sandbox → Producción</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la promoción de cambios desde el ambiente de pruebas a producción
        </p>
      </div>

      {/* Pending Changes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">📋 Cambios Pendientes</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-success">Listo</Badge>
                    <h3 className="font-semibold">Integración Dialfire - Campaña Test 2025</h3>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ 45 llamadas de prueba | 91% tasa de éxito | Promedio 3.2min</p>
                    <p>✓ Todas las validaciones pasaron</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                  <Button size="sm" className="bg-primary">
                    Promover a Producción
                  </Button>
                </div>
              </div>

              <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">En Testing</Badge>
                    <h3 className="font-semibold">VAPI Script v2 - "Intro Refinement"</h3>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>⚠ 12 llamadas de prueba | Requiere 8 más para validación</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Continuar Pruebas
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Deployment History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">📜 Historial de Despliegues</h2>
          <Card className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">2025-01-13 14:30</span>
                  <span className="text-sm">VAPI Script v1.5</span>
                </div>
                <Badge className="bg-success">Exitoso</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">2025-01-12 09:15</span>
                  <span className="text-sm">Dialfire Test 1</span>
                </div>
                <Badge variant="destructive">Revertido</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">2025-01-10 11:00</span>
                  <span className="text-sm">VAPI Assistant 2</span>
                </div>
                <Badge className="bg-success">Exitoso</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SandboxDeployment;
