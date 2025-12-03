import { Badge } from '@/components/ui/badge';
import { useCapacitacion } from '@/hooks/useCapacitacion';
import { CheckCircle, GraduationCap } from 'lucide-react';

interface TrainingProgressBadgeProps {
  candidatoId: string;
  size?: 'sm' | 'default';
}

export function TrainingProgressBadge({ candidatoId, size = 'default' }: TrainingProgressBadgeProps) {
  const { calcularProgresoGeneral, isLoading } = useCapacitacion(candidatoId);
  
  if (isLoading) return null;
  
  const progreso = calcularProgresoGeneral();
  
  if (!progreso || progreso.total_modulos === 0) return null;
  
  const isComplete = progreso.capacitacion_completa;
  const porcentaje = progreso.porcentaje;
  
  if (size === 'sm') {
    return (
      <Badge 
        variant={isComplete ? 'default' : 'secondary'} 
        className={`text-xs px-1 ${isComplete ? 'bg-green-600' : ''}`}
      >
        {isComplete ? (
          <CheckCircle className="h-2 w-2" />
        ) : (
          <span>{porcentaje}%</span>
        )}
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant={isComplete ? 'default' : 'secondary'}
      className={`gap-1 ${isComplete ? 'bg-green-600' : ''}`}
    >
      {isComplete ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Completada
        </>
      ) : (
        <>
          <GraduationCap className="h-3 w-3" />
          {progreso.quizzes_aprobados}/{progreso.total_modulos}
        </>
      )}
    </Badge>
  );
}
