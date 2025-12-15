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
import { ChevronRight, ChevronLeft, Plus, Search, RefreshCw, Eye, Sparkles } from "lucide-react";
import { useTicketsEnhanced, type TicketEnhanced } from "@/hooks/useTicketsEnhanced";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { SLABadgeCompact } from "@/components/tickets/SLABadge";
import { SLAProgressBar } from "@/components/tickets/SLAProgressBar";
import { TicketSLAKPIs } from "@/components/tickets/TicketSLAKPIs";
import { TicketQuickActions } from "@/components/tickets/TicketQuickActions";
import { DepartmentPills, DEPARTMENTS } from "@/components/tickets/DepartmentPills";
import { AgentWorkloadPanel } from "@/components/tickets/AgentWorkloadPanel";
import { TicketCardMobile } from "@/components/tickets/TicketCardMobile";
import { TicketFiltersSheet } from "@/components/tickets/TicketFiltersSheet";
import { useAgentWorkload } from "@/hooks/useAgentWorkload";
import { cn } from "@/lib/utils";

const priorityBadgeStyles = {
  baja: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
  media: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400",
  alta: "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-400",
  urgente: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
};

const statusBadgeStyles = {
  abierto: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-400",
  en_progreso: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
  resuelto: "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400",
  cerrado: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
};

