
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronRight, MoreHorizontal, Plus, Search, MessageSquare, RefreshCw } from "lucide-react";
import { useTickets, type Ticket } from "@/hooks/useTickets";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  email: MoreHorizontal,
  telefono: MoreHorizontal,
};

export const TicketsList = () => {
  const { tickets, stats, loading, error, updateTicketStatus, assignTicket, loadTickets } = useTickets();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "todas" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
            Sistema de tickets para gestión de reclamos e incidencias.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Ticket
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">Tickets abiertos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.abiertos}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">En progreso</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.en_proceso}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">Resueltos (este mes)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : stats.resueltos_mes}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tickets</CardTitle>
          <CardDescription>
            Gestiona los reclamos e incidencias reportados por clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por asunto, cliente o descripción..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[150px]">
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
              <Button onClick={loadTickets} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Fuente</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="hidden md:table-cell">Asignado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
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
                    const SourceIcon = sourceIcons[ticket.source] || MoreHorizontal;
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {ticket.customer_name || ticket.customer_phone || 'Sin nombre'}
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
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <SourceIcon className="w-4 h-4" />
                            <span className="text-xs">{ticket.source}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {ticket.assigned_user?.display_name || 'Sin asignar'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateTicketStatus(ticket.id, 'en_progreso')}
                                disabled={ticket.status === 'en_progreso'}
                              >
                                Marcar en progreso
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateTicketStatus(ticket.id, 'resuelto')}
                                disabled={ticket.status === 'resuelto' || ticket.status === 'cerrado'}
                              >
                                Marcar resuelto
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateTicketStatus(ticket.id, 'cerrado')}
                                disabled={ticket.status === 'cerrado'}
                                className="text-destructive"
                              >
                                Cerrar ticket
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketsList;
