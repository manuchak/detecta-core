import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ticket, Clock, CheckCircle, AlertTriangle, X, 
  ChevronRight, Calendar, MessageSquare, Loader2
} from 'lucide-react';
import { CustodianTicket } from '@/hooks/useCustodianTicketsEnhanced';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CustodianTicketsListProps {
  tickets: CustodianTicket[];
  loading: boolean;
  onSelectTicket: (ticket: CustodianTicket) => void;
}

const statusConfig = {
  abierto: { label: 'Abierto', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  en_progreso: { label: 'En Progreso', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  resuelto: { label: 'Resuelto', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  cerrado: { label: 'Cerrado', icon: X, color: 'bg-gray-100 text-gray-700' }
};

const priorityConfig = {
  baja: { label: 'Baja', color: 'bg-slate-100 text-slate-600' },
  media: { label: 'Media', color: 'bg-blue-100 text-blue-600' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-600' }
};

const TicketCard = ({ ticket, onClick }: { ticket: CustodianTicket; onClick: () => void }) => {
  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];
  const StatusIcon = status.icon;
  
  const isSlaExpired = ticket.fecha_sla_resolucion && 
    isPast(new Date(ticket.fecha_sla_resolucion)) &&
    !['resuelto', 'cerrado'].includes(ticket.status);

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isSlaExpired && "border-red-300 bg-red-50/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                {ticket.ticket_number}
              </Badge>
              {ticket.categoria && (
                <Badge variant="secondary" className="text-xs">
                  {ticket.categoria.nombre}
                </Badge>
              )}
              <Badge className={cn("text-xs", priority.color)}>
                {priority.label}
              </Badge>
            </div>

            {/* Subject */}
            <h4 className="font-medium text-foreground truncate">
              {ticket.subject}
            </h4>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(ticket.created_at), 'dd MMM yyyy', { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
              </span>
              {ticket.monto_reclamado && (
                <span className="font-medium text-foreground">
                  ${ticket.monto_reclamado.toLocaleString()} MXN
                </span>
              )}
            </div>

            {/* SLA Warning */}
            {isSlaExpired && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                SLA vencido
              </div>
            )}
          </div>

          {/* Status & Action */}
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("flex items-center gap-1", status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CustodianTicketsList = ({ tickets, loading, onSelectTicket }: CustodianTicketsListProps) => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTickets = tickets.filter(ticket => {
    switch (activeTab) {
      case 'open':
        return ['abierto', 'en_progreso'].includes(ticket.status);
      case 'resolved':
        return ticket.status === 'resuelto';
      case 'closed':
        return ticket.status === 'cerrado';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Mis Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              Todos ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="text-xs">
              Abiertos ({tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status)).length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">
              Resueltos ({tickets.filter(t => t.status === 'resuelto').length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs">
              Cerrados ({tickets.filter(t => t.status === 'cerrado').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay tickets en esta categoría</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onSelectTicket(ticket)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