const statusLabels = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
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
  
  const { agents: workloadAgents } = useAgentWorkload();
  
  // Filter only planners for assignment
  const planificadores = useMemo(() => {
    return workloadAgents
      .filter(a => ['planificador', 'admin', 'owner'].includes(a.role))
      .map(a => ({ id: a.agent_id, display_name: a.display_name }));
  }, [workloadAgents]);
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [slaFilter, setSlaFilter] = useState("todos");
  const [departmentFilter, setDepartmentFilter] = useState("todos");

  // Calculate ticket counts per department
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: tickets.length };
    
    tickets.forEach(ticket => {
      const dept = ticket.categoria_custodio?.departamento_responsable || 'soporte';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "todas" || ticket.priority === priorityFilter;
      
      // Department filter
      const ticketDept = ticket.categoria_custodio?.departamento_responsable || 'soporte';
      const matchesDepartment = departmentFilter === "todos" || ticketDept === departmentFilter;
      
      // SLA filter
      let matchesSLA = true;
      if (slaFilter === "vencidos") {
        matchesSLA = ticket.sla.estadoGeneral === 'vencido';
      } else if (slaFilter === "proximos") {
        matchesSLA = ticket.sla.estadoGeneral === 'proximo_vencer';
      } else if (slaFilter === "en_tiempo") {
        matchesSLA = ticket.sla.estadoGeneral === 'en_tiempo';
      }
      
      return matchesSearch && matchesStatus && matchesPriority && matchesSLA && matchesDepartment;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, slaFilter, departmentFilter]);

  // Prepare tickets with SLA for KPIs component
  const ticketsWithSLA = tickets.map(t => ({ sla: t.sla, status: t.status }));
  
  // Calculate active filters count
  const activeFiltersCount = [
    searchTerm !== '',
    statusFilter !== 'todos',
    priorityFilter !== 'todas',
    slaFilter !== 'todos'
  ].filter(Boolean).length;

  const handleMobileFiltersChange = (filters: { search: string; status: string; priority: string; sla: string }) => {
    setSearchTerm(filters.search);
    setStatusFilter(filters.status);
    setPriorityFilter(filters.priority);
    setSlaFilter(filters.sla);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-[1600px] mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-red-600 mb-4">
                Error al cargar los tickets: {error}
              </div>
              <div className="flex justify-center">
                <Button onClick={loadTickets} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centro de Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona solicitudes de soporte de custodios y clientes
            </p>
          </div>
          <Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="h-4 w-4" /> 
            <span className="hidden sm:inline">Nuevo Ticket</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
        
        {/* Department Pills */}
        <section>
          <DepartmentPills
            selectedDepartment={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            ticketCounts={departmentCounts}
          />
        </section>
        
        {/* KPIs Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Estado del Soporte
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TicketSLAKPIs tickets={ticketsWithSLA} loading={loading} />
            </div>
            <AgentWorkloadPanel department={departmentFilter} compact={false} />
          </div>
        </section>
        
        {/* Tickets Table Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Gestión de Tickets</h2>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Lista de Tickets</CardTitle>
                  <CardDescription>
                    Ordenados por urgencia SLA. Los vencidos aparecen primero.
                    {departmentFilter !== 'todos' && (
                      <Badge variant="secondary" className="ml-2 capitalize">
                        {DEPARTMENTS.find(d => d.id === departmentFilter)?.label}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Button onClick={loadTickets} variant="ghost" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters - Desktop */}
              <div className="mb-6 hidden md:flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por #ticket, asunto, cliente..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={slaFilter} onValueChange={setSlaFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="SLA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos SLA</SelectItem>
                      <SelectItem value="vencidos">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Vencidos
                        </span>
                      </SelectItem>
                      <SelectItem value="proximos">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />
                          Próximos
                        </span>
                      </SelectItem>
                      <SelectItem value="en_tiempo">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          En tiempo
                        </span>
                      </SelectItem>
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
                </div>
              </div>
              
              {/* Filters - Mobile */}
              <div className="mb-4 flex md:hidden gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <TicketFiltersSheet
                  filters={{ search: searchTerm, status: statusFilter, priority: priorityFilter, sla: slaFilter }}
                  onFiltersChange={handleMobileFiltersChange}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
              
              {/* Active Filters Chips */}
              {activeFiltersCount > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      Búsqueda: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-muted rounded-full p-0.5">×</button>
                    </Badge>
                  )}
                  {statusFilter !== 'todos' && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      Estado: {statusLabels[statusFilter as keyof typeof statusLabels]}
                      <button onClick={() => setStatusFilter('todos')} className="ml-1 hover:bg-muted rounded-full p-0.5">×</button>
                    </Badge>
                  )}
                  {priorityFilter !== 'todas' && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      Prioridad: {priorityFilter}
                      <button onClick={() => setPriorityFilter('todas')} className="ml-1 hover:bg-muted rounded-full p-0.5">×</button>
                    </Badge>
                  )}
                  {slaFilter !== 'todos' && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      SLA: {slaFilter}
                      <button onClick={() => setSlaFilter('todos')} className="ml-1 hover:bg-muted rounded-full p-0.5">×</button>
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Desktop Table */}
              <div className="rounded-xl border hidden md:block overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[140px]">SLA</TableHead>
                      <TableHead className="w-[100px]">Ticket</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead className="hidden lg:table-cell">Custodio</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden xl:table-cell">Categoría</TableHead>
                      <TableHead className="hidden xl:table-cell">Asignado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
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
                              "cursor-pointer transition-all duration-200 hover:bg-accent/50",
                              ticket.sla.estadoGeneral === 'vencido' && "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-l-red-500",
                              ticket.sla.estadoGeneral === 'proximo_vencer' && "bg-yellow-50/50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500"
                            )}
                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                          >
                            <TableCell onClick={e => e.stopPropagation()}>
                              <SLAProgressBar
                                status={ticket.sla.estadoGeneral}
                                percentage={ticket.sla.porcentajeConsumidoResolucion}
                                remainingMinutes={ticket.sla.tiempoRestanteResolucion}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell className="font-medium max-w-xs">
                              <div className="truncate">{ticket.subject}</div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {ticket.custodio?.nombre || ticket.customer_name || ticket.customer_phone || 'Sin nombre'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", priorityBadgeStyles[ticket.priority])}>
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", statusBadgeStyles[ticket.status])}>
                                {statusLabels[ticket.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                              {ticket.categoria_custodio?.nombre || ticket.category || '-'}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                              {ticket.assigned_user?.display_name || 'Sin asignar'}
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <TicketQuickActions
                                  ticket={ticket}
                                  agents={planificadores}
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
              
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                  ))
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No se encontraron tickets
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TicketCardMobile
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    />
                  ))
                )}
              </div>
              
              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Mostrando {filteredTickets.length} de {tickets.length} tickets
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled className="gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  <span className="px-2 text-xs">Página 1 de 1</span>
                  <Button variant="outline" size="sm" disabled className="gap-1">
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default TicketsList;
