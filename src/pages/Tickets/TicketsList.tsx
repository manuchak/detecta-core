
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
import { ChevronRight, MoreHorizontal, Plus, Search } from "lucide-react";

// Mock data
const mockTickets = [
  { id: 1, asunto: "Falla de dispositivo GPS", cliente: "Transportes MX", prioridad: "alta", estado: "abierto", fecha: "2023-05-02", asignado: "Carlos Gutiérrez" },
  { id: 2, asunto: "Error en panel de monitoreo", cliente: "Logística Internacional", prioridad: "media", estado: "en_proceso", fecha: "2023-05-01", asignado: "Ana Martínez" },
  { id: 3, asunto: "Solicitud de reporte personalizado", cliente: "Cargas Expresas", prioridad: "baja", estado: "pendiente", fecha: "2023-04-30", asignado: "Sin asignar" },
  { id: 4, asunto: "Reemplazo de batería", cliente: "Fletes Rápidos", prioridad: "alta", estado: "resuelto", fecha: "2023-04-28", asignado: "Roberto Díaz" },
  { id: 5, asunto: "Capacitación para nuevo personal", cliente: "Transportadora Nacional", prioridad: "media", estado: "cerrado", fecha: "2023-04-25", asignado: "María López" },
];

const priorityBadgeStyles = {
  alta: "bg-red-100 text-red-800 hover:bg-red-100",
  media: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  baja: "bg-blue-100 text-blue-800 hover:bg-blue-100",
};

const statusBadgeStyles = {
  abierto: "bg-green-100 text-green-800 hover:bg-green-100",
  en_proceso: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  pendiente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  resuelto: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  cerrado: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const statusLabels = {
  abierto: "Abierto",
  en_proceso: "En proceso",
  pendiente: "Pendiente",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

export const TicketsList = () => {
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
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">En proceso</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-medium">Resueltos (este mes)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="text-2xl font-bold">12</div>
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
              <Input placeholder="Buscar por asunto o cliente..." className="pl-8" />
            </div>
            <div className="flex gap-3">
              <Select defaultValue="todos">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="todas">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Filtrar</Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="hidden md:table-cell">Asignado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.asunto}</TableCell>
                    <TableCell className="hidden md:table-cell">{ticket.cliente}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityBadgeStyles[ticket.prioridad as keyof typeof priorityBadgeStyles]}>
                        {ticket.prioridad.charAt(0).toUpperCase() + ticket.prioridad.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeStyles[ticket.estado as keyof typeof statusBadgeStyles]}>
                        {statusLabels[ticket.estado as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{ticket.fecha}</TableCell>
                    <TableCell className="hidden md:table-cell">{ticket.asignado}</TableCell>
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
                          <DropdownMenuItem>Actualizar estado</DropdownMenuItem>
                          <DropdownMenuItem>Asignar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Cerrar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
