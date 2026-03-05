import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type TicketEnhanced } from "@/hooks/useTicketsEnhanced";
import { TicketKanbanCard } from "./TicketKanbanCard";
import { cn } from "@/lib/utils";
import { CheckCircle, Inbox, Loader2, Lock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketKanbanBoardProps {
  tickets: TicketEnhanced[];
  loading: boolean;
  onStatusChange: (ticketId: string, newStatus: TicketEnhanced["status"]) => Promise<void>;
  onTicketClick: (ticketId: string) => void;
}

type ColumnId = "abierto" | "en_progreso" | "resuelto" | "cerrado";

interface ColumnConfig {
  id: ColumnId;
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "abierto",
    label: "Nuevos",
    icon: <Inbox className="h-4 w-4" />,
    borderColor: "border-t-red-500",
    emptyMessage: "Sin tickets nuevos",
    emptyIcon: <CheckCircle className="h-8 w-8 text-muted-foreground/30" />,
  },
  {
    id: "en_progreso",
    label: "En curso",
    icon: <Loader2 className="h-4 w-4" />,
    borderColor: "border-t-yellow-500",
    emptyMessage: "Sin tickets en proceso",
    emptyIcon: <CheckCircle className="h-8 w-8 text-muted-foreground/30" />,
  },
  {
    id: "resuelto",
    label: "Resueltos",
    icon: <CheckCircle className="h-4 w-4" />,
    borderColor: "border-t-emerald-500",
    emptyMessage: "Sin tickets resueltos",
    emptyIcon: <CheckCircle className="h-8 w-8 text-muted-foreground/30" />,
  },
  {
    id: "cerrado",
    label: "Cerrados",
    icon: <Lock className="h-4 w-4" />,
    borderColor: "border-t-muted-foreground",
    emptyMessage: "Sin tickets cerrados",
    emptyIcon: <Lock className="h-8 w-8 text-muted-foreground/30" />,
  },
];

const KanbanColumn = ({
  column,
  tickets,
  onTicketClick,
}: {
  column: ColumnConfig;
  tickets: TicketEnhanced[];
  onTicketClick: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const slaBreached = tickets.filter(
    (t) => t.sla.estadoGeneral === "vencido"
  ).length;
  const needsReply = tickets.filter(
    (t) => t.needsReply === "needs_agent_reply"
  ).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-t-[3px] bg-muted/30 dark:bg-muted/10 min-w-[280px] flex-1",
        column.borderColor,
        isOver && "ring-2 ring-primary/30 bg-primary/5"
      )}
    >
      {/* Column Header */}
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {column.icon}
          <span className="text-sm font-semibold">{column.label}</span>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
            {tickets.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {slaBreached > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 rounded-full px-1.5 py-0.5">
              <AlertTriangle className="h-3 w-3" />
              {slaBreached}
            </span>
          )}
          {needsReply > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 rounded-full px-1.5 py-0.5">
              {needsReply} pendiente{needsReply > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="px-2 pb-2 space-y-2">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                {column.emptyIcon}
                <span className="text-xs mt-2">{column.emptyMessage}</span>
              </div>
            ) : (
              tickets.map((ticket) => (
                <TicketKanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onTicketClick(ticket.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

export const TicketKanbanBoard = ({
  tickets,
  loading,
  onStatusChange,
  onTicketClick,
}: TicketKanbanBoardProps) => {
  const [activeTicket, setActiveTicket] = useState<TicketEnhanced | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Group and sort tickets by column
  const columnTickets = useMemo(() => {
    const groups: Record<ColumnId, TicketEnhanced[]> = {
      abierto: [],
      en_progreso: [],
      resuelto: [],
      cerrado: [],
    };

    tickets.forEach((t) => {
      const col = groups[t.status as ColumnId];
      if (col) col.push(t);
    });

    // Sort each column: needs_agent_reply first, then by SLA urgency
    Object.values(groups).forEach((arr) => {
      arr.sort((a, b) => {
        // Needs reply first
        const aReply = a.needsReply === "needs_agent_reply" ? 1 : 0;
        const bReply = b.needsReply === "needs_agent_reply" ? 1 : 0;
        if (aReply !== bReply) return bReply - aReply;
        // Then by SLA urgency
        return b.sla.urgencyScore - a.sla.urgencyScore;
      });
    });

    return groups;
  }, [tickets]);

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as ColumnId;
    const ticket = tickets.find((t) => t.id === ticketId);

    if (ticket && ticket.status !== newStatus) {
      onStatusChange(ticketId, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className={cn("rounded-xl border border-t-[3px] p-3 space-y-2", col.borderColor)}>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tickets={columnTickets[column.id]}
            onTicketClick={onTicketClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <div className="opacity-90 rotate-2 w-[280px]">
            <TicketKanbanCard
              ticket={activeTicket}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
