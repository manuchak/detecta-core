import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, Filter, X } from 'lucide-react';
import { ServicioFacturacion } from '../hooks/useServiciosFacturacion';
import { formatCurrency, formatNumber } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface ServiciosConsultaProps {
  servicios: ServicioFacturacion[];
  isLoading: boolean;
  clientes: string[];
}

const ESTADOS = [
  'Finalizado',
  'En ruta',
  'En Espera',
  'Programado',
  'Cancelado',
  'Cancelado por cliente',
];

export function ServiciosConsulta({ servicios, isLoading, clientes }: ServiciosConsultaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [localForaneoFilter, setLocalForaneoFilter] = useState<string>('all');

  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const matchesSearch = 
        !searchTerm ||
        s.id_servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.folio_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ruta?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = estadoFilter === 'all' || s.estado === estadoFilter;
      const matchesCliente = clienteFilter === 'all' || s.nombre_cliente === clienteFilter;
      const matchesLocalForaneo = localForaneoFilter === 'all' || s.local_foraneo === localForaneoFilter;

      return matchesSearch && matchesEstado && matchesCliente && matchesLocalForaneo;
    });
  }, [servicios, searchTerm, estadoFilter, clienteFilter, localForaneoFilter]);

  const handleExportExcel = () => {
    const exportData = filteredServicios.map(s => ({
      'ID Servicio': s.id_servicio,
      'Fecha': s.fecha_hora_cita ? format(new Date(s.fecha_hora_cita), 'dd/MM/yyyy HH:mm', { locale: es }) : '',
      'Cliente': s.nombre_cliente,
      'Folio Cliente': s.folio_cliente,
      'Ruta': s.ruta,
      'Origen': s.origen,
      'Destino': s.destino,
      'Tipo Servicio': s.tipo_servicio,
      'Local/Foráneo': s.local_foraneo,
      'Km Recorridos': s.km_recorridos,
      'Cobro Cliente': s.cobro_cliente,
      'Costo Custodio': s.costo_custodio,
      'Margen': s.margen_bruto,
      '% Margen': s.porcentaje_margen,
      'Custodio': s.nombre_custodio,
      'Armado': s.nombre_armado,
      'Estado': s.estado,
      'Casetas': s.casetas,
      'RFC Cliente': s.cliente_rfc,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
    XLSX.writeFile(wb, `servicios_facturacion_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEstadoFilter('all');
    setClienteFilter('all');
    setLocalForaneoFilter('all');
  };

  const hasActiveFilters = searchTerm || estadoFilter !== 'all' || clienteFilter !== 'all' || localForaneoFilter !== 'all';

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'Finalizado': return 'default';
      case 'En ruta': return 'secondary';
      case 'En Espera': return 'outline';
      case 'Cancelado':
      case 'Cancelado por cliente': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-full" />
            <div className="h-[400px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg">Consulta de Servicios</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredServicios.length} de {servicios.length} servicios
            </Badge>
            <Button onClick={handleExportExcel} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, cliente, folio o ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {ESTADOS.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clientes.slice(0, 50).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={localForaneoFilter} onValueChange={setLocalForaneoFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Local">Local</SelectItem>
              <SelectItem value="Foráneo">Foráneo</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tabla */}
        <div className="rounded-md border overflow-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="w-[140px]">Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead className="text-right">Cobro</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicios.slice(0, 200).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    {s.id_servicio?.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.fecha_hora_cita 
                      ? format(new Date(s.fecha_hora_cita), 'dd/MM/yy HH:mm', { locale: es })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate" title={s.nombre_cliente}>
                    {s.nombre_cliente || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={s.ruta}>
                    {s.ruta || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {s.cobro_cliente ? formatCurrency(s.cobro_cliente) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {s.costo_custodio ? formatCurrency(s.costo_custodio) : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    s.margen_bruto > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {s.margen_bruto != null ? formatCurrency(s.margen_bruto) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getEstadoBadgeVariant(s.estado)}>
                      {s.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServicios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron servicios con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredServicios.length > 200 && (
          <p className="text-sm text-muted-foreground text-center">
            Mostrando 200 de {filteredServicios.length} servicios. Use filtros para reducir resultados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
