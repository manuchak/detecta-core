import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Plus, Search, MessageSquare, RefreshCw, Eye } from "lucide-react";
import { useTicketsEnhanced, type TicketEnhanced } from "@/hooks/useTicketsEnhanced";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { SLABadge, SLABadgeCompact } from "@/components/tickets/SLABadge";
import { TicketSLAKPIs } from "@/components/tickets/TicketSLAKPIs";
import { TicketQuickActions } from "@/components/tickets/TicketQuickActions";
import { cn } from "@/lib/utils";

const priorityBadgeStyles = {
  baja: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  media: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  alta: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  urgente: "bg-red-100 text-red-800 hover:bg-red-100",
};

const statusBadgeStyles = {
  abierto: "bg-green-100 text-green-800 hover:bg-green-100",
  en_progreso: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  resuelto: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  cerrado: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const statusLabels = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const sourceIcons = {
  whatsapp: MessageSquare,
  web: Search,
  email: MessageSquare,
  telefono: MessageSquare,
};

export const TicketsList = () => {
  const { 
    tickets, 
    stats, 
    loading, 
    error, 
    updateTicketStatus, 
    assignTicket, 
    loadTickets 
  } = useTicketsEnhanced();
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [slaFilter, setSlaFilter] = useState("todos");

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticket.priority === priorityFilter;
    
    // SLA filter
    let matchesSLA = true;
    if (slaFilter === "vencidos") {
      matchesSLA = ticket.sla.estadoGeneral === 'vencido';
    } else if (slaFilter === "proximos") {
      matchesSLA = ticket.sla.estadoGeneral === 'proximo_vencer';
    } else if (slaFilter === "en_tiempo") {
      matchesSLA = ticket.sla.estadoGeneral === 'en_tiempo';
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSLA;
  });

  // Prepare tickets with SLA for KPIs component
  const ticketsWithSLA = tickets.map(t => ({ sla: t.sla, status: t.status }));

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error al cargar los tickets: {error}
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={loadTickets} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Centro de atención para custodios y clientes.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Ticket
        </Button>
      </div>
      
      {/* SLA KPIs */}
      <TicketSLAKPIs tickets={ticketsWithSLA} loading={loading} />
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tickets</CardTitle>
          <CardDescription>
            Tickets ordenados por urgencia de SLA. Los vencidos aparecen primero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por #ticket, asunto, cliente..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="SLA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos SLA</SelectItem>
                  <SelectItem value="vencidos">🔴 Vencidos</SelectItem>
                  <SelectItem value="proximos">🟡 Próximos</SelectItem>
                  <SelectItem value="en_tiempo">🟢 En tiempo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadTickets} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">SLA</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead className="hidden md:table-cell">Custodio/Cliente</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Categoría</TableHead>
                  <TableHead className="hidden lg:table-cell">Asignado</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron tickets
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isUrgent = ticket.sla.estadoGeneral === 'vencido' || ticket.sla.estadoGeneral === 'proximo_vencer';
                    
                    return (
                      <TableRow 
                        key={ticket.id}
                        className={cn(
                          "cursor-pointer hover:bg-accent/50 transition-colors",
                          ticket.sla.estadoGeneral === 'vencido' && "bg-red-50/50 dark:bg-red-950/20",
                          ticket.sla.estadoGeneral === 'proximo_vencer' && "bg-yellow-50/50 dark:bg-yellow-950/20"
                        )}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <TableCell onClick={e => e.stopPropagation()}>
                          <SLABadgeCompact
                            status={ticket.sla.estadoGeneral}
                            remainingMinutes={ticket.sla.tiempoRestanteResolucion}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate">{ticket.subject}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {ticket.custodio?.nombre || ticket.customer_name || ticket.customer_phone || 'Sin nombre'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityBadgeStyles[ticket.priority]}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeStyles[ticket.status]}>
                            {statusLabels[ticket.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {ticket.categoria_custodio?.nombre || ticket.category || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {ticket.assigned_user?.display_name || 'Sin asignar'}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/tickets/${ticket.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <TicketQuickActions
                              ticket={ticket}
                              onStatusChange={(status) => updateTicketStatus(ticket.id, status)}
                              onAssign={(userId) => assignTicket(ticket.id, userId)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {filteredTickets.length} de {tickets.length} tickets
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketsList;
