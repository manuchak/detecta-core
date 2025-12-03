import { Badge } from '@/components/ui/badge';
import { useReferenciasProgress } from '@/hooks/useReferencias';
import { CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  candidatoId: string;
  size?: 'sm' | 'md';
}

export function ReferencesProgressBadge({ candidatoId, size = 'md' }: Props) {
  const { data: progress, isLoading } = useReferenciasProgress(candidatoId);

  if (isLoading || !progress) return null;

  const totalOk = progress.laboralesOk + progress.personalesOk;
  const isComplete = progress.isComplete;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        'gap-1',
        sizeClasses[size],
        isComplete 
          ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400'
          : 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-400'
      )}
    >
      {isComplete ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {totalOk}/4
    </Badge>
  );
}
