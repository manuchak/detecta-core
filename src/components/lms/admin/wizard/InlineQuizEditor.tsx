import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { 
  Sparkles, Loader2, Plus, Trash2, GripVertical, 
  ChevronDown, ChevronRight, HelpCircle, CheckCircle2, XCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface QuizQuestionOutline {
  id: string;
  question: string;
  type: "single" | "multiple";
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
}

interface InlineQuizEditorProps {
  questions: QuizQuestionOutline[];
  onChange: (questions: QuizQuestionOutline[]) => void;
  moduloTitulo?: string;
  cursoTitulo?: string;
}

export function InlineQuizEditor({ questions, onChange, moduloTitulo, cursoTitulo }: InlineQuizEditorProps) {
  const { generateQuizQuestions, loading } = useLMSAI();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    const tema = moduloTitulo || cursoTitulo || "Seguridad y custodia";
    const contexto = cursoTitulo ? `Curso: ${cursoTitulo}` : undefined;
    const result = await generateQuizQuestions(tema, 5, contexto);
    if (result?.questions) {
      const mapped: QuizQuestionOutline[] = result.questions.map((q) => ({
        id: crypto.randomUUID(),
        question: q.question,
        type: q.type,
        options: q.options.map((o) => ({ ...o, id: o.id || crypto.randomUUID() })),
        explanation: q.explanation,
      }));
      onChange([...questions, ...mapped]);
      toast.success(`${mapped.length} preguntas generadas`);
    }
  };

  const addQuestion = () => {
    const newQ: QuizQuestionOutline = {
      id: crypto.randomUUID(),
      question: "",
      type: "single",
      options: [
        { id: "a", text: "", isCorrect: true },
        { id: "b", text: "", isCorrect: false },
        { id: "c", text: "", isCorrect: false },
        { id: "d", text: "", isCorrect: false },
      ],
      explanation: "",
    };
    onChange([...questions, newQ]);
    setExpandedId(newQ.id);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestionOutline>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateOption = (qId: string, optId: string, updates: Partial<QuizQuestionOutline["options"][0]>) => {
    onChange(
      questions.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.map((o) => (o.id === optId ? { ...o, ...updates } : o)),
        };
      })
    );
  };

  const toggleCorrect = (qId: string, optId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q) return;
    if (q.type === "single") {
      // Only one correct
      onChange(
        questions.map((qq) => {
          if (qq.id !== qId) return qq;
          return { ...qq, options: qq.options.map((o) => ({ ...o, isCorrect: o.id === optId })) };
        })
      );
    } else {
      updateOption(qId, optId, { isCorrect: !q.options.find((o) => o.id === optId)?.isCorrect });
    }
  };

  const addOption = (qId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q || q.options.length >= 6) return;
    const letters = "abcdefgh";
    const newOpt = { id: letters[q.options.length] || crypto.randomUUID(), text: "", isCorrect: false };
    updateQuestion(qId, { options: [...q.options, newOpt] });
  };

  const deleteOption = (qId: string, optId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q || q.options.length <= 2) return;
    updateQuestion(qId, { options: q.options.filter((o) => o.id !== optId) });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Preguntas del Quiz</span>
          {questions.length > 0 && (
            <Badge variant="secondary" className="text-xs">{questions.length}</Badge>
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

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg text-center border border-dashed border-purple-200/50">
          <p className="text-xs text-muted-foreground mb-2">Sin preguntas aún</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleGenerate} disabled={loading}>
              <Sparkles className="w-3 h-3 mr-1" /> Generar con IA
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addQuestion}>
              <Plus className="w-3 h-3 mr-1" /> Manual
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => {
            const isExpanded = expandedId === q.id;
            const correctCount = q.options.filter((o) => o.isCorrect).length;
            return (
              <div key={q.id} className="border rounded-lg overflow-hidden bg-background">
                {/* Question header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="w-full flex items-center gap-2 p-2.5 hover:bg-muted/50 text-left"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="text-sm flex-1 truncate">{q.question || "Pregunta sin título"}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {q.type === "single" ? "Única" : "Múltiple"}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">{correctCount} correcta{correctCount !== 1 ? "s" : ""}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </button>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="p-3 pt-0 space-y-3 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pregunta</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                        placeholder="¿Cuál es...?"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Label className="text-xs">Tipo:</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, { type: "single" })}
                          className={cn("text-xs px-2 py-1 rounded border", q.type === "single" ? "bg-primary text-primary-foreground" : "bg-muted")}
                        >
                          Única
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, { type: "multiple" })}
                          className={cn("text-xs px-2 py-1 rounded border", q.type === "multiple" ? "bg-primary text-primary-foreground" : "bg-muted")}
                        >
                          Múltiple
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Opciones</Label>
                      {q.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCorrect(q.id, opt.id)}
                            className={cn(
                              "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              opt.isCorrect
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground/30 hover:border-green-400"
                            )}
                          >
                            {opt.isCorrect && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                            placeholder={`Opción ${opt.id}`}
                            className="h-7 text-xs flex-1"
                          />
                          {q.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => deleteOption(q.id, opt.id)}
                            >
                              <XCircle className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {q.options.length < 6 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs w-full"
                          onClick={() => addOption(q.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Agregar opción
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Explicación (se muestra al responder)</Label>
                      <Textarea
                        value={q.explanation}
                        onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                        placeholder="¿Por qué esta es la respuesta correcta?"
                        rows={2}
                        className="text-xs resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      {questions.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addQuestion}
          className="w-full h-7 text-xs border border-dashed border-muted-foreground/30 text-muted-foreground"
        >
          <Plus className="w-3 h-3 mr-1" /> Agregar pregunta
        </Button>
      )}
    </div>
  );
}
