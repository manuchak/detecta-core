import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponseRatingButtonsProps {
  respuestaId: string;
  existingRating?: boolean | null;
  onRate: (respuestaId: string, helpful: boolean) => Promise<void>;
}

const ResponseRatingButtons = ({ respuestaId, existingRating, onRate }: ResponseRatingButtonsProps) => {
  const [rating, setRating] = useState<boolean | null>(existingRating ?? null);
  const [loading, setLoading] = useState(false);

  const handleRate = async (helpful: boolean) => {
    if (rating !== null || loading) return;
    
    setLoading(true);
    try {
      await onRate(respuestaId, helpful);
      setRating(helpful);
    } finally {
      setLoading(false);
    }
  };

  // Already rated - show result
  if (rating !== null) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="w-3 h-3" />
        <span>{rating ? 'Útil' : 'No útil'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">¿Útil?</span>
      <button
        type="button"
        onClick={() => handleRate(true)}
        disabled={loading}
        className={cn(
          "p-1.5 rounded-md transition-all",
          "text-muted-foreground hover:text-green-600 hover:bg-green-500/10",
          "active:scale-90 disabled:opacity-50"
        )}
        title="Sí, fue útil"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleRate(false)}
        disabled={loading}
        className={cn(
          "p-1.5 rounded-md transition-all",
          "text-muted-foreground hover:text-red-600 hover:bg-red-500/10",
          "active:scale-90 disabled:opacity-50"
        )}
        title="No fue útil"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ResponseRatingButtons;
