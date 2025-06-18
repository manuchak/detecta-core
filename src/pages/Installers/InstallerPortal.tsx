

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Map, Timer, XCircle } from "lucide-react";

// Mock data
const mockAssignments = [
  { id: 1, cliente: "Transportes MX", direccion: "Av. Insurgentes 2500, CDMX", fecha: "2023-05-10", hora: "09:00 - 11:00", dispositivos: 3, estado: "pendiente" },
  { id: 2, cliente: "Logística Internacional", direccion: "Blvd. Kukulcán 55, Cancún", fecha: "2023-05-11", hora: "10:00 - 12:00", dispositivos: 1, estado: "pendiente" },
  { id: 3, cliente: "Cargas Expresas", direccion: "Av. Constitución 1050, Monterrey", fecha: "2023-05-09", hora: "14:00 - 16:00", dispositivos: 2, estado: "completado" },
  { id: 4, cliente: "Fletes Rápidos", direccion: "Paseo de la Reforma 222, CDMX", fecha: "2023-05-08", hora: "11:00 - 13:00", dispositivos: 4, estado: "cancelado" },
];

export const InstallerPortal = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portal de Instalador</h1>
        <p className="text-muted-foreground">
          Gestiona tus instalaciones asignadas.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instalaciones programadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas esta semana</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo promedio</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.5h</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos instalados</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Instalaciones asignadas</CardTitle>
          <CardDescription>
            Gestiona tus instalaciones programadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Dirección</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden lg:table-cell">Hora</TableHead>
                <TableHead className="hidden md:table-cell">Dispositivos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.cliente}</TableCell>
                  <TableCell className="hidden md:table-cell">{assignment.direccion}</TableCell>
                  <TableCell>{assignment.fecha}</TableCell>
                  <TableCell className="hidden lg:table-cell">{assignment.hora}</TableCell>
                  <TableCell className="hidden md:table-cell">{assignment.dispositivos}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        assignment.estado === "pendiente"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          : assignment.estado === "completado"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {assignment.estado.charAt(0).toUpperCase() + assignment.estado.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.estado === "pendiente" && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Iniciar
                        </Button>
                      </div>
                    )}
                    {assignment.estado === "completado" && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> Finalizado
                      </div>
                    )}
                    {assignment.estado === "cancelado" && (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-1" /> Cancelado
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallerPortal;

