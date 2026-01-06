import { Phone, Rocket, AlertTriangle, X } from "lucide-react";
import { LeadsCounts } from "@/hooks/useLeadsCounts";
import { cn } from "@/lib/utils";

interface SupplyQuickActionBarProps {
  counts: LeadsCounts | undefined;
  isLoading: boolean;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const SupplyQuickActionBar = ({
  counts,
  isLoading,
  activeFilter,
  onFilterChange
}: SupplyQuickActionBarProps) => {
  const actions = [
    {
      id: 'uncontacted',
      label: 'Por Contactar',
      icon: Phone,
      count: counts?.uncontacted || 0,
    },
    {
      id: 'approved',
      label: 'Listos',
      icon: Rocket,
      count: counts?.approved || 0,
    },
    {
      id: 'pending',
      label: 'En Proceso',
      icon: AlertTriangle,
      count: counts?.pending || 0,
    },
  ];

  // Solo mostrar pills con count > 0
  const visibleActions = actions.filter(action => action.count > 0);

  if (visibleActions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleActions.map((action) => {
        const Icon = action.icon;
        const isActive = activeFilter === action.id;
        
        return (
          <button
            key={action.id}
            onClick={() => onFilterChange(isActive ? 'all' : action.id)}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "bg-background/60 backdrop-blur-sm border border-border/30",
              "hover:bg-background/80 hover:border-border/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive && "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{action.label}</span>
            <span className="text-xs tabular-nums opacity-70">
              {isLoading ? '...' : action.count.toLocaleString()}
            </span>
          </button>
        );
      })}

      {activeFilter !== 'all' && (
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      )}
    </div>
  );
};