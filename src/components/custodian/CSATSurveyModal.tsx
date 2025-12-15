import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSATSurveyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, resolved: boolean, comment?: string) => Promise<void>;
  ticketNumber: string;
}

const EMOJI_OPTIONS = [
  { value: 1, emoji: '😠', label: 'Muy insatisfecho' },
  { value: 2, emoji: '😕', label: 'Insatisfecho' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Satisfecho' },
  { value: 5, emoji: '😍', label: 'Muy satisfecho' },
];

const CSATSurveyModal = ({ open, onClose, onSubmit, ticketNumber }: CSATSurveyModalProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [resolved, setResolved] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === null || resolved === null) return;
    
    setSubmitting(true);
    try {
      await onSubmit(rating, resolved, comment || undefined);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">¡Gracias!</h3>
            <p className="text-muted-foreground text-center">
              Tu opinión nos ayuda a mejorar
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ¿Cómo te fue?
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Ticket #{ticketNumber}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating question */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block text-center">
              ¿Qué tan satisfecho estás con la resolución?
            </label>
            <div className="flex justify-center gap-2">
              {EMOJI_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRating(option.value)}
                  className={cn(
                    "w-14 h-14 rounded-xl text-3xl transition-all active:scale-95",
                    "border-2 flex items-center justify-center",
                    rating === option.value
                      ? "border-primary bg-primary/10 scale-110 shadow-lg"
                      : "border-border bg-muted/30 hover:border-primary/50"
                  )}
                  title={option.label}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
            {rating && (
              <p className="text-center text-sm text-muted-foreground">
                {EMOJI_OPTIONS.find(o => o.value === rating)?.label}
              </p>
            )}
          </div>

          {/* Resolved question */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block text-center">
              ¿Se resolvió completamente tu problema?
            </label>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setResolved(true)}
                className={cn(
                  "px-8 py-4 rounded-xl text-base font-medium transition-all active:scale-95",
                  "border-2 flex items-center justify-center gap-2 min-w-[120px]",
                  resolved === true
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-border bg-muted/30 hover:border-green-500/50"
                )}
              >
                <CheckCircle className="w-5 h-5" />
                Sí
              </button>
              <button
                type="button"
                onClick={() => setResolved(false)}
                className={cn(
                  "px-8 py-4 rounded-xl text-base font-medium transition-all active:scale-95",
                  "border-2 flex items-center justify-center gap-2 min-w-[120px]",
                  resolved === false
                    ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                    : "border-border bg-muted/30 hover:border-red-500/50"
                )}
              >
                <X className="w-5 h-5" />
                No
              </button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              ¿Algo que podamos mejorar? <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos tu experiencia..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={rating === null || resolved === null || submitting}
              className="w-full h-12 text-base font-semibold"
            >
              {submitting ? 'Enviando...' : 'Enviar calificación'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Ahora no
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSATSurveyModal;
