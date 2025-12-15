import { useState } from 'react';
import { CustodianTicket } from '@/hooks/useCustodianTicketsEnhanced';
import { SimpleTicketCard } from './SimpleTicketCard';
import { CustodianTicketDetail } from './CustodianTicketDetail';
import { Loader2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTicketsListProps {
  tickets: CustodianTicket[];
  loading: boolean;
  custodianPhone: string;
  onRefresh: () => void;
}

type Filter = 'todos' | 'pendientes' | 'resueltos';

export const MobileTicketsList = ({
  tickets,
  loading,
  custodianPhone,
  onRefresh
}: MobileTicketsListProps) => {
  const [filter, setFilter] = useState<Filter>('todos');
  const [selectedTicket, setSelectedTicket] = useState<CustodianTicket | null>(null);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'todos') return true;
    if (filter === 'pendientes') return ['abierto', 'en_progreso'].includes(ticket.status);
    if (filter === 'resueltos') return ['resuelto', 'cerrado'].includes(ticket.status);
    return true;
  });

  const pendingCount = tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => ['resuelto', 'cerrado'].includes(t.status)).length;

  if (selectedTicket) {
    return (
      <CustodianTicketDetail
        ticket={selectedTicket}
        custodianPhone={custodianPhone}
        onBack={() => {
          setSelectedTicket(null);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Mis Quejas</h1>
        
        {/* Simple filter tabs */}
        <div className="flex gap-2">
          <FilterButton
            active={filter === 'todos'}
            onClick={() => setFilter('todos')}
            label="Todos"
            count={tickets.length}
          />
          <FilterButton
            active={filter === 'pendientes'}
            onClick={() => setFilter('pendientes')}
            label="Pendientes"
            count={pendingCount}
          />
          <FilterButton
            active={filter === 'resueltos'}
            onClick={() => setFilter('resueltos')}
            label="Resueltos"
            count={resolvedCount}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Cargando quejas...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {filter === 'todos' ? 'Sin quejas' : `Sin quejas ${filter}`}
            </h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'todos' 
                ? 'Cuando reportes un problema, aparecerá aquí'
                : 'No hay quejas en esta categoría'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map(ticket => (
              <SimpleTicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

const FilterButton = ({ active, onClick, label, count }: FilterButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    )}
  >
    {label} ({count})
  </button>
);
