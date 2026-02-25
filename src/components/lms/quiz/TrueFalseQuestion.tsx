import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { OpcionPregunta } from "@/types/lms";

interface TrueFalseQuestionProps {
  opciones: OpcionPregunta[];
  respuestaSeleccionada: string | undefined;
  onSelect: (opcionId: string) => void;
  mostrarResultado?: boolean;
  disabled?: boolean;
}

export function TrueFalseQuestion({
  opciones,
  respuestaSeleccionada,
  onSelect,
  mostrarResultado = false,
  disabled = false,
}: TrueFalseQuestionProps) {
  const opcionVerdadero = opciones.find(o => 
    o.texto.toLowerCase() === 'verdadero' || 
    o.texto.toLowerCase() === 'true' ||
    o.texto.toLowerCase() === 'sí' ||
    o.texto.toLowerCase() === 'si'
  ) || opciones[0];
  
  const opcionFalso = opciones.find(o => 
    o.texto.toLowerCase() === 'falso' || 
    o.texto.toLowerCase() === 'false' ||
    o.texto.toLowerCase() === 'no'
  ) || opciones[1];

  const renderButton = (opcion: OpcionPregunta, isTrue: boolean) => {
    const isSelected = respuestaSeleccionada === opcion.id;
    const showCorrect = mostrarResultado && opcion.es_correcta;
    const showIncorrect = mostrarResultado && isSelected && !opcion.es_correcta;

    return (
      <button
        key={opcion.id}
        onClick={() => !disabled && onSelect(opcion.id)}
        disabled={disabled}
        className={cn(
          "flex-1 p-8 rounded-2xl transition-all duration-300",
          "border-2 flex flex-col items-center justify-center gap-4",
          "min-h-[160px] group",
          disabled && "cursor-default",
          // Default
          !mostrarResultado && !isSelected && "border-border bg-card",
          !mostrarResultado && !isSelected && !disabled && (
            isTrue 
              ? "hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.03]" 
              : "hover:border-red-400 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.03]"
          ),
          // Selected
          !mostrarResultado && isSelected && isTrue && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg",
          !mostrarResultado && isSelected && !isTrue && "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-lg",
          // Review
          showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
          showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/30",
          mostrarResultado && !showCorrect && !showIncorrect && "border-border bg-card opacity-50"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center",
            "transition-all duration-300",
            !mostrarResultado && !isSelected && "bg-muted",
            !mostrarResultado && !isSelected && !disabled && "group-hover:scale-110",
            !mostrarResultado && isSelected && (isTrue ? "bg-emerald-500" : "bg-red-500"),
            showCorrect && "bg-green-500",
            showIncorrect && "bg-red-500",
            mostrarResultado && !showCorrect && !showIncorrect && "bg-muted"
          )}
        >
          {isTrue ? (
            <Check className={cn(
              "w-8 h-8 transition-colors",
              (isSelected && !mostrarResultado) || showCorrect || showIncorrect
                ? "text-white"
                : "text-muted-foreground"
            )} />
          ) : (
            <X className={cn(
              "w-8 h-8 transition-colors",
              (isSelected && !mostrarResultado) || showCorrect || showIncorrect
                ? "text-white"
                : "text-muted-foreground"
            )} />
          )}
        </div>

        {/* Text */}
        <span className={cn(
          "text-xl font-bold",
          !mostrarResultado && isSelected && isTrue && "text-emerald-700 dark:text-emerald-300",
          !mostrarResultado && isSelected && !isTrue && "text-red-700 dark:text-red-300",
          showCorrect && "text-green-700 dark:text-green-300",
          showIncorrect && "text-red-700 dark:text-red-300"
        )}>
          {isTrue ? 'Verdadero' : 'Falso'}
        </span>
      </button>
    );
  };

  return (
    <div className="flex gap-4">
      {opcionVerdadero && renderButton(opcionVerdadero, true)}
      {opcionFalso && renderButton(opcionFalso, false)}
    </div>
  );
}
