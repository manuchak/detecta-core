import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import type { OpcionPregunta } from "@/types/lms";

interface ShortAnswerQuestionProps {
  opciones: OpcionPregunta[];
  respuesta: string;
  onChange: (value: string) => void;
  mostrarResultado?: boolean;
  esCorrecta?: boolean;
  disabled?: boolean;
}

export function ShortAnswerQuestion({
  opciones,
  respuesta,
  onChange,
  mostrarResultado = false,
  esCorrecta = false,
  disabled = false,
}: ShortAnswerQuestionProps) {
  const respuestaCorrecta = opciones[0]?.texto;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={respuesta}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu respuesta..."
          disabled={disabled}
          className={cn(
            "text-base py-6 px-4 rounded-xl transition-all duration-200",
            mostrarResultado && esCorrecta && "border-green-500 bg-green-50 dark:bg-green-950/30",
            mostrarResultado && !esCorrecta && respuesta && "border-red-500 bg-red-50 dark:bg-red-950/30"
          )}
        />
        
        {/* Result icon */}
        {mostrarResultado && respuesta && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center",
            esCorrecta ? "bg-green-500" : "bg-red-500"
          )}>
            {esCorrecta ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <X className="w-5 h-5 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Show correct answer if wrong */}
      {mostrarResultado && !esCorrecta && respuestaCorrecta && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-sm text-muted-foreground mb-1">Respuesta correcta:</p>
          <p className="font-medium text-green-700 dark:text-green-300">{respuestaCorrecta}</p>
        </div>
      )}
    </div>
  );
}
