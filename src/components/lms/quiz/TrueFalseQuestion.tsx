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
  // Asegurar que tenemos las opciones de verdadero/falso
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
          "flex-1 p-6 rounded-2xl transition-all duration-200",
          "border-2 flex flex-col items-center justify-center gap-3",
          "min-h-[140px]",
          disabled && "cursor-default",
          !disabled && "hover:border-primary/50 hover:bg-primary/5",
          !mostrarResultado && isSelected && "border-primary bg-primary/10 shadow-lg",
          !mostrarResultado && !isSelected && "border-border bg-card",
          showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
          showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/30",
          mostrarResultado && !showCorrect && !showIncorrect && "border-border bg-card opacity-60"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "transition-all duration-200",
            !mostrarResultado && isSelected && (isTrue ? "bg-green-500" : "bg-red-500"),
            !mostrarResultado && !isSelected && "bg-muted",
            showCorrect && "bg-green-500",
            showIncorrect && "bg-red-500",
            mostrarResultado && !showCorrect && !showIncorrect && "bg-muted"
          )}
        >
          {isTrue ? (
            <Check className={cn(
              "w-6 h-6",
              (isSelected && !mostrarResultado) || showCorrect || showIncorrect
                ? "text-white"
                : "text-muted-foreground"
            )} />
          ) : (
            <X className={cn(
              "w-6 h-6",
              (isSelected && !mostrarResultado) || showCorrect || showIncorrect
                ? "text-white"
                : "text-muted-foreground"
            )} />
          )}
        </div>

        {/* Text */}
        <span className={cn(
          "text-lg font-semibold",
          isSelected && !mostrarResultado && "text-primary",
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
