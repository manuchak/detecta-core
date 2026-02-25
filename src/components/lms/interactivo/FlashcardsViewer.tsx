import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Check, Shuffle, X, Minus, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlashcardsData } from "@/types/lms";

type Mastery = "unknown" | "no" | "almost" | "yes";

interface FlashcardsViewerProps {
  data: FlashcardsData;
  onComplete?: () => void;
}

export function FlashcardsViewer({ data, onComplete }: FlashcardsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastery, setMastery] = useState<Map<number, Mastery>>(new Map());
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const cards = data?.cards || [];
  const totalCards = cards.length;

  // Build display order
  const displayOrder = useMemo(() => {
    if (isShuffled && shuffledIndices.length === totalCards) return shuffledIndices;
    return Array.from({ length: totalCards }, (_, i) => i);
  }, [isShuffled, shuffledIndices, totalCards]);

  const realIndex = displayOrder[currentIndex] ?? 0;
  const currentCard = cards[realIndex];

  // Mastery counts
  const counts = useMemo(() => {
    const c = { no: 0, almost: 0, yes: 0, unknown: 0 };
    for (let i = 0; i < totalCards; i++) {
      const m = mastery.get(i) || "unknown";
      c[m]++;
    }
    return c;
  }, [mastery, totalCards]);

  const allMastered = counts.yes === totalCards && totalCards > 0;

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleMastery = (level: Mastery) => {
    setMastery(prev => new Map(prev).set(realIndex, level));
    // Auto-advance after rating
    if (currentIndex < totalCards - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      }, 300);
    } else if (level === "yes" && counts.yes + 1 === totalCards) {
      setTimeout(() => setShowSummary(true), 400);
    }
  };

  const handleShuffle = () => {
    const indices = Array.from({ length: totalCards }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setIsShuffled(true);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReviewDifficult = () => {
    const difficult = Array.from({ length: totalCards }, (_, i) => i)
      .filter(i => {
        const m = mastery.get(i) || "unknown";
        return m === "no" || m === "almost";
      });
    if (difficult.length > 0) {
      setShuffledIndices(difficult);
      setIsShuffled(true);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowSummary(false);
    }
  };

  const handleReset = () => {
    setMastery(new Map());
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setShuffledIndices([]);
    setShowSummary(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showSummary) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleFlip();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "1":
          if (isFlipped) { e.preventDefault(); handleMastery("no"); }
          break;
        case "2":
          if (isFlipped) { e.preventDefault(); handleMastery("almost"); }
          break;
        case "3":
          if (isFlipped) { e.preventDefault(); handleMastery("yes"); }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!cards.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay tarjetas disponibles.
      </div>
    );
  }

  // Summary screen
  if (showSummary) {
    const difficultCount = counts.no + counts.almost;
    return (
      <div className="flex flex-col items-center gap-6 p-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">¡Repaso completado!</h3>
        
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{counts.yes}</p>
            <p className="text-xs text-muted-foreground mt-1">Dominadas</p>
          </div>
          <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{counts.almost}</p>
            <p className="text-xs text-muted-foreground mt-1">Casi</p>
          </div>
          <div className="rounded-xl border bg-red-50 dark:bg-red-950/20 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.no}</p>
            <p className="text-xs text-muted-foreground mt-1">Por repasar</p>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          {difficultCount > 0 && (
            <Button variant="outline" onClick={handleReviewDifficult}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Repasar difíciles ({difficultCount})
            </Button>
          )}
          <Button variant="outline" onClick={handleReset}>
            Reiniciar todo
          </Button>
          {allMastered && onComplete && (
            <Button onClick={onComplete}>
              <Check className="h-4 w-4 mr-2" />
              Completar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentMastery = mastery.get(realIndex) || "unknown";

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* Mastery progress bar */}
      <div className="w-full max-w-lg space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Tarjeta <span className="font-semibold text-foreground">{currentIndex + 1}</span> de {displayOrder.length}
          </span>
          <span className="text-emerald-600 font-medium">
            {counts.yes} de {totalCards} dominadas
          </span>
        </div>
        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted gap-px">
          {displayOrder.map((idx, i) => {
            const m = mastery.get(idx) || "unknown";
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 transition-colors duration-300 first:rounded-l-full last:rounded-r-full",
                  m === "yes" && "bg-emerald-500",
                  m === "almost" && "bg-amber-400",
                  m === "no" && "bg-red-400",
                  m === "unknown" && "bg-muted-foreground/20",
                  i === currentIndex && "ring-2 ring-primary ring-offset-1"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-lg cursor-pointer select-none"
        onClick={handleFlip}
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative w-full min-h-[350px] transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            style={{ backfaceVisibility: "hidden" }}
          >
            {currentCard?.image_url && (
              <img
                src={currentCard.image_url}
                alt=""
                className="max-h-36 mb-5 rounded-xl object-contain"
              />
            )}
            <p className="text-xl text-center font-semibold leading-relaxed">{currentCard?.front}</p>
            <div className="flex items-center gap-2 mt-6 text-muted-foreground">
              <RotateCcw className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Toca para voltear</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-blue-300/40 dark:border-blue-700/40 bg-gradient-to-br from-blue-50 via-card to-blue-50/50 dark:from-blue-950/30 dark:via-card dark:to-blue-950/20 p-8 flex items-center justify-center shadow-lg"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-xl text-center leading-relaxed">{currentCard?.back}</p>
          </div>
        </div>
      </div>

      {/* Self-assessment buttons (visible after flip) */}
      {isFlipped && (
        <div className="flex gap-3 animate-fade-in">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5",
              currentMastery === "no" && "bg-red-50 dark:bg-red-950/20 ring-2 ring-red-400"
            )}
            onClick={(e) => { e.stopPropagation(); handleMastery("no"); }}
          >
            <X className="h-3.5 w-3.5" />
            No la sé
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 gap-1.5",
              currentMastery === "almost" && "bg-amber-50 dark:bg-amber-950/20 ring-2 ring-amber-400"
            )}
            onClick={(e) => { e.stopPropagation(); handleMastery("almost"); }}
          >
            <Minus className="h-3.5 w-3.5" />
            Casi
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1.5",
              currentMastery === "yes" && "bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-400"
            )}
            onClick={(e) => { e.stopPropagation(); handleMastery("yes"); }}
          >
            <Check className="h-3.5 w-3.5" />
            La sé
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleShuffle} title="Mezclar">
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} title="Reiniciar">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === displayOrder.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      <button
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        onClick={() => setShowShortcuts(!showShortcuts)}
      >
        <Keyboard className="h-3 w-3" />
        Atajos de teclado
      </button>
      {showShortcuts && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2 grid grid-cols-2 gap-x-6 gap-y-1 animate-fade-in">
          <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">Espacio</kbd> Voltear</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">←→</kbd> Navegar</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">1</kbd> No la sé</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">2</kbd> Casi</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted border text-[10px]">3</kbd> La sé</span>
        </div>
      )}

      {/* Complete button when all mastered */}
      {allMastered && onComplete && (
        <Button onClick={onComplete} className="mt-2 animate-fade-in">
          <Check className="h-4 w-4 mr-2" />
          Marcar como completado
        </Button>
      )}
    </div>
  );
}
