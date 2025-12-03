import { Badge } from '@/components/ui/badge';
import { FileSignature, CheckCircle } from 'lucide-react';
import { useContratosProgress } from '@/hooks/useContratosCandidato';

interface Props {
  candidatoId: string;
  size?: 'sm' | 'default';
}

export function ContractsProgressBadge({ candidatoId, size = 'default' }: Props) {
  const { firmados, totalRequeridos, isComplete } = useContratosProgress(candidatoId);

  if (size === 'sm') {
    return (
      <Badge 
        variant={isComplete ? 'default' : 'secondary'} 
        className={`text-xs px-1 ${isComplete ? 'bg-green-500/20 text-green-700' : ''}`}
      >
        {isComplete ? <CheckCircle className="h-2 w-2 mr-0.5" /> : <FileSignature className="h-2 w-2 mr-0.5" />}
        {firmados}/{totalRequeridos}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isComplete ? 'default' : 'secondary'}
      className={isComplete ? 'bg-green-500/20 text-green-700' : ''}
    >
      {isComplete ? <CheckCircle className="h-3 w-3 mr-1" /> : <FileSignature className="h-3 w-3 mr-1" />}
      {firmados}/{totalRequeridos} contratos
    </Badge>
  );
}
