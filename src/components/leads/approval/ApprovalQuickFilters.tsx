import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignedLead } from "@/types/leadTypes";
import { 
  Clock, 
  Phone, 
  PhoneOff, 
  AlertTriangle, 
  UserPlus, 
  Calendar,
  FileQuestion,
  PhoneCall,
  Target,
  CalendarDays,
  CalendarRange,
  CalendarClock
} from "lucide-react";

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
  
  const calculateFilterCounts = (leads: AssignedLead[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const fifteenDaysAgo = new Date(today.getTime() - (15 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
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
      
      successfulCalls: leads.filter(lead => 
        lead.has_successful_call && !lead.final_decision
      ).length,
      
      scheduledToday: leads.filter(lead => {
        if (!lead.scheduled_call_datetime) return false;
        const scheduledDate = new Date(lead.scheduled_call_datetime);
        const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
        return scheduledDateOnly.getTime() === today.getTime();
      }).length,
      
      interruptedInterviews: leads.filter(lead => 
        lead.interview_interrupted && lead.interview_session_id
      ).length,
      
      missingInfo: leads.filter(lead => 
        !lead.lead_telefono || !lead.lead_email
      ).length,
      
      multipleFailedAttempts: leads.filter(lead => 
        (lead.contact_attempts_count || 0) >= 3
      ).length,
      
      last3Days: leads.filter(lead => {
        const creationDate = new Date(lead.lead_fecha_creacion);
        return creationDate >= threeDaysAgo;
      }).length,
      
      last7Days: leads.filter(lead => {
        const creationDate = new Date(lead.lead_fecha_creacion);
        return creationDate >= sevenDaysAgo;
      }).length,
      
      last15Days: leads.filter(lead => {
        const creationDate = new Date(lead.lead_fecha_creacion);
        return creationDate >= fifteenDaysAgo;
      }).length,
      
      last30Days: leads.filter(lead => {
        const creationDate = new Date(lead.lead_fecha_creacion);
        return creationDate >= thirtyDaysAgo;
      }).length
    };
  };

  const counts = calculateFilterCounts(leads);

  const quickFilters: QuickFilter[] = [
    {
      id: 'newToday',
      label: 'Nuevos hoy',
      icon: UserPlus,
      count: counts.newToday,
      active: activeFilter === 'newToday'
    },
    {
      id: 'urgentPending',
      label: 'Urgentes',
      icon: AlertTriangle,
      count: counts.urgentPending,
      active: activeFilter === 'urgentPending'
    },
    {
      id: 'failedAttempts',
      label: 'Intentos fallidos',
      icon: PhoneOff,
      count: counts.failedAttempts,
      active: activeFilter === 'failedAttempts'
    },
    {
      id: 'successfulCalls',
      label: 'Llamadas exitosas',
      icon: Phone,
      count: counts.successfulCalls,
      active: activeFilter === 'successfulCalls'
    },
    {
      id: 'scheduledToday',
      label: 'Citas hoy',
      icon: Calendar,
      count: counts.scheduledToday,
      active: activeFilter === 'scheduledToday'
    },
    {
      id: 'interruptedInterviews',
      label: 'Entrevistas interrumpidas',
      icon: Target,
      count: counts.interruptedInterviews,
      active: activeFilter === 'interruptedInterviews'
    },
    {
      id: 'missingInfo',
      label: 'Info incompleta',
      icon: FileQuestion,
      count: counts.missingInfo,
      active: activeFilter === 'missingInfo'
    },
    {
      id: 'multipleFailedAttempts',
      label: 'Múltiples intentos',
      icon: PhoneCall,
      count: counts.multipleFailedAttempts,
      active: activeFilter === 'multipleFailedAttempts'
    },
    {
      id: 'last3Days',
      label: 'Últimos 3 días',
      icon: Calendar,
      count: counts.last3Days,
      active: activeFilter === 'last3Days'
    },
    {
      id: 'last7Days',
      label: 'Últimos 7 días',
      icon: CalendarDays,
      count: counts.last7Days,
      active: activeFilter === 'last7Days'
    },
    {
      id: 'last15Days',
      label: 'Últimos 15 días',
      icon: CalendarRange,
      count: counts.last15Days,
      active: activeFilter === 'last15Days'
    },
    {
      id: 'last30Days',
      label: 'Últimos 30 días',
      icon: CalendarClock,
      count: counts.last30Days,
      active: activeFilter === 'last30Days'
    }
  ];

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Filtros Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.active ? null : filter.id)}
              className="h-8 text-xs gap-1.5"
            >
              <filter.icon className="h-3 w-3" />
              {filter.label}
              <Badge 
                variant={filter.active ? "secondary" : "outline"} 
                className="ml-1 text-xs px-1 py-0"
              >
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
        
        {activeFilter && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange(null)}
              className="h-6 text-xs"
            >
              Limpiar filtro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};