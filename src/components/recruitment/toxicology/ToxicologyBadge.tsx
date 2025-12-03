import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  resultado: 'negativo' | 'positivo' | null;
  size?: 'sm' | 'md';
}

export function ToxicologyBadge({ resultado, size = 'md' }: Props) {
  if (!resultado) return null;

  const isNegativo = resultado === 'negativo';
  
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
        isNegativo 
          ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400'
          : 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400'
      )}
    >
      {isNegativo ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Negativo
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          Positivo
        </>
      )}
    </Badge>
  );
}
