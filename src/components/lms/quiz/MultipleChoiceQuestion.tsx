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

const OPTION_COLORS = [
  { bg: 'bg-blue-500', bgLight: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', hover: 'hover:border-blue-400 hover:shadow-blue-500/20' },
  { bg: 'bg-orange-500', bgLight: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300', hover: 'hover:border-orange-400 hover:shadow-orange-500/20' },
  { bg: 'bg-emerald-500', bgLight: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', hover: 'hover:border-emerald-400 hover:shadow-emerald-500/20' },
  { bg: 'bg-purple-500', bgLight: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', hover: 'hover:border-purple-400 hover:shadow-purple-500/20' },
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function MultipleChoiceQuestion({
  opciones,
  respuestaSeleccionada,
  onSelect,
  mostrarResultado = false,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const useGrid = opciones.length === 4;

  return (
    <div className={cn(
      useGrid ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"
    )}>
      {opciones.map((opcion, idx) => {
        const isSelected = respuestaSeleccionada === opcion.id;
        const showCorrect = mostrarResultado && opcion.es_correcta;
        const showIncorrect = mostrarResultado && isSelected && !opcion.es_correcta;
        const color = OPTION_COLORS[idx % OPTION_COLORS.length];
        const letter = OPTION_LETTERS[idx] || String(idx + 1);

        return (
          <button
            key={opcion.id}
            onClick={() => !disabled && onSelect(opcion.id)}
            disabled={disabled}
            className={cn(
              "w-full p-4 rounded-2xl text-left transition-all duration-200",
              "border-2 flex items-center gap-4",
              "group",
              disabled && "cursor-default",
              // Default state
              !mostrarResultado && !isSelected && "border-border bg-card",
              !mostrarResultado && !isSelected && !disabled && cn(color.hover, "hover:shadow-lg hover:scale-[1.02]"),
              // Selected state
              !mostrarResultado && isSelected && cn(color.border, color.bgLight, "shadow-md"),
              // Review states
              showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30 animate-[pulse_0.5s_ease-in-out_1]",
              showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/30 animate-[shake_0.4s_ease-in-out_1]",
              mostrarResultado && !showCorrect && !showIncorrect && "border-border bg-card opacity-50"
            )}
          >
            {/* Letter badge */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                "text-white font-bold text-lg transition-all duration-200",
                !mostrarResultado && !isSelected && "bg-muted text-muted-foreground",
                !mostrarResultado && isSelected && color.bg,
                !mostrarResultado && !isSelected && !disabled && "group-hover:scale-110",
                showCorrect && "bg-green-500 text-white",
                showIncorrect && "bg-red-500 text-white",
                mostrarResultado && !showCorrect && !showIncorrect && "bg-muted text-muted-foreground"
              )}
            >
              {showCorrect ? <Check className="w-5 h-5" /> : showIncorrect ? <X className="w-5 h-5" /> : letter}
            </div>

            {/* Text */}
            <span className={cn(
              "flex-1 text-base font-medium leading-snug",
              !mostrarResultado && isSelected && color.text,
              showCorrect && "text-green-700 dark:text-green-300",
              showIncorrect && "text-red-700 dark:text-red-300"
            )}>
              {opcion.texto}
            </span>
          </button>
        );
      })}
    </div>
  );
}
