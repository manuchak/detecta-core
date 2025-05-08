
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus, MoreHorizontal, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusBadgeStyles = {
  nuevo: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  proceso: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  aprobacion: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  aprobado: "bg-green-100 text-green-800 hover:bg-green-100",
  rechazado: "bg-red-100 text-red-800 hover:bg-red-100",
};

// Mock data
const mockLeads = [
  { id: 1, nombre: "Transportes MX", contacto: "Jorge Pérez", email: "jorge@transportesmx.com", telefono: "+52 123 456 7890", estado: "nuevo", fecha: "2023-05-01" },
  { id: 2, nombre: "Logística Internacional", contacto: "Ana Gómez", email: "ana@logisticaint.com", telefono: "+52 234 567 8901", estado: "proceso", fecha: "2023-04-28" },
  { id: 3, nombre: "Cargas Expresas", contacto: "Miguel Rodríguez", email: "miguel@cargasexp.com", telefono: "+52 345 678 9012", estado: "aprobacion", fecha: "2023-04-25" },
  { id: 4, nombre: "Fletes Rápidos", contacto: "Laura Torres", email: "laura@fletesrap.com", telefono: "+52 456 789 0123", estado: "aprobado", fecha: "2023-04-20" },
  { id: 5, nombre: "Transportadora Nacional", contacto: "Roberto Díaz", email: "roberto@transnac.com", telefono: "+52 567 890 1234", estado: "rechazado", fecha: "2023-04-15" },
];

export const LeadsList = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Gestiona los leads y su proceso de aprobación.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Lead
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Listado de Leads</CardTitle>
          <CardDescription>
            Total de leads: {mockLeads.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, contacto o email..." className="pl-8" />
            </div>
            <div className="flex gap-3">
              <Select defaultValue="todos">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="proceso">En proceso</SelectItem>
                  <SelectItem value="aprobacion">En aprobación</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Filtrar</Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nombre}</TableCell>
                    <TableCell>{lead.contacto}</TableCell>
                    <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.telefono}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeStyles[lead.estado as keyof typeof statusBadgeStyles]}>
                        {lead.estado.charAt(0).toUpperCase() + lead.estado.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.fecha}</TableCell>
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
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Eliminar
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

export default LeadsList;
