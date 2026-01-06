import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface RoleSelectCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export function RoleSelectCard({ label, description, selected, onClick }: RoleSelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
        "hover:border-primary/50 hover:bg-accent/30",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border bg-card"
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <span className={cn(
        "font-medium text-sm",
        selected ? "text-primary" : "text-foreground"
      )}>
        {label}
      </span>
      {description && (
        <span className="block text-xs text-muted-foreground mt-0.5">
          {description}
        </span>
      )}
    </button>
  );
}
