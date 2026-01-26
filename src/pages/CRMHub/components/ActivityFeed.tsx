import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrmDeals } from '@/hooks/useCrmDeals';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trophy, ArrowRight, Plus, XCircle, Activity } from 'lucide-react';
import type { CrmDealStageHistory, CrmDealWithStage } from '@/types/crm';

interface ActivityEvent {
  id: string;
  type: 'won' | 'lost' | 'new' | 'stage_change';
  title: string;
  subtitle: string;
  value?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

function useStageHistory() {
  return useQuery({
    queryKey: ['crm-stage-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_deal_stage_history')
        .select(`
          id,
          deal_id,
          from_stage_id,
          to_stage_id,
          changed_at,
          time_in_previous_stage
        `)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching stage history:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

function useActivityEvents() {
  const { data: deals, isLoading: dealsLoading } = useCrmDeals();
  const { data: stageHistory, isLoading: historyLoading } = useStageHistory();

  const events = useMemo(() => {
    const allEvents: ActivityEvent[] = [];

    // Won deals
    (deals || [])
      .filter(d => d.status === 'won' && d.won_time)
      .forEach(deal => {
        allEvents.push({
          id: `won-${deal.id}`,
          type: 'won',
          title: deal.title,
          subtitle: deal.owner_name || 'Sin asignar',
          value: deal.value,
          timestamp: new Date(deal.won_time!),
        });
      });

    // Lost deals
    (deals || [])
      .filter(d => d.status === 'lost' && d.lost_time)
      .forEach(deal => {
        allEvents.push({
          id: `lost-${deal.id}`,
          type: 'lost',
          title: deal.title,
          subtitle: deal.lost_reason || 'Sin razón especificada',
          value: deal.value,
          timestamp: new Date(deal.lost_time!),
        });
      });

    // New deals (created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    (deals || [])
      .filter(d => new Date(d.created_at) > sevenDaysAgo && d.status === 'open')
      .forEach(deal => {
        allEvents.push({
          id: `new-${deal.id}`,
          type: 'new',
          title: deal.title,
          subtitle: deal.organization_name || deal.owner_name || 'Sin asignar',
          value: deal.value,
          timestamp: new Date(deal.created_at),
        });
      });

    // Stage changes (we'd need to join with deals to get titles, simplify for now)
    // This would require additional data fetching

    // Sort by timestamp descending
    return allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [deals, stageHistory]);

  return {
    events,
    isLoading: dealsLoading || historyLoading,
  };
}

function ActivityEventCard({ event }: { event: ActivityEvent }) {
  const config = {
    won: {
      icon: Trophy,
      label: 'Deal Ganado',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600',
      borderColor: 'border-l-green-500',
    },
    lost: {
      icon: XCircle,
      label: 'Deal Perdido',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600',
      borderColor: 'border-l-red-500',
    },
    new: {
      icon: Plus,
      label: 'Nuevo Deal',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-600',
      borderColor: 'border-l-yellow-500',
    },
    stage_change: {
      icon: ArrowRight,
      label: 'Cambio de Etapa',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
      borderColor: 'border-l-blue-500',
    },
  };

  const { icon: Icon, label, bgColor, textColor, borderColor } = config[event.type];

  const timeAgo = formatDistanceToNow(event.timestamp, {
    addSuffix: true,
    locale: es,
  });

  const formattedDate = format(event.timestamp, "d MMM yyyy, HH:mm", { locale: es });

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-4 w-4 ${textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-xs ${textColor}`}>
                {label}
              </Badge>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <div className="font-medium truncate">{event.title}</div>
            <div className="text-sm text-muted-foreground truncate">
              {event.subtitle}
            </div>
            {event.value !== undefined && (
              <div className={`text-sm font-semibold mt-1 ${textColor}`}>
                {formatCurrency(event.value)}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            {formattedDate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ActivityFeed() {
  const { events, isLoading } = useActivityEvents();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const dateKey = format(event.timestamp, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, ActivityEvent[]>);

  const dateKeys = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Eventos recientes</div>
              <div className="text-2xl font-bold">{events.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Timeline */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay actividad reciente en el CRM
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-6 pr-4">
            {dateKeys.map(dateKey => (
              <div key={dateKey} className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
                  {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
                </div>
                <div className="space-y-3">
                  {groupedEvents[dateKey].map(event => (
                    <ActivityEventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
