import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Loader2 } from "lucide-react";

interface AIPromptPopoverProps {
  onGenerate: (prompt?: string) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
  className?: string;
}

export function AIPromptPopover({
  onGenerate,
  loading = false,
  disabled = false,
  label = "Generar con IA",
  size = "sm",
  variant = "outline",
  className,
}: AIPromptPopoverProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    onGenerate(prompt.trim() || undefined);
    setOpen(false);
    setPrompt("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled || loading}
          className={className}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium">Instrucciones para la IA</p>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Enfócate en protocolos de emergencia, usa ejemplos de rutas México-Puebla..."
            rows={3}
            className="text-xs resize-none min-h-[60px]"
          />
          <p className="text-[10px] text-muted-foreground">
            Opcional — si lo dejas vacío se genera con el contexto del módulo.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full gap-1"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          Generar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
