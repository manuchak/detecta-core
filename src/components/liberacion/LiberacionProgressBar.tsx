import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { ChecklistProgress } from '@/types/liberacion';

interface LiberacionProgressBarProps {
  progress: ChecklistProgress;
  compact?: boolean;
}

const LiberacionProgressBar = ({ progress, compact = false }: LiberacionProgressBarProps) => {
  const getStatusIcon = (value: number) => {
    if (value === 100) {
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    } else if (value > 0) {
      return <AlertCircle className="h-3 w-3 text-yellow-600" />;
    }
    return <Circle className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusBadge = (value: number, label: string) => {
    if (value === 100) {
      return <Badge variant="success" className="text-xs gap-1">{getStatusIcon(value)} {label}</Badge>;
    } else if (value > 0) {
      return <Badge variant="default" className="text-xs gap-1">{getStatusIcon(value)} {label}</Badge>;
    }
    return <Badge variant="secondary" className="text-xs gap-1">{getStatusIcon(value)} {label}</Badge>;
  };

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progreso</span>
          <span className="text-sm font-semibold">{progress.total}%</span>
        </div>
        <Progress value={progress.total} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progreso General</span>
          <span className="text-sm font-semibold">{progress.total}%</span>
        </div>
        <Progress value={progress.total} className="h-3" />
      </div>

      <div className="flex flex-wrap gap-2">
        {getStatusBadge(progress.documentacion, 'Docs')}
        {getStatusBadge(progress.psicometricos, 'Psico')}
        {getStatusBadge(progress.toxicologicos, 'Toxico')}
        {getStatusBadge(progress.vehiculo, 'Veh')}
        {getStatusBadge(progress.gps, 'GPS')}
      </div>
    </div>
  );
};

export default LiberacionProgressBar;
