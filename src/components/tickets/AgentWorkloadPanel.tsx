import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Users, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useAgentWorkload, AgentWorkload } from "@/hooks/useAgentWorkload";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AgentWorkloadPanelProps {
  department?: string;
  compact?: boolean;
  defaultCollapsed?: boolean;
}

const getLoadLevel = (tickets: number, avg: number): { level: 'low' | 'medium' | 'high'; color: string; bgColor: string } => {
  if (tickets === 0) return { level: 'low', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
  if (tickets <= avg) return { level: 'low', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
  if (tickets <= avg * 1.5) return { level: 'medium', color: 'text-amber-600', bgColor: 'bg-amber-500' };
  return { level: 'high', color: 'text-red-600', bgColor: 'bg-red-500' };
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const AgentCard = ({ agent, avgTickets, maxTickets }: { agent: AgentWorkload; avgTickets: number; maxTickets: number }) => {
  const load = getLoadLevel(agent.tickets_activos, avgTickets);
  const percentage = maxTickets > 0 ? (agent.tickets_activos / maxTickets) * 100 : 0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-default group">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                  {getInitials(agent.display_name)}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {agent.display_name}
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    load.level === 'high' && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                    load.level === 'medium' && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                    load.level === 'low' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  )}
                >
                  {agent.tickets_activos}
                </Badge>
              </div>
              
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    load.bgColor
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
            
            {agent.avg_age_hours > 24 && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 shrink-0">
                {Math.round(agent.avg_age_hours)}h
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-medium">{agent.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {agent.tickets_activos} tickets activos
            {load.level === 'high' && ' • Carga alta'}
            {load.level === 'medium' && ' • Carga moderada'}
            {load.level === 'low' && ' • Carga baja'}
          </p>
          {agent.avg_age_hours > 0 && (
            <p className="text-xs text-muted-foreground">
              Edad promedio: {Math.round(agent.avg_age_hours)}h
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface AgentWorkloadPanelProps {
  department?: string;
  compact?: boolean;
  defaultCollapsed?: boolean;
}

export const AgentWorkloadPanel = ({ department, compact = false, defaultCollapsed = false }: AgentWorkloadPanelProps) => {
  const { agents, stats, loading, getAgentsByDepartment } = useAgentWorkload();
  const [expanded, setExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  const displayAgents = department && department !== 'todos'
    ? getAgentsByDepartment(department)
    : agents;
    
  const maxTickets = Math.max(...displayAgents.map(a => a.tickets_activos), 1);
  const highLoadAgents = displayAgents.filter(a => a.tickets_activos > stats.avgTicketsPerAgent * 1.5).length;

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold">{stats.totalAgents}</span>
                <span className="text-muted-foreground ml-1">agentes</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span>{stats.totalActiveTickets} activos</span>
            </div>
            {highLoadAgents > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {highLoadAgents}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleAgents = expanded ? displayAgents : displayAgents.slice(0, 4);

  // Collapsed state - shows summary only
  if (isCollapsed) {
    return (
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Carga de Trabajo
            </CardTitle>
            <div className="flex items-center gap-2">
              {highLoadAgents > 0 && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {highLoadAgents}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsCollapsed(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Compact Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-foreground">{stats.totalAgents}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Agentes</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-foreground">{stats.totalActiveTickets}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Activos</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-foreground">{stats.avgTicketsPerAgent.toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Promedio</p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            Carga de Trabajo
          </CardTitle>
          <div className="flex items-center gap-2">
            {highLoadAgents > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
                <AlertCircle className="h-3 w-3" />
                {highLoadAgents} alto
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Summary Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2.5 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">{stats.totalAgents}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Agentes</p>
          </div>
          <div className="text-center p-2.5 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">{stats.totalActiveTickets}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Activos</p>
          </div>
          <div className="text-center p-2.5 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">{stats.avgTicketsPerAgent.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Promedio</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pt-0">
        {displayAgents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay agentes disponibles
            </p>
          </div>
        ) : (
          <>
            {visibleAgents.map(agent => (
              <AgentCard 
                key={agent.agent_id} 
                agent={agent} 
                avgTickets={stats.avgTicketsPerAgent}
                maxTickets={maxTickets}
              />
            ))}
            
            {displayAgents.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver {displayAgents.length - 4} más
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentWorkloadPanel;
