import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, AlertCircle } from "lucide-react";
import { useAgentWorkload, AgentWorkload } from "@/hooks/useAgentWorkload";
import { cn } from "@/lib/utils";

interface AgentWorkloadPanelProps {
  department?: string;
  compact?: boolean;
}

const getLoadLevel = (tickets: number, avg: number): 'low' | 'medium' | 'high' => {
  if (tickets === 0) return 'low';
  if (tickets <= avg) return 'low';
  if (tickets <= avg * 1.5) return 'medium';
  return 'high';
};

const loadColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
};

const AgentCard = ({ agent, avgTickets }: { agent: AgentWorkload; avgTickets: number }) => {
  const loadLevel = getLoadLevel(agent.tickets_activos, avgTickets);
  const loadPercentage = avgTickets > 0 
    ? Math.min(100, (agent.tickets_activos / (avgTickets * 2)) * 100)
    : 0;
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="text-xs font-medium bg-primary/10">
          {agent.display_name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{agent.display_name}</span>
          <div className={cn("w-2 h-2 rounded-full", loadColors[loadLevel])} />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={loadPercentage} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {agent.tickets_activos} tickets
          </span>
        </div>
      </div>
      
      {agent.avg_age_hours > 24 && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
          {Math.round(agent.avg_age_hours)}h avg
        </Badge>
      )}
    </div>
  );
};

export const AgentWorkloadPanel = ({ department, compact = false }: AgentWorkloadPanelProps) => {
  const { agents, stats, loading, getAgentsByDepartment } = useAgentWorkload();
  
  const displayAgents = department && department !== 'todos'
    ? getAgentsByDepartment(department)
    : agents;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{stats.totalAgents} agentes</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {stats.avgTicketsPerAgent} tickets/agente promedio
          </span>
        </div>
        {stats.mostLoadedAgent && stats.mostLoadedAgent.tickets_activos > stats.avgTicketsPerAgent * 1.5 && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {stats.mostLoadedAgent.display_name} sobrecargado
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Carga de Agentes
            {department && department !== 'todos' && (
              <Badge variant="outline" className="ml-2 capitalize">
                {department}
              </Badge>
            )}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {stats.totalActiveTickets} tickets activos
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayAgents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay agentes disponibles para este departamento
          </p>
        ) : (
          displayAgents.slice(0, 5).map(agent => (
            <AgentCard 
              key={agent.agent_id} 
              agent={agent} 
              avgTickets={stats.avgTicketsPerAgent}
            />
          ))
        )}
        
        {displayAgents.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{displayAgents.length - 5} agentes más
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentWorkloadPanel;
