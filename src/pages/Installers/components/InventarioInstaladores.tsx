import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  DollarSign,
  Calendar
} from 'lucide-react';

interface InventarioInstalador {
  id: string;
  instalador: {
    nombre_completo: string;
    telefono: string;
  };
  equipo_tipo: 'gps' | 'herramienta' | 'material';
  equipo_nombre: string;
  numero_serie?: string;
  cantidad: number;
  estado: 'asignado' | 'en_uso' | 'danado' | 'perdido' | 'devuelto';
  fecha_asignacion: string;
  fecha_devolucion?: string;
  costo_unitario?: number;
  observaciones?: string;
}

export const InventarioInstaladores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Datos simulados - en producción vendría de la base de datos
  const inventario: InventarioInstalador[] = [
    {
      id: '1',
      instalador: {
        nombre_completo: 'Juan Carlos Rodríguez',
        telefono: '5512345678'
      },
      equipo_tipo: 'gps',
      equipo_nombre: 'GPS Tracker Pro X1',
      numero_serie: 'GTX-001234',
      cantidad: 2,
      estado: 'asignado',
      fecha_asignacion: '2024-01-10T09:00:00Z',
      costo_unitario: 1200.00,
      observaciones: 'Equipos para instalaciones en CDMX'
    },
    {
      id: '2',
      instalador: {
        nombre_completo: 'María Elena Sánchez',
        telefono: '5587654321'
      },
      equipo_tipo: 'herramienta',
      equipo_nombre: 'Kit Herramientas Básico',
      cantidad: 1,
      estado: 'en_uso',
      fecha_asignacion: '2024-01-05T08:30:00Z',
      costo_unitario: 850.00
    },
    {
      id: '3',
      instalador: {
        nombre_completo: 'Roberto Méndez Torres',
        telefono: '5543218765'
      },
      equipo_tipo: 'material',
      equipo_nombre: 'Cable de Alimentación (10m)',
      cantidad: 5,
      estado: 'asignado',
      fecha_asignacion: '2024-01-12T10:15:00Z',
      costo_unitario: 45.00
    },
    {
      id: '4',
      instalador: {
        nombre_completo: 'Ana Laura Jiménez',
        telefono: '5598765432'
      },
      equipo_tipo: 'gps',
      equipo_nombre: 'GPS Personal Mini',
      numero_serie: 'GPM-005678',
      cantidad: 1,
      estado: 'danado',
      fecha_asignacion: '2024-01-08T14:20:00Z',
      costo_unitario: 750.00,
      observaciones: 'Reportado como dañado durante instalación'
    }
  ];

  const inventarioFiltrado = inventario.filter(item => {
    const matchesSearch = item.instalador.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.equipo_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filtroEstado === 'todos' || item.estado === filtroEstado;
    const matchesTipo = filtroTipo === 'todos' || item.equipo_tipo === filtroTipo;
    
    return matchesSearch && matchesEstado && matchesTipo;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'asignado': return 'bg-blue-100 text-blue-800';
      case 'en_uso': return 'bg-green-100 text-green-800';
      case 'danado': return 'bg-red-100 text-red-800';
      case 'perdido': return 'bg-orange-100 text-orange-800';
      case 'devuelto': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'asignado': return <Package className="h-4 w-4" />;
      case 'en_uso': return <CheckCircle className="h-4 w-4" />;
      case 'danado': return <AlertTriangle className="h-4 w-4" />;
      case 'perdido': return <AlertTriangle className="h-4 w-4" />;
      case 'devuelto': return <ArrowLeft className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos = {
      gps: 'GPS',
      herramienta: 'Herramienta',
      material: 'Material'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const getEstadoLabel = (estado: string) => {
    const estados = {
      asignado: 'Asignado',
      en_uso: 'En Uso',
      danado: 'Dañado',
      perdido: 'Perdido',
      devuelto: 'Devuelto'
    };
    return estados[estado as keyof typeof estados] || estado;
  };

  const estadisticas = {
    totalItems: inventario.length,
    valorTotal: inventario.reduce((sum, item) => sum + (item.costo_unitario || 0) * item.cantidad, 0),
    asignados: inventario.filter(i => i.estado === 'asignado').length,
    enUso: inventario.filter(i => i.estado === 'en_uso').length,
    problemas: inventario.filter(i => ['danado', 'perdido'].includes(i.estado)).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventario de Instaladores</h2>
          <p className="text-muted-foreground mt-1">Control de equipos y herramientas asignadas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Devolver Equipo
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Asignar Equipo
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${estadisticas.valorTotal.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Uso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.enUso}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.problemas}</div>
            <p className="text-xs text-muted-foreground">
              Dañados/Perdidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por instalador, equipo o número de serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="gps">GPS</option>
                <option value="herramienta">Herramientas</option>
                <option value="material">Materiales</option>
              </select>

              {['todos', 'asignado', 'en_uso', 'danado', 'perdido', 'devuelto'].map((estado) => (
                <Button
                  key={estado}
                  variant={filtroEstado === estado ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroEstado(estado)}
                >
                  {estado === 'todos' ? 'Todos' : getEstadoLabel(estado)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario Asignado</CardTitle>
          <CardDescription>
            {inventarioFiltrado.length} items encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instalador</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Asignación</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventarioFiltrado.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.instalador.nombre_completo}</div>
                      <div className="text-sm text-muted-foreground">{item.instalador.telefono}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.equipo_nombre}</div>
                      {item.numero_serie && (
                        <div className="text-sm text-muted-foreground">S/N: {item.numero_serie}</div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {getTipoLabel(item.equipo_tipo)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{item.cantidad}</span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getEstadoColor(item.estado)}>
                      <div className="flex items-center gap-1">
                        {getEstadoIcon(item.estado)}
                        {getEstadoLabel(item.estado)}
                      </div>
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.fecha_asignacion).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {item.costo_unitario && (
                      <div>
                        <div className="font-medium">
                          ${(item.costo_unitario * item.cantidad).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${item.costo_unitario}/u
                        </div>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4" />
                      </Button>
                      {item.estado !== 'devuelto' && (
                        <Button variant="outline" size="sm">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {inventarioFiltrado.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No se encontraron items en inventario</p>
              <p className="text-sm">Ajusta los filtros o asigna nuevos equipos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};