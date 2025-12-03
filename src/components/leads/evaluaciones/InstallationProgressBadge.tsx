import { Badge } from '@/components/ui/badge';
import { useProgramacionInstalacionesCandidato } from '@/hooks/useProgramacionInstalacionesCandidato';
import { CheckCircle, Clock, Cpu, AlertCircle } from 'lucide-react';

interface InstallationProgressBadgeProps {
  candidatoId: string;
  size?: 'sm' | 'default';
}

export function InstallationProgressBadge({ candidatoId, size = 'default' }: InstallationProgressBadgeProps) {
  const { ultimaInstalacion, instalacionCompletada, isLoading } = useProgramacionInstalacionesCandidato(candidatoId);
  
  if (isLoading) return null;
  
  const getStatusInfo = () => {
    if (!ultimaInstalacion) {
      return { icon: AlertCircle, text: 'Pendiente', variant: 'outline' as const, color: '' };
    }
    
    switch (ultimaInstalacion.estado) {
      case 'completada':
        return { icon: CheckCircle, text: 'Completada', variant: 'default' as const, color: 'bg-green-600' };
      case 'en_proceso':
        return { icon: Clock, text: 'En proceso', variant: 'secondary' as const, color: 'bg-blue-600' };
      case 'confirmada':
        return { icon: Clock, text: 'Confirmada', variant: 'secondary' as const, color: 'bg-amber-600' };
      case 'pendiente':
        return { icon: Clock, text: 'Programada', variant: 'secondary' as const, color: '' };
      case 'cancelada':
        return { icon: AlertCircle, text: 'Cancelada', variant: 'destructive' as const, color: '' };
      default:
        return { icon: AlertCircle, text: 'Sin programar', variant: 'outline' as const, color: '' };
    }
  };
  
  const status = getStatusInfo();
  const Icon = status.icon;
  
  if (size === 'sm') {
    if (!ultimaInstalacion) return null;
    
    return (
      <Badge 
        variant={status.variant} 
        className={`text-xs px-1 ${status.color}`}
      >
        <Icon className="h-2 w-2" />
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant={status.variant}
      className={`gap-1 ${status.color}`}
    >
      <Icon className="h-3 w-3" />
      {status.text}
    </Badge>
  );
}
