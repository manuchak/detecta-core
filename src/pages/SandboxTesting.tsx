import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SandboxBanner } from "@/components/sandbox/SandboxBanner";
import { DialfireTestPanel } from "@/components/sandbox/DialfireTestPanel";
import { useSandboxMetrics } from "@/hooks/useSandboxMetrics";
import { useSandbox } from "@/contexts/SandboxContext";
import { useNavigate } from "react-router-dom";
import { TestTube2, TrendingUp, Clock, DollarSign } from "lucide-react";

const SandboxTesting = () => {
  const { isSandboxMode } = useSandbox();
  const navigate = useNavigate();
  const { data: metrics, isLoading } = useSandboxMetrics(true);

  const MetricCard = ({ title, value, icon: Icon, subtitle }: any) => (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <SandboxBanner />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TestTube2 className="h-8 w-8 text-warning" />
          Panel de Pruebas Sandbox
        </h1>
        <p className="text-muted-foreground mt-2">
          Prueba integraciones de VAPI y Dialfire sin afectar datos de producción
        </p>
      </div>

      {/* Métricas */}
      {isLoading ? (
        <div className="text-center py-12">Cargando métricas...</div>
      ) : (
        <div className="space-y-6">
          {/* VAPI Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge variant="outline">VAPI</Badge>
              Llamadas AI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Llamadas"
                value={metrics?.vapi?.total_calls || 0}
                icon={TrendingUp}
              />
              <MetricCard
                title="Tasa de Éxito"
                value={`${metrics?.vapi?.success_rate || 0}%`}
                icon={TrendingUp}
                subtitle={`${metrics?.vapi?.successful_calls || 0} exitosas`}
              />
              <MetricCard
                title="Duración Promedio"
                value={`${metrics?.vapi?.avg_duration || 0}s`}
                icon={Clock}
              />
              <MetricCard
                title="Costo Total"
                value={`$${metrics?.vapi?.total_cost || 0}`}
                icon={DollarSign}
              />
            </div>
          </div>

          {/* Dialfire Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">Dialfire</Badge>
              Llamadas Marcador Predictivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Llamadas"
                value={metrics?.dialfire?.total_calls || 0}
                icon={TrendingUp}
              />
              <MetricCard
                title="Tasa de Contacto"
                value={`${metrics?.dialfire?.success_rate || 0}%`}
                icon={TrendingUp}
                subtitle={`${metrics?.dialfire?.successful_calls || 0} contestadas`}
              />
              <MetricCard
                title="Duración Promedio"
                value={`${metrics?.dialfire?.avg_duration || 0}s`}
                icon={Clock}
              />
              <MetricCard
                title="Costo"
                value="Variable"
                icon={DollarSign}
                subtitle="Por contrato Dialfire"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Acciones Rápidas</h3>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/leads')}>
                  Ir a Candidatos de Prueba
                </Button>
                <Button variant="outline" onClick={() => navigate('/sandbox-deployment')}>
                  Ver Dashboard de Promoción
                </Button>
              </div>
            </Card>

            <DialfireTestPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxTesting;
