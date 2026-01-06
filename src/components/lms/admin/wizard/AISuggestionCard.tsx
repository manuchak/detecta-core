import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISuggestionCardProps {
  title: string;
  children: React.ReactNode;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate?: () => void;
  loading?: boolean;
  className?: string;
}

export function AISuggestionCard({
  title,
  children,
  onAccept,
  onReject,
  onRegenerate,
  loading = false,
  className,
}: AISuggestionCardProps) {
  return (
    <div
      className={cn(
        "border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
          {title}
        </span>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={loading}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAccept}
            className="h-7 px-3"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Aplicar
          </Button>
        </div>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
