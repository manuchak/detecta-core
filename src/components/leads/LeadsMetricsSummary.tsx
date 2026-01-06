import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Phone, 
  CheckCircle 
} from "lucide-react";
import { LeadsCounts } from "@/hooks/useLeadsCounts";

interface CallCenterMetrics {
  contactabilidad: number;
  llamadasPromedioDia: number;
  contactosEfectivosDia: number;
  agentesActivos: number;
  leadsUnicosContactados: number;
}

interface LeadsMetricsSummaryProps {
  counts: LeadsCounts | undefined;
  callMetrics?: CallCenterMetrics;
  isLoading?: boolean;
}

export const LeadsMetricsSummary = ({ 
  counts, 
  callMetrics,
  isLoading 
}: LeadsMetricsSummaryProps) => {
  const metrics = [
    {
      label: 'Total',
      value: counts?.total || 0,
      icon: Users,
      color: 'text-foreground'
    },
    {
      label: 'Aprobados',
      value: counts?.approved || 0,
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      label: 'Pendientes',
      value: counts?.pending || 0,
      icon: Clock,
      color: 'text-amber-600'
    },
    {
      label: 'Archivo',
      value: counts?.rejected || 0,
      icon: UserX,
      color: 'text-muted-foreground'
    },
  ];

  const callCenterMetrics = callMetrics ? [
    {
      label: 'Contactabilidad',
      value: `${callMetrics.contactabilidad}%`,
      icon: Phone,
      color: callMetrics.contactabilidad >= 25 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Llamadas/Día',
      value: callMetrics.llamadasPromedioDia,
      icon: Phone,
      color: 'text-blue-600'
    },
    {
      label: 'Contactos/Día',
      value: callMetrics.contactosEfectivosDia,
      icon: CheckCircle,
      color: 'text-green-600'
    },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Lead Metrics */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Candidatos
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div 
                key={metric.label}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
              >
                <Icon className={`h-4 w-4 ${metric.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {metric.label}
                  </p>
                  <p className={`text-sm font-semibold ${metric.color}`}>
                    {isLoading ? '...' : metric.value.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call Center Metrics */}
      {callCenterMetrics.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Call Center
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {callCenterMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div 
                  key={metric.label}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                >
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {metric.label}
                    </p>
                    <p className={`text-sm font-semibold ${metric.color}`}>
                      {metric.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Por Contactar</span>
          <Badge variant="secondary" className="text-xs">
            {isLoading ? '...' : (counts?.uncontacted || 0).toLocaleString()}
          </Badge>
        </div>
      </div>
    </div>
  );
};
