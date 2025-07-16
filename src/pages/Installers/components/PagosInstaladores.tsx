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
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PagoInstalador {
  id: string;
  instalador: {
    nombre_completo: string;
    telefono: string;
  };
  concepto: string;
  monto: number;
  fecha_trabajo: string;
  fecha_pago?: string;
  estado_pago: string;
  metodo_pago?: string;
  referencia_pago?: string;
}

export const PagosInstaladores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Simulación de datos - en producción esto vendría de la base de datos
  const { data: pagos, isLoading } = useQuery({
    queryKey: ['pagos-instaladores'],
    queryFn: async () => {
      // Por ahora devolvemos datos simulados
      const datosMockPagos: PagoInstalador[] = [
        {
          id: '1',
          instalador: {
            nombre_completo: 'Juan Carlos Rodríguez',
            telefono: '5512345678'
          },
          concepto: 'instalacion',
          monto: 850.00,
          fecha_trabajo: '2024-01-15T10:00:00Z',
          fecha_pago: '2024-01-20T14:30:00Z',
          estado_pago: 'pagado',
          metodo_pago: 'transferencia',
          referencia_pago: 'TRF-001-2024'
        },
        {
          id: '2',
          instalador: {
            nombre_completo: 'María Elena Sánchez',
            telefono: '5587654321'
          },
          concepto: 'mantenimiento',
          monto: 450.00,
          fecha_trabajo: '2024-01-14T09:30:00Z',
          estado_pago: 'pendiente',
          metodo_pago: undefined,
          referencia_pago: undefined
        },
        {
          id: '3',
          instalador: {
            nombre_completo: 'Roberto Méndez Torres',
            telefono: '5543218765'
          },
          concepto: 'instalacion',
          monto: 750.00,
          fecha_trabajo: '2024-01-13T16:00:00Z',
          estado_pago: 'procesado',
          metodo_pago: 'deposito',
          referencia_pago: undefined
        }
      ];
      return datosMockPagos;
    }
  });

  const pagosFiltrados = pagos?.filter(pago => {
    const matchesSearch = pago.instalador.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pago.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pago.referencia_pago?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filtroEstado === 'todos' || pago.estado_pago === filtroEstado;
    
    return matchesSearch && matchesEstado;
  }) || [];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'procesado': return 'bg-blue-100 text-blue-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagado': return <CheckCircle className="h-4 w-4" />;
      case 'procesado': return <Clock className="h-4 w-4" />;
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'rechazado': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConceptoLabel = (concepto: string) => {
    const conceptos = {
      instalacion: 'Instalación',
      mantenimiento: 'Mantenimiento', 
      reparacion: 'Reparación',
      bono: 'Bono'
    };
    return conceptos[concepto as keyof typeof conceptos] || concepto;
  };

  const totalPendiente = pagosFiltrados.filter(p => p.estado_pago === 'pendiente')
    .reduce((sum, p) => sum + p.monto, 0);

  const totalPagado = pagosFiltrados.filter(p => p.estado_pago === 'pagado')
    .reduce((sum, p) => sum + p.monto, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Pagos</h2>
          <p className="text-muted-foreground mt-1">Control de pagos a instaladores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${totalPendiente.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPagado.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total General</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalPendiente + totalPagado).toLocaleString()}
            </div>
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
                placeholder="Buscar por instalador, concepto o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              {['todos', 'pendiente', 'procesado', 'pagado', 'rechazado'].map((estado) => (
                <Button
                  key={estado}
                  variant={filtroEstado === estado ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroEstado(estado)}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            {pagosFiltrados.length} pagos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instalador</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha Trabajo</TableHead>
                <TableHead>Fecha Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagosFiltrados.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pago.instalador.nombre_completo}</div>
                      <div className="text-sm text-muted-foreground">{pago.instalador.telefono}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {getConceptoLabel(pago.concepto)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">${pago.monto.toLocaleString()}</span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(pago.fecha_trabajo).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {pago.fecha_pago ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(pago.fecha_pago).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getEstadoColor(pago.estado_pago)}>
                      <div className="flex items-center gap-1">
                        {getEstadoIcon(pago.estado_pago)}
                        {pago.estado_pago}
                      </div>
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {pago.metodo_pago ? (
                      <Badge variant="secondary">{pago.metodo_pago}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {pago.referencia_pago || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {pagosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No se encontraron pagos</p>
              <p className="text-sm">Ajusta los filtros o registra un nuevo pago</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};