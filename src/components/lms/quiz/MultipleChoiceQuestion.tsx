import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { OpcionPregunta } from "@/types/lms";

interface MultipleChoiceQuestionProps {
  opciones: OpcionPregunta[];
  respuestaSeleccionada: string | undefined;
  onSelect: (opcionId: string) => void;
  mostrarResultado?: boolean;
  disabled?: boolean;
}

export function MultipleChoiceQuestion({
  opciones,
  respuestaSeleccionada,
  onSelect,
  mostrarResultado = false,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="space-y-3">
      {opciones.map((opcion) => {
        const isSelected = respuestaSeleccionada === opcion.id;
        const showCorrect = mostrarResultado && opcion.es_correcta;
        const showIncorrect = mostrarResultado && isSelected && !opcion.es_correcta;

        return (
          <button
            key={opcion.id}
            onClick={() => !disabled && onSelect(opcion.id)}
            disabled={disabled}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all duration-200",
              "border-2 flex items-center gap-3",
              disabled && "cursor-default",
              !disabled && "hover:border-primary/50 hover:bg-primary/5",
              !mostrarResultado && isSelected && "border-primary bg-primary/10",
              !mostrarResultado && !isSelected && "border-border bg-card",
              showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
              showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/30",
              mostrarResultado && !showCorrect && !showIncorrect && "border-border bg-card opacity-60"
            )}
          >
            {/* Radio indicator */}
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                "transition-all duration-200",
                !mostrarResultado && isSelected && "border-primary bg-primary",
                !mostrarResultado && !isSelected && "border-muted-foreground/30",
                showCorrect && "border-green-500 bg-green-500",
                showIncorrect && "border-red-500 bg-red-500",
                mostrarResultado && !showCorrect && !showIncorrect && "border-muted-foreground/30"
              )}
            >
              {(isSelected || showCorrect) && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>

            {/* Text */}
            <span className={cn(
              "flex-1 text-sm font-medium",
              isSelected && !mostrarResultado && "text-primary",
              showCorrect && "text-green-700 dark:text-green-300",
              showIncorrect && "text-red-700 dark:text-red-300"
            )}>
              {opcion.texto}
            </span>

            {/* Result icons */}
            {mostrarResultado && (
              <>
                {showCorrect && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                {showIncorrect && (
                  <X className="w-5 h-5 text-red-600" />
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
