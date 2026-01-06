import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Sparkles, HelpCircle, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionCard, QuizQuestion } from "./QuestionCard";
import { cn } from "@/lib/utils";

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  onGenerateWithAI?: () => void;
  isGenerating?: boolean;
  moduloTitulo?: string;
}

export function QuizEditor({
  questions,
  onChange,
  onGenerateWithAI,
  isGenerating = false,
  moduloTitulo,
}: QuizEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      onChange(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      pregunta: "",
      opciones: [
        { texto: "" },
        { texto: "" },
        { texto: "" },
        { texto: "" },
      ],
      respuesta_correcta: 0,
      explicacion: "",
      puntos: 10,
    };
    onChange([...questions, newQuestion]);
  }, [questions, onChange]);

  const updateQuestion = useCallback(
    (id: string, updates: Partial<QuizQuestion>) => {
      onChange(
        questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
      );
    },
    [questions, onChange]
  );

  const deleteQuestion = useCallback(
    (id: string) => {
      onChange(questions.filter((q) => q.id !== id));
    },
    [questions, onChange]
  );

  const totalPoints = questions.reduce((sum, q) => sum + q.puntos, 0);
  const completeQuestions = questions.filter(
    (q) =>
      q.pregunta.trim() !== "" &&
      q.opciones.every((o) => o.texto.trim() !== "") &&
      q.respuesta_correcta >= 0
  ).length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/50 border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">{completeQuestions}</span>
              <span className="text-muted-foreground">/{questions.length} preguntas</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">{totalPoints}</span>
              <span className="text-muted-foreground"> puntos totales</span>
            </span>
          </div>
        </div>

        {onGenerateWithAI && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateWithAI}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            Generar con IA
          </Button>
        )}
      </div>

      {/* Empty State */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Sin preguntas aún</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
            Agrega preguntas manualmente o usa la IA para generar una batería de preguntas basada en "{moduloTitulo || 'el módulo'}".
          </p>
          <div className="flex gap-2">
            <Button onClick={addQuestion} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </Button>
            {onGenerateWithAI && (
              <Button onClick={onGenerateWithAI} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generar con IA
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Questions List with Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    isOnly={questions.length === 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Question Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className={cn(
              "w-full border-dashed gap-2 h-12",
              "hover:border-primary hover:bg-primary/5"
            )}
          >
            <Plus className="h-4 w-4" />
            Agregar otra pregunta
          </Button>
        </>
      )}
    </div>
  );
}
