import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  XCircle, 
  Ban, 
  Ticket, 
  CheckCircle2,
  Star,
  AlertCircle
} from 'lucide-react';
import { TimelineStats } from '../../../hooks/useProfileTimeline';

interface TimelineStatsCardProps {
  stats: TimelineStats;
  isLoading?: boolean;
}

export function TimelineStatsCard({ stats, isLoading }: TimelineStatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="animate-pulse flex gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 w-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: Truck,
      label: 'Completados',
      value: stats.serviciosCompletados,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: XCircle,
      label: 'Rechazados',
      value: stats.serviciosRechazados,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Ban,
      label: 'Cancelados',
      value: stats.serviciosCancelados,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Ticket,
      label: 'Tickets',
      value: `${stats.ticketsResueltos}/${stats.ticketsCreados}`,
      sublabel: 'resueltos',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
  ];

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-6">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.label}
                    {item.sublabel && <span className="ml-1">({item.sublabel})</span>}
                  </p>
                </div>
              </div>
            );
          })}

          {/* CSAT if available */}
          {stats.csatPromedio !== null && (
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{stats.csatPromedio.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">CSAT promedio</p>
              </div>
            </div>
          )}

          {/* Pending systems badge */}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <AlertCircle className="h-3 w-3" />
              3 subsistemas pendientes
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
