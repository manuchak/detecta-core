import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrmDeals } from '@/hooks/useCrmDeals';
import { CRMHeroCard, type HealthStatus } from './CRMHeroCard';
import { CRMWeeklySummary } from './CRMWeeklySummary';
import { formatDistanceToNow, format, startOfWeek, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trophy, XCircle, Plus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityEvent {
  id: string;
  type: 'won' | 'lost' | 'new';
  title: string;
  subtitle: string;
  value?: number;
  timestamp: Date;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

function useActivityEvents() {
  const { data: deals, isLoading } = useCrmDeals();

  const { events, weeklySummary } = useMemo(() => {
    const allEvents: ActivityEvent[] = [];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    let wonDeals = 0, wonValue = 0;
    let lostDeals = 0, lostValue = 0;
    let newDeals = 0, newValue = 0;

    // Won deals
    (deals || [])
      .filter(d => d.status === 'won' && d.won_time)
      .forEach(deal => {
        const timestamp = new Date(deal.won_time!);
        allEvents.push({
          id: `won-${deal.id}`,
          type: 'won',
          title: deal.title,
          subtitle: deal.owner_name || 'Sin asignar',
          value: deal.value,
          timestamp,
        });
        if (isAfter(timestamp, weekStart)) {
          wonDeals++;
          wonValue += deal.value;
        }
      });

    // Lost deals
    (deals || [])
      .filter(d => d.status === 'lost' && d.lost_time)
      .forEach(deal => {
        const timestamp = new Date(deal.lost_time!);
        allEvents.push({
          id: `lost-${deal.id}`,
          type: 'lost',
          title: deal.title,
          subtitle: deal.lost_reason || 'Sin razón especificada',
          value: deal.value,
          timestamp,
        });
        if (isAfter(timestamp, weekStart)) {
          lostDeals++;
          lostValue += deal.value;
        }
      });

    // New deals (created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    (deals || [])
      .filter(d => new Date(d.created_at) > sevenDaysAgo && d.status === 'open')
      .forEach(deal => {
        const timestamp = new Date(deal.created_at);
        allEvents.push({
          id: `new-${deal.id}`,
          type: 'new',
          title: deal.title,
          subtitle: deal.organization_name || deal.owner_name || 'Sin asignar',
          value: deal.value,
          timestamp,
        });
        if (isAfter(timestamp, weekStart)) {
          newDeals++;
          newValue += deal.value;
        }
      });

    // Sort by timestamp descending
    const sortedEvents = allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      events: sortedEvents,
      weeklySummary: {
        wonDeals,
        wonValue,
        lostDeals,
        lostValue,
        newDeals,
        newValue,
        stalledDeals: 0,
        stalledValue: 0,
      },
    };
  }, [deals]);

  return { events, weeklySummary, isLoading };
}

function ActivityEventCard({ event }: { event: ActivityEvent }) {
  const config = {
    won: {
      icon: Trophy,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600',
      borderColor: 'border-l-green-500',
    },
    lost: {
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600',
      borderColor: 'border-l-red-500',
    },
    new: {
      icon: Plus,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
      borderColor: 'border-l-blue-500',
    },
  };

  const { icon: Icon, bgColor, textColor, borderColor } = config[event.type];

  const timeAgo = formatDistanceToNow(event.timestamp, {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border-l-4 bg-card', borderColor)}>
      <div className={cn('p-2 rounded-lg shrink-0', bgColor)}>
        <Icon className={cn('h-4 w-4', textColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{event.title}</div>
        <div className="text-xs text-muted-foreground truncate">{event.subtitle}</div>
        <div className="flex items-center justify-between mt-1">
          {event.value !== undefined && (
            <span className={cn('text-sm font-semibold', textColor)}>
              {formatCurrency(event.value)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const { events, weeklySummary, isLoading } = useActivityEvents();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  // Calculate health based on weekly performance
  const netValue = weeklySummary.wonValue - weeklySummary.lostValue + weeklySummary.newValue;
  const health: HealthStatus = netValue > 0 ? 'healthy' 
    : weeklySummary.lostValue > weeklySummary.wonValue ? 'warning' 
    : 'neutral';

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
    <div className="space-y-4">
      {/* Hero Card */}
      <CRMHeroCard
        title="¿Cómo fue esta semana?"
        value={`${weeklySummary.wonDeals + weeklySummary.newDeals} movimientos positivos`}
        subtitle={`${weeklySummary.wonDeals} deals ganados + ${weeklySummary.newDeals} nuevos deals`}
        health={health}
        secondaryMetrics={[
          { label: 'Ganado', value: formatCurrency(weeklySummary.wonValue) },
          { label: 'Nuevo pipeline', value: formatCurrency(weeklySummary.newValue) },
          { label: 'Perdido', value: formatCurrency(weeklySummary.lostValue), highlight: weeklySummary.lostValue > 0 },
        ]}
        icon={<Activity className="h-8 w-8 text-muted-foreground/20" />}
      />

      {/* Weekly Summary */}
      <CRMWeeklySummary data={weeklySummary} />

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
        <ScrollArea className="h-[calc(100vh-550px)]">
          <div className="space-y-4 pr-4">
            {dateKeys.map(dateKey => (
              <div key={dateKey} className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-2">
                  {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
                </div>
                <div className="space-y-2">
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
