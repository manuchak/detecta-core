import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Rocket, AlertTriangle, BarChart3 } from "lucide-react";
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
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      activeColor: 'bg-blue-600 ring-2 ring-blue-300',
    },
    {
      id: 'approved',
      label: 'Listos para Liberar',
      icon: Rocket,
      count: counts?.approved || 0,
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      activeColor: 'bg-emerald-600 ring-2 ring-emerald-300',
    },
    {
      id: 'pending',
      label: 'En Proceso',
      icon: AlertTriangle,
      count: counts?.pending || 0,
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
      activeColor: 'bg-amber-600 ring-2 ring-amber-300',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
      <span className="text-sm font-medium text-muted-foreground mr-2">Acceso rápido:</span>
      
      {actions.map((action) => {
        const Icon = action.icon;
        const isActive = activeFilter === action.id;
        
        return (
          <Button
            key={action.id}
            size="sm"
            onClick={() => onFilterChange(isActive ? 'all' : action.id)}
            className={cn(
              "h-9 px-3 transition-all",
              isActive ? action.activeColor : action.color
            )}
            disabled={isLoading}
          >
            <Icon className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">{action.label}</span>
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/20 text-inherit hover:bg-white/30 px-1.5 py-0 text-xs font-bold"
            >
              {isLoading ? '...' : action.count}
            </Badge>
          </Button>
        );
      })}

      {activeFilter !== 'all' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onFilterChange('all')}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          Ver todos
        </Button>
      )}
    </div>
  );
};
