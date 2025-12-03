import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle } from 'lucide-react';
import { useDocumentosProgress } from '@/hooks/useDocumentosCandidato';

interface Props {
  candidatoId: string;
  size?: 'sm' | 'default';
}

export function DocumentsProgressBadge({ candidatoId, size = 'default' }: Props) {
  const { completados, totalRequeridos, isComplete } = useDocumentosProgress(candidatoId);

  if (size === 'sm') {
    return (
      <Badge 
        variant={isComplete ? 'default' : 'secondary'} 
        className={`text-xs px-1 ${isComplete ? 'bg-green-500/20 text-green-700' : ''}`}
      >
        {isComplete ? <CheckCircle className="h-2 w-2 mr-0.5" /> : <FileText className="h-2 w-2 mr-0.5" />}
        {completados}/{totalRequeridos}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isComplete ? 'default' : 'secondary'}
      className={isComplete ? 'bg-green-500/20 text-green-700' : ''}
    >
      {isComplete ? <CheckCircle className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
      {completados}/{totalRequeridos} documentos
    </Badge>
  );
}
