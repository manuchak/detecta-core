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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Search, 
  Download, 
  X, 
  Clock, 
  Users, 
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { ServicioFacturacion } from '../hooks/useServiciosFacturacion';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatTiempoRetrasoDisplay, parsePostgresInterval } from '@/utils/timeUtils';
import { formatCDMXTime } from '@/utils/cdmxTimezone';
import * as XLSX from 'xlsx';
import { ServicioDetalleDialog } from './ServicioDetalleDialog';

interface ServiciosConsultaProps {
  servicios: ServicioFacturacion[];
  isLoading: boolean;
  clientes: string[];
}

type ColumnGroup = 'basic' | 'planeacion' | 'timeline' | 'operativo' | 'bi';

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
  planeacion: { label: 'Planeación', icon: <Calendar className="h-3 w-3" /> },
  timeline: { label: 'Timeline', icon: <Clock className="h-3 w-3" /> },
  operativo: { label: 'Operativo', icon: <Users className="h-3 w-3" /> },
  bi: { label: 'BI', icon: <BarChart3 className="h-3 w-3" /> },
};

export function ServiciosConsulta({ servicios, isLoading, clientes }: ServiciosConsultaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [localForaneoFilter, setLocalForaneoFilter] = useState<string>('all');
  const [visibleGroups, setVisibleGroups] = useState<ColumnGroup[]>(['basic', 'planeacion', 'timeline', 'operativo', 'bi']);
  const [selectedServicio, setSelectedServicio] = useState<ServicioFacturacion | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleRowClick = (servicio: ServicioFacturacion) => {
    setSelectedServicio(servicio);
    setDetailOpen(true);
  };

  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        s.folio_saphiro?.toLowerCase().includes(searchLower) ||
        s.id_servicio?.toLowerCase().includes(searchLower) ||
        s.referencia_cliente?.toLowerCase().includes(searchLower) ||
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

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateStr;
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredServicios.map(s => ({
      // Identificación completa
      'Folio Saphiro': s.folio_saphiro,
      'Ref. Cliente': s.referencia_cliente || '',
      'Folio Cliente': s.folio_cliente || '',
      // Timeline Planeación
      'Fecha Recepción': formatDateTime(s.fecha_recepcion),
      'Fecha Asignación': formatDateTime(s.fecha_asignacion),
      'Fecha Asig. Armado': formatDateTime(s.fecha_asignacion_armado),
      // Timeline Operativo
      'Fecha Cita': formatDateTime(s.fecha_hora_cita),
      'Hora Presentación': s.hora_presentacion ? formatCDMXTime(s.hora_presentacion) : '',
      'Hora Inicio': s.hora_inicio_custodia ? formatCDMXTime(s.hora_inicio_custodia) : '',
      'Hora Arribo': s.hora_arribo ? formatCDMXTime(s.hora_arribo) : '',
      'Hora Fin': s.hora_finalizacion ? formatCDMXTime(s.hora_finalizacion) : '',
      'Duración': s.duracion_calculada ? formatDuracion(s.duracion_calculada) : '',
      'Retraso': s.tiempo_retraso || '',
      // Cliente y Ruta
      'Cliente': s.nombre_cliente,
      'Ruta': s.ruta,
      'Origen': s.origen,
      'Destino': s.destino,
      'Tipo Servicio': s.tipo_servicio,
      'Local/Foráneo': s.local_foraneo,
      // Operativo - Custodio
      'Custodio': s.nombre_custodio,
      'Tel. Custodio': s.telefono_custodio || '',
      'Vehículo Custodio': s.vehiculo_custodio || '',
      'Placa Custodio': s.placa_custodio || '',
      // Operativo - Armado
      'Armado': s.nombre_armado || '',
      'Tel. Armado': s.telefono_armado || '',
      'Tipo Asig. Armado': s.tipo_asignacion_armado || '',
      'Proveedor': s.proveedor || '',
      // Transporte
      'Tipo Unidad': s.tipo_unidad || '',
      'Tipo Carga': s.tipo_carga || '',
      'Operador Transporte': s.nombre_operador_transporte || '',
      'Tel. Operador': s.telefono_operador || '',
      'Placa Unidad': s.placa_carga || '',
      // Kilometraje
      'Km Teórico': s.km_teorico || '',
      'Km Recorridos': s.km_recorridos,
      'Desv. Km %': s.desviacion_km || '',
      'Km Extras': s.km_extras || '',
      'Km Auditado': s.km_auditado ? 'Sí' : 'No',
      // Financiero
      'Cobro Cliente': s.cobro_cliente,
      'Costo Custodio': s.costo_custodio,
      'Margen': s.margen_bruto,
      '% Margen': s.porcentaje_margen,
      'Casetas': s.casetas || '',
      // Estado
      'Estado': s.estado,
      'Estado Planeación': s.estado_planeacion || '',
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
      return formatCDMXTime(dateStr, 'HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return formatCDMXTime(dateStr, 'dd/MM HH:mm');
    } catch {
      return dateStr;
    }
  };

  // Formatea intervalos PostgreSQL (HH:MM:SS.mmm) a formato legible
  const formatDuracion = (duracion: string | null) => {
    if (!duracion) return '-';
    const match = duracion.match(/^(-?)(\d+):(\d+):(\d+)/);
    if (!match) return duracion;
    
    const [, negativo, horas, minutos] = match;
    const h = parseInt(horas);
    const m = parseInt(minutos);
    
    if (h === 0 && m === 0) return '< 1m';
    if (h > 0) return `${negativo}${h}h ${m}m`;
    return `${negativo}${m}m`;
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
    <TooltipProvider>
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
                placeholder="Buscar folio, referencia, cliente, custodio, ruta..."
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
                  <TableHead className="w-[130px] text-xs sticky left-0 bg-background z-20">
                    <div className="flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" />
                      Folio
                    </div>
                  </TableHead>
                  {isGroupVisible('basic') && (
                    <>
                      <TableHead className="w-[100px] text-xs">Ref. Cliente</TableHead>
                      <TableHead className="w-[110px] text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha Cita
                        </div>
                      </TableHead>
                      <TableHead className="text-xs min-w-[120px]">Cliente</TableHead>
                      <TableHead className="text-xs min-w-[140px]">Ruta</TableHead>
                      <TableHead className="text-right text-xs">Cobro</TableHead>
                      <TableHead className="text-right text-xs">Costo</TableHead>
                      <TableHead className="text-right text-xs">Margen</TableHead>
                      <TableHead className="text-center text-xs">Estado</TableHead>
                    </>
                  )}
                  
                  {/* Planeación - NUEVO GRUPO */}
                  {isGroupVisible('planeacion') && (
                    <>
                      <TableHead className="text-xs w-[100px]">Recepción</TableHead>
                      <TableHead className="text-xs w-[100px]">Asignación</TableHead>
                      <TableHead className="text-xs w-[100px]">Asig. Armado</TableHead>
                      <TableHead className="text-xs w-[90px]">Estado Plan</TableHead>
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
                      <TableHead className="text-center text-xs w-[60px]">Km Aud.</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServicios.slice(0, 200).map((s) => (
                  <TableRow 
                    key={s.id} 
                    className="text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(s)}
                  >
                    {/* Folio completo con tooltip */}
                    <TableCell className="font-mono py-2 sticky left-0 bg-background min-w-[130px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help font-medium text-primary hover:underline">
                            {s.folio_saphiro}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[300px]">
                          <div className="space-y-1 text-xs">
                            <p><span className="font-semibold">Folio Saphiro:</span> {s.folio_saphiro}</p>
                            {s.referencia_cliente && (
                              <p><span className="font-semibold">Ref. Cliente:</span> {s.referencia_cliente}</p>
                            )}
                            {s.folio_cliente && (
                              <p><span className="font-semibold">Folio Cliente:</span> {s.folio_cliente}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    
                    {isGroupVisible('basic') && (
                      <>
                        <TableCell className="py-2 font-medium">
                          {s.referencia_cliente || s.id_interno_cliente || '-'}
                        </TableCell>
                        <TableCell className="py-2">
                          {formatDateShort(s.fecha_hora_cita)}
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
                    
                    {/* Planeación */}
                    {isGroupVisible('planeacion') && (
                      <>
                        <TableCell className="py-2 text-muted-foreground">
                          {formatDateShort(s.fecha_recepcion)}
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {formatDateShort(s.fecha_asignacion)}
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {formatDateShort(s.fecha_asignacion_armado)}
                        </TableCell>
                        <TableCell className="py-2">
                          {s.estado_planeacion ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {s.estado_planeacion}
                            </Badge>
                          ) : '-'}
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
                            {formatDuracion(s.duracion_calculada)}
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
                          <div className="flex items-center gap-1">
                            {s.nombre_armado || '-'}
                            {s.tipo_asignacion_armado === 'proveedor' && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0">Ext</Badge>
                            )}
                          </div>
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
                        (isGroupVisible('planeacion') ? 4 : 0) +
                        (isGroupVisible('timeline') ? 6 : 0) + 
                        (isGroupVisible('operativo') ? 6 : 0) + 
                        (isGroupVisible('bi') ? 4 : 0)
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

      <ServicioDetalleDialog
        servicio={selectedServicio}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </TooltipProvider>
  );
}
