import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIGenerateButtonProps {
  onClick: () => void;
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  tooltip?: string;
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function AIGenerateButton({
  onClick,
  loading = false,
  success = false,
  disabled = false,
  tooltip = "Generar con IA",
  size = "icon",
  className,
}: AIGenerateButtonProps) {
  const Icon = loading ? Loader2 : success ? Check : Sparkles;
  
  const button = (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "transition-all duration-200",
        success && "border-green-500 text-green-600 bg-green-50 dark:bg-green-950",
        !success && !loading && "hover:border-primary hover:text-primary hover:bg-primary/5",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", loading && "animate-spin")} />
      {size !== "icon" && (
        <span className="ml-2">
          {loading ? "Generando..." : success ? "Generado" : "Generar con IA"}
        </span>
      )}
    </Button>
  );

  if (size === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{loading ? "Generando..." : tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
