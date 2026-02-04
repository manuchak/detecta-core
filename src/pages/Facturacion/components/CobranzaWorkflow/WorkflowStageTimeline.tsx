import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Mail, 
  Phone, 
  Bell, 
  AlertTriangle, 
  Scale,
  CheckCircle2,
  Clock,
  CircleDot
} from 'lucide-react';
import { DEFAULT_WORKFLOW_CONFIG, WorkflowStage } from '../../hooks/useCobranzaWorkflow';

interface WorkflowStageTimelineProps {
  diasVencido: number;
  className?: string;
}

const getStageIcon = (tipo: WorkflowStage['tipo_accion']) => {
  switch (tipo) {
    case 'recordatorio':
      return Bell;
    case 'email':
      return Mail;
    case 'llamada':
      return Phone;
    case 'escalamiento':
      return AlertTriangle;
    case 'juridico':
      return Scale;
    default:
      return CircleDot;
  }
};

const getStageStatus = (stageDias: number, diasVencido: number): 'completed' | 'current' | 'upcoming' => {
  if (diasVencido > stageDias) return 'completed';
  if (diasVencido >= stageDias - 3 && diasVencido <= stageDias + 3) return 'current';
  return 'upcoming';
};

export function WorkflowStageTimeline({ diasVencido, className }: WorkflowStageTimelineProps) {
  const config = DEFAULT_WORKFLOW_CONFIG;
  
  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-4">
        {config.etapas.map((stage, index) => {
          const status = getStageStatus(stage.dias_desde_vencimiento, diasVencido);
          const Icon = getStageIcon(stage.tipo_accion);
          
          return (
            <div key={stage.id} className="relative flex items-start gap-3 pl-1">
              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors',
                  status === 'completed' && 'bg-emerald-500 border-emerald-500 text-white',
                  status === 'current' && 'bg-primary border-primary text-primary-foreground animate-pulse',
                  status === 'upcoming' && 'bg-background border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      status === 'completed' && 'text-emerald-700 dark:text-emerald-400',
                      status === 'current' && 'text-primary',
                      status === 'upcoming' && 'text-muted-foreground'
                    )}
                  >
                    {stage.nombre}
                  </p>
                  {status === 'current' && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      Actual
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      'text-xs',
                      status === 'upcoming' ? 'text-muted-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {stage.dias_desde_vencimiento < 0 
                      ? `${Math.abs(stage.dias_desde_vencimiento)} días antes`
                      : stage.dias_desde_vencimiento === 0
                      ? 'Día de vencimiento'
                      : `${stage.dias_desde_vencimiento} días después`
                    }
                  </span>
                  
                  {stage.auto_ejecutar && (
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                      Auto
                    </span>
                  )}
                  
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded capitalize',
                      stage.prioridad === 'critica' && 'bg-red-500/10 text-red-600',
                      stage.prioridad === 'alta' && 'bg-orange-500/10 text-orange-600',
                      stage.prioridad === 'media' && 'bg-amber-500/10 text-amber-600',
                      stage.prioridad === 'baja' && 'bg-emerald-500/10 text-emerald-600'
                    )}
                  >
                    {stage.prioridad}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
