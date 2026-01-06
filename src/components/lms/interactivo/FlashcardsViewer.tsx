import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlashcardsData } from "@/types/lms";

interface FlashcardsViewerProps {
  data: FlashcardsData;
  onComplete?: () => void;
}

export function FlashcardsViewer({ data, onComplete }: FlashcardsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]));

  const cards = data?.cards || [];
  const totalCards = cards.length;
  const currentCard = cards[currentIndex];

  if (!cards.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay tarjetas disponibles.
      </div>
    );
  }

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setViewedCards(prev => new Set([...prev, currentIndex + 1]));
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleComplete = () => {
    onComplete?.();
  };

  const allViewed = viewedCards.size === totalCards;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{currentIndex + 1}</span>
        <span>/</span>
        <span>{totalCards}</span>
        <div className="flex gap-1 ml-4">
          {cards.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                idx === currentIndex 
                  ? "bg-primary" 
                  : viewedCards.has(idx) 
                    ? "bg-primary/40" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Card container */}
      <div 
        className="w-full max-w-lg perspective-1000 cursor-pointer"
        onClick={handleFlip}
      >
        <div 
          className={cn(
            "relative w-full min-h-[300px] transition-transform duration-500 preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          style={{ 
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          {/* Front */}
          <div 
            className={cn(
              "absolute inset-0 backface-hidden rounded-xl border-2 border-primary/20 bg-card p-6 flex flex-col items-center justify-center shadow-lg",
              "transition-shadow hover:shadow-xl"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            {currentCard.image_url && (
              <img 
                src={currentCard.image_url} 
                alt="" 
                className="max-h-32 mb-4 rounded-lg object-contain"
              />
            )}
            <p className="text-lg text-center font-medium">{currentCard.front}</p>
            <p className="text-xs text-muted-foreground mt-4">Toca para voltear</p>
          </div>

          {/* Back */}
          <div 
            className={cn(
              "absolute inset-0 backface-hidden rounded-xl border-2 border-accent bg-accent/5 p-6 flex items-center justify-center shadow-lg"
            )}
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <p className="text-lg text-center">{currentCard.back}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Complete button */}
      {allViewed && (
        <Button onClick={handleComplete} className="mt-2">
          <Check className="h-4 w-4 mr-2" />
          Marcar como completado
        </Button>
      )}
    </div>
  );
}
