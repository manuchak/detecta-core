import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  PhoneCall, 
  Calendar,
  MessageSquare,
  ClipboardCheck,
  FileText,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useEnhancedConversionFunnel } from '@/hooks/useEnhancedConversionFunnel';

interface FunnelStage {
  id: string;
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}

interface EnhancedConversionFunnelProps {
  isLoading?: boolean;
}

export const EnhancedConversionFunnel: React.FC<EnhancedConversionFunnelProps> = ({ 
  isLoading: externalLoading = false 
}) => {
  const { data: funnelData, isLoading: dataLoading } = useEnhancedConversionFunnel();
  const isLoading = externalLoading || dataLoading;

  // Provide default data if funnelData is undefined
  const safeData = funnelData || {
    totalLeads: 0,
    qualified: 0,
    contacted: 0,
    callsCompleted: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
    inEvaluation: 0,
    preApproved: 0,
    documentationComplete: 0,
    finalApproved: 0,
    activeCustodians: 0
  };

  const stages: FunnelStage[] = [
    {
      id: 'leads',
      label: 'Leads Generados',
      count: safeData.totalLeads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total de leads captados'
    },
    {
      id: 'qualified',
      label: 'Leads Calificados',
      count: safeData.qualified,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Leads que cumplen criterios básicos'
    },
    {
      id: 'contacted',
      label: 'Contactados',
      count: safeData.contacted,
      icon: PhoneCall,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      description: 'Primer contacto establecido'
    },
    {
      id: 'calls',
      label: 'Llamadas Completadas',
      count: safeData.callsCompleted,
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Conversaciones telefónicas exitosas'
    },
    {
      id: 'scheduled',
      label: 'Entrevistas Programadas',
      count: safeData.interviewsScheduled,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Citas de entrevista agendadas'
    },
    {
      id: 'interviews',
      label: 'Entrevistas Completadas',
      count: safeData.interviewsCompleted,
      icon: ClipboardCheck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: 'Entrevistas finalizadas'
    },
    {
      id: 'evaluation',
      label: 'En Evaluación',
      count: safeData.inEvaluation,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Proceso de evaluación interno'
    },
    {
      id: 'preapproved',
      label: 'Pre-Aprobados',
      count: safeData.preApproved,
      icon: UserCheck,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: 'Candidatos pre-aprobados'
    },
    {
      id: 'documentation',
      label: 'Documentación Completa',
      count: safeData.documentationComplete,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Documentos verificados y completos'
    },
    {
      id: 'approved',
      label: 'Aprobados Finales',
      count: safeData.finalApproved,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Candidatos aprobados finalmente'
    },
    {
      id: 'active',
      label: 'Custodios Activos',
      count: safeData.activeCustodians,
      icon: TrendingUp,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      description: 'Custodios realizando servicios'
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLeads = stages[0].count;
  const conversionRate = totalLeads > 0 ? (stages[stages.length - 1].count / totalLeads) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Embudo de Conversión Completo
          </span>
          <Badge variant="secondary" className="text-sm">
            {conversionRate.toFixed(1)}% conversión total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const percentage = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0;
          const previousStage = index > 0 ? stages[index - 1] : null;
          const stageConversion = previousStage && previousStage.count > 0 
            ? (stage.count / previousStage.count) * 100 
            : 100;

          return (
            <div 
              key={stage.id} 
              className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:shadow-md hover:bg-card"
            >
              {/* Background funnel effect */}
              <div 
                className="absolute inset-0 opacity-5 transition-all duration-300 group-hover:opacity-10"
                style={{
                  background: `linear-gradient(90deg, ${stage.color.replace('text-', '')} 0%, transparent ${percentage}%)`
                }}
              />
              
              <div className="relative flex items-center gap-4">
                {/* Icon */}
                <div className={`p-2.5 rounded-lg ${stage.bgColor} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${stage.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm truncate">{stage.label}</h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-lg">
                        {stage.count.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {stage.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Del total: {percentage.toFixed(1)}%
                      </span>
                      {index > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Del anterior: {stageConversion.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector line to next stage */}
              {index < stages.length - 1 && (
                <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-px h-3 bg-border opacity-30" />
              )}
            </div>
          );
        })}

        {/* Summary Stats */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {conversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Conversión Total
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {safeData.totalLeads > 0 ? ((safeData.contacted / safeData.totalLeads) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs text-muted-foreground">
                Tasa de Contacto
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {safeData.contacted > 0 ? ((safeData.finalApproved / safeData.contacted) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs text-muted-foreground">
                Contacto → Aprobado
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};