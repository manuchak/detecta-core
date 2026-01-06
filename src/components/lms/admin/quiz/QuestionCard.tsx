import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface QuizOption {
  texto: string;
}

export interface QuizQuestion {
  id: string;
  pregunta: string;
  opciones: QuizOption[];
  respuesta_correcta: number;
  explicacion: string;
  puntos: number;
}

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  onUpdate: (id: string, updates: Partial<QuizQuestion>) => void;
  onDelete: (id: string) => void;
  isOnly: boolean;
}

export function QuestionCard({ question, index, onUpdate, onDelete, isOnly }: QuestionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isComplete = 
    question.pregunta.trim() !== "" &&
    question.opciones.every(o => o.texto.trim() !== "") &&
    question.respuesta_correcta >= 0 &&
    question.respuesta_correcta < question.opciones.length;

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...question.opciones];
    newOptions[optionIndex] = { texto: value };
    onUpdate(question.id, { opciones: newOptions });
  };

  const handleCorrectAnswerChange = (value: string) => {
    onUpdate(question.id, { respuesta_correcta: parseInt(value) });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-card transition-all duration-200",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/20",
        !isDragging && "hover:shadow-md"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b bg-muted/30 rounded-t-xl">
          <button
            className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {index + 1}
            </span>
            <span className="text-sm font-medium truncate flex-1">
              {question.pregunta || "Nueva pregunta"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {question.puntos} pts
            </span>
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(question.id)}
              disabled={isOnly}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Pregunta */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pregunta
              </Label>
              <Textarea
                value={question.pregunta}
                onChange={(e) => onUpdate(question.id, { pregunta: e.target.value })}
                placeholder="Escribe la pregunta aquí..."
                className="resize-none min-h-[60px]"
              />
            </div>

            {/* Opciones con RadioGroup */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Opciones de respuesta
              </Label>
              <p className="text-xs text-muted-foreground">
                Selecciona la opción correcta
              </p>
              
              <RadioGroup
                value={question.respuesta_correcta.toString()}
                onValueChange={handleCorrectAnswerChange}
                className="space-y-2"
              >
                {question.opciones.map((opcion, optIdx) => (
                  <div
                    key={optIdx}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      question.respuesta_correcta === optIdx
                        ? "border-green-500/50 bg-green-500/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <RadioGroupItem
                      value={optIdx.toString()}
                      id={`${question.id}-option-${optIdx}`}
                      className={cn(
                        question.respuesta_correcta === optIdx && "border-green-500 text-green-500"
                      )}
                    />
                    <div className="flex-1">
                      <Input
                        value={opcion.texto}
                        onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                        placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                        className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                    {question.respuesta_correcta === optIdx && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Explicación y Puntos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Explicación (opcional)
                </Label>
                <Textarea
                  value={question.explicacion}
                  onChange={(e) => onUpdate(question.id, { explicacion: e.target.value })}
                  placeholder="Explica por qué esta es la respuesta correcta..."
                  className="resize-none min-h-[60px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Puntos
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onUpdate(question.id, { puntos: Math.max(1, question.puntos - 1) })}
                    disabled={question.puntos <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={question.puntos}
                    onChange={(e) => onUpdate(question.id, { puntos: parseInt(e.target.value) || 1 })}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => onUpdate(question.id, { puntos: Math.min(100, question.puntos + 1) })}
                    disabled={question.puntos >= 100}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
