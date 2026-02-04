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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Search, 
  Download, 
  X, 
  Clock, 
  Users, 
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { ServicioFacturacion } from '../hooks/useServiciosFacturacion';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTiempoRetrasoDisplay, parsePostgresInterval } from '@/utils/timeUtils';
import * as XLSX from 'xlsx';

interface ServiciosConsultaProps {
  servicios: ServicioFacturacion[];
  isLoading: boolean;
  clientes: string[];
}

type ColumnGroup = 'basic' | 'timeline' | 'operativo' | 'bi';

const ESTADOS = [
  'Finalizado',
  'En ruta',
  'En Espera',
  'Programado',
  'Cancelado',
  'Cancelado por cliente',
];

const COLUMN_GROUP_LABELS: Record<ColumnGroup, { label: string; icon: React.ReactNode }> = {
  basic: { label: 'Básico', icon: null },
  timeline: { label: 'Timeline', icon: <Clock className="h-3 w-3" /> },
  operativo: { label: 'Operativo', icon: <Users className="h-3 w-3" /> },
  bi: { label: 'BI', icon: <BarChart3 className="h-3 w-3" /> },
};

export function ServiciosConsulta({ servicios, isLoading, clientes }: ServiciosConsultaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [localForaneoFilter, setLocalForaneoFilter] = useState<string>('all');
  const [visibleGroups, setVisibleGroups] = useState<ColumnGroup[]>(['basic']);

  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        s.id_servicio?.toLowerCase().includes(searchLower) ||
        s.id_interno_cliente?.toLowerCase().includes(searchLower) ||
        s.nombre_cliente?.toLowerCase().includes(searchLower) ||
        s.folio_cliente?.toLowerCase().includes(searchLower) ||
        s.nombre_custodio?.toLowerCase().includes(searchLower) ||
        s.ruta?.toLowerCase().includes(searchLower);

      const matchesEstado = estadoFilter === 'all' || s.estado === estadoFilter;
      const matchesCliente = clienteFilter === 'all' || s.nombre_cliente === clienteFilter;
      const matchesLocalForaneo = localForaneoFilter === 'all' || s.local_foraneo === localForaneoFilter;

      return matchesSearch && matchesEstado && matchesCliente && matchesLocalForaneo;
    });
  }, [servicios, searchTerm, estadoFilter, clienteFilter, localForaneoFilter]);

  const handleExportExcel = () => {
    const exportData = filteredServicios.map(s => ({
      'ID Servicio': s.id_servicio,
      'Folio Interno': s.id_interno_cliente || '',
      'Fecha Cita': s.fecha_hora_cita ? format(new Date(s.fecha_hora_cita), 'dd/MM/yyyy HH:mm', { locale: es }) : '',
      'Cliente': s.nombre_cliente,
      'Folio Cliente': s.folio_cliente,
      'Ruta': s.ruta,
      'Origen': s.origen,
      'Destino': s.destino,
      'Tipo Servicio': s.tipo_servicio,
      'Local/Foráneo': s.local_foraneo,
      // Timeline
      'Hora Presentación': s.hora_presentacion || '',
      'Hora Inicio': s.hora_inicio_custodia || '',
      'Hora Arribo': s.hora_arribo || '',
      'Hora Fin': s.hora_finalizacion || '',
      'Duración': s.duracion_servicio || '',
      'Retraso': s.tiempo_retraso || '',
      // Operativo
      'Custodio': s.nombre_custodio,
      'Tel. Custodio': s.telefono_custodio || '',
      'Armado': s.nombre_armado || '',
      'Tel. Armado': s.telefono_armado || '',
      'Proveedor': s.proveedor || '',
      'Tipo Unidad': s.tipo_unidad || '',
      'Tipo Carga': s.tipo_carga || '',
      'Operador Transporte': s.nombre_operador_transporte || '',
      'Placa': s.placa_carga || '',
      // Kilometraje
      'Km Teórico': s.km_teorico || '',
      'Km Recorridos': s.km_recorridos,
      'Desv. Km %': s.desviacion_km || '',
      'Km Extras': s.km_extras || '',
      // Financiero
      'Cobro Cliente': s.cobro_cliente,
      'Costo Custodio': s.costo_custodio,
      'Margen': s.margen_bruto,
      '% Margen': s.porcentaje_margen,
      'Casetas': s.casetas || '',
      // Estado
      'Estado': s.estado,
      'Estado Plan': s.estado_planeacion || '',
      // Tracking
      'Gadget': s.gadget || '',
      'Tipo Gadget': s.tipo_gadget || '',
      // Origen
      'Creado Vía': s.creado_via || '',
      'Creado Por': s.creado_por,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios BI');
    XLSX.writeFile(wb, `servicios_facturacion_bi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
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

  const getRetrasoStyle = (retraso: string | null) => {
    if (!retraso) return '';
    const tiempo = parsePostgresInterval(retraso);
    if (!tiempo) return '';
    
    const totalMinutos = tiempo.horas * 60 + tiempo.minutos;
    
    if (tiempo.esNegativo || totalMinutos === 0) {
      return 'bg-accent/50 text-accent-foreground';
    } else if (totalMinutos > 30) {
      return 'bg-destructive/10 text-destructive';
    } else if (totalMinutos > 15) {
      return 'bg-warning/10 text-warning-foreground';
    }
    return '';
  };

  const getDesviacionKmIcon = (desviacion: number | null) => {
    if (desviacion === null) return null;
    if (Math.abs(desviacion) > 20) {
      return <AlertTriangle className="h-3 w-3 text-warning" />;
    }
    return null;
  };

  const isGroupVisible = (group: ColumnGroup) => visibleGroups.includes(group);

  const formatTimeOnly = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return format(date, 'HH:mm', { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-full" />
            <div className="h-[calc(100vh-280px)] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="py-2.5 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Consulta de Servicios BI</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {filteredServicios.length} de {servicios.length}
            </Badge>
            <Button onClick={handleExportExcel} size="sm" variant="outline" className="h-7 text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Filtros compactos */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar ID, folio interno, cliente, custodio, ruta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos estados</SelectItem>
              {ESTADOS.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clientes.slice(0, 50).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={localForaneoFilter} onValueChange={setLocalForaneoFilter}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Local">Local</SelectItem>
              <SelectItem value="Foráneo">Foráneo</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="h-8 w-8">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Toggle de grupos de columnas */}
        <div className="flex items-center gap-2 py-1">
          <span className="text-xs text-muted-foreground">Columnas:</span>
          <ToggleGroup 
            type="multiple" 
            value={visibleGroups}
            onValueChange={(value) => setVisibleGroups(value.length > 0 ? value as ColumnGroup[] : ['basic'])}
            className="justify-start"
          >
            {(Object.keys(COLUMN_GROUP_LABELS) as ColumnGroup[]).map((group) => (
              <ToggleGroupItem 
                key={group} 
                value={group} 
                size="sm"
                className="h-6 px-2 text-xs gap-1"
              >
                {COLUMN_GROUP_LABELS[group].icon}
                {COLUMN_GROUP_LABELS[group].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Tabla con altura dinámica y scroll horizontal */}
        <div className="rounded-md border border-border/50 overflow-auto h-[calc(100vh-340px)] min-h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {/* Básico - siempre visible */}
                <TableHead className="w-[80px] text-xs sticky left-0 bg-background z-20">ID</TableHead>
                {isGroupVisible('basic') && (
                  <>
                    <TableHead className="w-[100px] text-xs">Folio Int.</TableHead>
                    <TableHead className="w-[100px] text-xs">Fecha</TableHead>
                    <TableHead className="text-xs min-w-[120px]">Cliente</TableHead>
                    <TableHead className="text-xs min-w-[140px]">Ruta</TableHead>
                    <TableHead className="text-right text-xs">Cobro</TableHead>
                    <TableHead className="text-right text-xs">Costo</TableHead>
                    <TableHead className="text-right text-xs">Margen</TableHead>
                    <TableHead className="text-center text-xs">Estado</TableHead>
                  </>
                )}
                
                {/* Timeline */}
                {isGroupVisible('timeline') && (
                  <>
                    <TableHead className="text-xs text-center w-[60px]">Present.</TableHead>
                    <TableHead className="text-xs text-center w-[60px]">Inicio</TableHead>
                    <TableHead className="text-xs text-center w-[60px]">Arribo</TableHead>
                    <TableHead className="text-xs text-center w-[60px]">Fin</TableHead>
                    <TableHead className="text-xs text-center w-[70px]">Duración</TableHead>
                    <TableHead className="text-xs text-center w-[80px]">Retraso</TableHead>
                  </>
                )}
                
                {/* Operativo */}
                {isGroupVisible('operativo') && (
                  <>
                    <TableHead className="text-xs min-w-[100px]">Custodio</TableHead>
                    <TableHead className="text-xs min-w-[100px]">Armado</TableHead>
                    <TableHead className="text-xs min-w-[100px]">Proveedor</TableHead>
                    <TableHead className="text-xs w-[80px]">Tipo Unidad</TableHead>
                    <TableHead className="text-right text-xs w-[60px]">Km Teó.</TableHead>
                    <TableHead className="text-right text-xs w-[60px]">Km Real</TableHead>
                  </>
                )}
                
                {/* BI */}
                {isGroupVisible('bi') && (
                  <>
                    <TableHead className="text-right text-xs w-[60px]">% Mg</TableHead>
                    <TableHead className="text-right text-xs w-[70px]">Desv. Km</TableHead>
                    <TableHead className="text-xs w-[80px]">Canal</TableHead>
                    <TableHead className="text-xs w-[90px]">Estado Plan</TableHead>
                    <TableHead className="text-center text-xs w-[60px]">Km Aud.</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicios.slice(0, 200).map((s) => (
                <TableRow key={s.id} className="text-xs">
                  {/* Básico - siempre visible */}
                  <TableCell className="font-mono py-2 sticky left-0 bg-background">
                    {s.id_servicio?.substring(0, 7)}...
                  </TableCell>
                  {isGroupVisible('basic') && (
                    <>
                      <TableCell className="py-2 font-medium text-primary">
                        {s.id_interno_cliente || '-'}
                      </TableCell>
                      <TableCell className="py-2">
                        {s.fecha_hora_cita 
                          ? format(new Date(s.fecha_hora_cita), 'dd/MM HH:mm', { locale: es })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate py-2" title={s.nombre_cliente}>
                        {s.nombre_cliente || '-'}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate py-2" title={s.ruta}>
                        {s.ruta || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium py-2">
                        {s.cobro_cliente ? formatCurrency(s.cobro_cliente) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground py-2">
                        {s.costo_custodio ? formatCurrency(s.costo_custodio) : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium py-2 ${
                        s.margen_bruto > 0 ? 'text-primary' : 'text-destructive'
                      }`}>
                        {s.margen_bruto != null ? formatCurrency(s.margen_bruto) : '-'}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <Badge variant={getEstadoBadgeVariant(s.estado)} className="text-[10px] px-1.5 py-0">
                          {s.estado}
                        </Badge>
                      </TableCell>
                    </>
                  )}
                  
                  {/* Timeline */}
                  {isGroupVisible('timeline') && (
                    <>
                      <TableCell className="text-center py-2">
                        {formatTimeOnly(s.hora_presentacion)}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {formatTimeOnly(s.hora_inicio_custodia)}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {formatTimeOnly(s.hora_arribo)}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {formatTimeOnly(s.hora_finalizacion)}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                          {s.duracion_servicio || '-'}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center py-2 rounded ${getRetrasoStyle(s.tiempo_retraso)}`}>
                        {s.tiempo_retraso ? formatTiempoRetrasoDisplay(s.tiempo_retraso) : '-'}
                      </TableCell>
                    </>
                  )}
                  
                  {/* Operativo */}
                  {isGroupVisible('operativo') && (
                    <>
                      <TableCell className="py-2 truncate max-w-[100px]" title={s.nombre_custodio}>
                        {s.nombre_custodio || '-'}
                      </TableCell>
                      <TableCell className="py-2 truncate max-w-[100px]" title={s.nombre_armado || ''}>
                        {s.nombre_armado || '-'}
                      </TableCell>
                      <TableCell className="py-2 truncate max-w-[100px]" title={s.proveedor || ''}>
                        {s.proveedor || '-'}
                      </TableCell>
                      <TableCell className="py-2">
                        {s.tipo_unidad || '-'}
                      </TableCell>
                      <TableCell className="text-right py-2 text-muted-foreground">
                        {s.km_teorico ?? '-'}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        {s.km_recorridos ?? '-'}
                      </TableCell>
                    </>
                  )}
                  
                  {/* BI */}
                  {isGroupVisible('bi') && (
                    <>
                      <TableCell className={`text-right py-2 font-medium ${
                        (s.porcentaje_margen ?? 0) >= 40 
                          ? 'text-primary' 
                          : (s.porcentaje_margen ?? 0) < 20 
                            ? 'text-destructive' 
                            : ''
                      }`}>
                        {s.porcentaje_margen != null ? `${s.porcentaje_margen}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-1">
                          {getDesviacionKmIcon(s.desviacion_km)}
                          {s.desviacion_km != null ? `${s.desviacion_km}%` : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {s.creado_via || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        {s.estado_planeacion || '-'}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {s.km_auditado ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {filteredServicios.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={
                      1 + 
                      (isGroupVisible('basic') ? 8 : 0) + 
                      (isGroupVisible('timeline') ? 6 : 0) + 
                      (isGroupVisible('operativo') ? 6 : 0) + 
                      (isGroupVisible('bi') ? 5 : 0)
                    } 
                    className="text-center py-8 text-muted-foreground text-xs"
                  >
                    No se encontraron servicios con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredServicios.length > 200 && (
          <p className="text-[10px] text-muted-foreground text-center">
            Mostrando 200 de {filteredServicios.length} servicios. Use filtros para reducir resultados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
