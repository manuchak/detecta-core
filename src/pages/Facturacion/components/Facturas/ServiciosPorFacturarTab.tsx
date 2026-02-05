import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Receipt,
  Search,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';
import { 
  useServiciosAgrupadosPorCliente, 
  ClienteConServiciosPendientes 
} from '../../hooks/useServiciosPorFacturar';
import { GenerarFacturaModal } from './GenerarFacturaModal';

interface ServiciosPorFacturarTabProps {
  fechaInicio?: string;
  fechaFin?: string;
}

export function ServiciosPorFacturarTab({ fechaInicio, fechaFin }: ServiciosPorFacturarTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());
  const [clienteParaFacturar, setClienteParaFacturar] = useState<ClienteConServiciosPendientes | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { 
    clientesAgrupados, 
    totalServicios, 
    totalMonto, 
    isLoading, 
    refetch 
  } = useServiciosAgrupadosPorCliente({
    fechaInicio,
    fechaFin,
    cliente: searchTerm || undefined,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(new Set(clientesAgrupados.map(c => c.cliente)));
    } else {
      setSelectedClientes(new Set());
    }
  };

  const handleSelectCliente = (cliente: string, checked: boolean) => {
    const newSelected = new Set(selectedClientes);
    if (checked) {
      newSelected.add(cliente);
    } else {
      newSelected.delete(cliente);
    }
    setSelectedClientes(newSelected);
  };

  const handleFacturarCliente = (cliente: ClienteConServiciosPendientes) => {
    setClienteParaFacturar(cliente);
    setModalOpen(true);
  };

  const handleFacturarSeleccionados = () => {
    // Para facturación múltiple, tomamos el primer cliente seleccionado
    // En una implementación más completa, se podría generar una factura por cliente
    const primerCliente = clientesAgrupados.find(c => selectedClientes.has(c.cliente));
    if (primerCliente) {
      setClienteParaFacturar(primerCliente);
      setModalOpen(true);
    }
  };

  const clientesSeleccionadosCount = selectedClientes.size;
  const serviciosSeleccionados = clientesAgrupados
    .filter(c => selectedClientes.has(c.cliente))
    .reduce((sum, c) => sum + c.servicios, 0);
  const montoSeleccionado = clientesAgrupados
    .filter(c => selectedClientes.has(c.cliente))
    .reduce((sum, c) => sum + c.montoTotal, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="h-3.5 w-3.5" />
              Servicios Pendientes
            </div>
            <div className="text-2xl font-bold">{totalServicios.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Monto por Facturar
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalMonto)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Receipt className="h-3.5 w-3.5" />
              Clientes con Pendientes
            </div>
            <div className="text-2xl font-bold">{clientesAgrupados.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>

        {clientesSeleccionadosCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{clientesSeleccionadosCount}</span> cliente(s) |{' '}
              <span className="font-medium text-foreground">{serviciosSeleccionados}</span> servicios |{' '}
              <span className="font-medium text-primary">{formatCurrency(montoSeleccionado)}</span>
            </div>
            <Button size="sm" onClick={handleFacturarSeleccionados}>
              <Receipt className="h-4 w-4 mr-1" />
              Generar Factura
            </Button>
          </div>
        )}
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto h-[calc(var(--vh-full)-420px)] min-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      clientesAgrupados.length > 0 &&
                      selectedClientes.size === clientesAgrupados.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Servicios</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Último Servicio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesAgrupados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-8 w-8" />
                      <p>No hay servicios pendientes de facturar</p>
                      <p className="text-xs">
                        Todos los servicios finalizados ya tienen factura asignada
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clientesAgrupados.map((cliente) => (
                  <TableRow key={cliente.cliente}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClientes.has(cliente.cliente)}
                        onCheckedChange={(checked) =>
                          handleSelectCliente(cliente.cliente, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{cliente.cliente}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{cliente.servicios}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cliente.montoTotal)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(cliente.ultimoServicio), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFacturarCliente(cliente)}
                      >
                        <Receipt className="h-3.5 w-3.5 mr-1" />
                        Facturar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de generación */}
      <GenerarFacturaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cliente={clienteParaFacturar}
        onSuccess={() => {
          setModalOpen(false);
          setClienteParaFacturar(null);
          setSelectedClientes(new Set());
          refetch();
        }}
      />
    </div>
  );
}
