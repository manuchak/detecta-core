import { Button } from "@/components/ui/button";
import { AssignedLead } from "@/types/leadTypes";
import { 
  AlertTriangle, 
  UserPlus, 
  Calendar,
  PhoneOff,
  Phone,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  active: boolean;
}

interface ApprovalQuickFiltersProps {
  leads: AssignedLead[];
  activeFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
}

export const ApprovalQuickFilters = ({ 
  leads, 
  activeFilter, 
  onFilterChange 
}: ApprovalQuickFiltersProps) => {
  const [showAll, setShowAll] = useState(false);
  
  const calculateFilterCounts = (leads: AssignedLead[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    return {
      newToday: leads.filter(lead => {
        const creationDate = new Date(lead.lead_fecha_creacion);
        const creationDateOnly = new Date(creationDate.getFullYear(), creationDate.getMonth(), creationDate.getDate());
        return creationDateOnly.getTime() === today.getTime() && (lead.contact_attempts_count || 0) === 0;
      }).length,
      
      urgentPending: leads.filter(lead => {
        const creationDate = new Date(lead.lead_fecha_creacion);
        return creationDate < threeDaysAgo && (lead.contact_attempts_count || 0) === 0;
      }).length,
      
      failedAttempts: leads.filter(lead => {
        const failedOutcomes = ['voicemail', 'no_answer', 'busy', 'wrong_number', 'non_existent_number', 'call_failed'];
        return lead.last_contact_outcome && failedOutcomes.includes(lead.last_contact_outcome);
      }).length,
      
      scheduledToday: leads.filter(lead => {
        if (!lead.scheduled_call_datetime) return false;
        const scheduledDate = new Date(lead.scheduled_call_datetime);
        const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
        return scheduledDateOnly.getTime() === today.getTime();
      }).length,
      
      successfulCalls: leads.filter(lead => 
        lead.has_successful_call && !lead.final_decision
      ).length,
    };
  };

  const counts = calculateFilterCounts(leads);

  // Filtros prioritarios (siempre visibles si tienen count > 0)
  const priorityFilters: QuickFilter[] = [
    {
      id: 'urgentPending',
      label: 'Urgentes',
      icon: AlertTriangle,
      count: counts.urgentPending,
      active: activeFilter === 'urgentPending'
    },
    {
      id: 'newToday',
      label: 'Nuevos hoy',
      icon: UserPlus,
      count: counts.newToday,
      active: activeFilter === 'newToday'
    },
    {
      id: 'failedAttempts',
      label: 'Sin contestar',
      icon: PhoneOff,
      count: counts.failedAttempts,
      active: activeFilter === 'failedAttempts'
    },
    {
      id: 'scheduledToday',
      label: 'Citas hoy',
      icon: Calendar,
      count: counts.scheduledToday,
      active: activeFilter === 'scheduledToday'
    },
    {
      id: 'successfulCalls',
      label: 'Por decidir',
      icon: Phone,
      count: counts.successfulCalls,
      active: activeFilter === 'successfulCalls'
    },
  ];

  // Solo mostrar filtros con count > 0
  const visibleFilters = priorityFilters.filter(f => f.count > 0);
  const displayFilters = showAll ? visibleFilters : visibleFilters.slice(0, 4);
  const hasMoreFilters = visibleFilters.length > 4;

  // Si no hay filtros relevantes, no mostrar nada
  if (visibleFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayFilters.map((filter) => (
        <Button
          key={filter.id}
          variant={filter.active ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange(filter.active ? null : filter.id)}
          className={cn(
            "h-8 text-xs gap-1.5 rounded-full px-3",
            filter.active 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <filter.icon className="h-3 w-3" />
          {filter.label}
          <span className={cn(
            "ml-1 text-xs tabular-nums",
            filter.active ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {filter.count}
          </span>
        </Button>
      ))}
      
      {hasMoreFilters && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-full px-3"
        >
          +{visibleFilters.length - 4} más
        </Button>
      )}
      
      {activeFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(null)}
          className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};
