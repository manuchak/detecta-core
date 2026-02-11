import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { Sparkles, Loader2, Plus, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export interface FlashcardOutline {
  id: string;
  front: string;
  back: string;
}

interface InlineFlashcardEditorProps {
  cards: FlashcardOutline[];
  onChange: (cards: FlashcardOutline[]) => void;
  moduloTitulo?: string;
  cursoTitulo?: string;
}

export function InlineFlashcardEditor({ cards, onChange, moduloTitulo, cursoTitulo }: InlineFlashcardEditorProps) {
  const { generateFlashcards, loading } = useLMSAI();

  const handleGenerate = async () => {
    const tema = moduloTitulo || cursoTitulo || "Seguridad y custodia";
    const contexto = cursoTitulo ? `Curso: ${cursoTitulo}` : undefined;
    const result = await generateFlashcards(tema, 6, contexto);
    if (result?.cards) {
      const mapped: FlashcardOutline[] = result.cards.map((c) => ({
        id: crypto.randomUUID(),
        front: c.front,
        back: c.back,
      }));
      onChange([...cards, ...mapped]);
      toast.success(`${mapped.length} flashcards generadas`);
    }
  };

  const addCard = () => {
    onChange([...cards, { id: crypto.randomUUID(), front: "", back: "" }]);
  };

  const updateCard = (id: string, updates: Partial<FlashcardOutline>) => {
    onChange(cards.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCard = (id: string) => {
    onChange(cards.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Flashcards</span>
          {cards.length > 0 && (
            <Badge variant="secondary" className="text-xs">{cards.length}</Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="h-7 text-xs gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generar con IA
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg text-center border border-dashed border-orange-200/50">
          <p className="text-xs text-muted-foreground mb-2">Sin flashcards aún</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleGenerate} disabled={loading}>
              <Sparkles className="w-3 h-3 mr-1" /> Generar con IA
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addCard}>
              <Plus className="w-3 h-3 mr-1" /> Manual
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {cards.map((card, idx) => (
            <div key={card.id} className="flex items-start gap-2 p-2.5 border rounded-lg bg-background">
              <span className="text-xs font-medium text-muted-foreground mt-2 w-4 shrink-0">{idx + 1}</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={card.front}
                  onChange={(e) => updateCard(card.id, { front: e.target.value })}
                  placeholder="Frente (concepto)"
                  className="h-8 text-xs"
                />
                <Input
                  value={card.back}
                  onChange={(e) => updateCard(card.id, { back: e.target.value })}
                  placeholder="Reverso (explicación)"
                  className="h-8 text-xs"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => deleteCard(card.id)}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addCard}
          className="w-full h-7 text-xs border border-dashed border-muted-foreground/30 text-muted-foreground"
        >
          <Plus className="w-3 h-3 mr-1" /> Agregar flashcard
        </Button>
      )}
    </div>
  );
}
