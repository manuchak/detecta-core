import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Edit, 
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  CreditCard
} from 'lucide-react';
import { useClientesFiscales, ClienteFiscal } from '../../hooks/useClientesFiscales';
import { useClientesCreditoResumen } from '../../hooks/useClienteCredito';
import { ClienteFormModal } from './ClienteFormModal';
import { ClienteDetalleDrawer } from './ClienteDetalleDrawer';
import { CreditoSummaryCards } from './CreditoSummaryCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatUtils';
import * as XLSX from 'xlsx';

export function GestionClientesTab() {
  const { data: clientes = [], isLoading, refetch } = useClientesFiscales();
  const { data: creditoResumen = [] } = useClientesCreditoResumen();
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteFiscal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetalleDrawer, setShowDetalleDrawer] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');

  // Create a map for credit data
  const creditoMap = useMemo(() => {
    return new Map(creditoResumen.map(c => [c.id, c]));
  }, [creditoResumen]);

  const filteredClientes = useMemo(() => {
    let filtered = clientes.filter(c => 
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.rfc?.toLowerCase().includes(search.toLowerCase()) ||
      c.razon_social?.toLowerCase().includes(search.toLowerCase())
    );

    // Apply status filter
    switch (activeFilter) {
      case 'completos':
        filtered = filtered.filter(c => 
          c.rfc && c.razon_social && c.regimen_fiscal && c.codigo_postal_fiscal
        );
        break;
      case 'incompletos':
        filtered = filtered.filter(c => 
          (c.rfc || c.razon_social) && !(c.rfc && c.razon_social && c.regimen_fiscal && c.codigo_postal_fiscal)
        );
        break;
      case 'sin-datos':
        filtered = filtered.filter(c => !c.rfc && !c.razon_social);
        break;
      case 'sobre-limite':
        filtered = filtered.filter(c => creditoMap.get(c.id)?.sobre_limite);
        break;
      case 'con-vencido':
        filtered = filtered.filter(c => creditoMap.get(c.id)?.vencido);
        break;
    }

    return filtered;
  }, [clientes, search, activeFilter, creditoMap]);

  const handleEdit = (cliente: ClienteFiscal) => {
    setSelectedCliente(cliente);
    setShowEditModal(true);
  };

  const handleViewDetails = (cliente: ClienteFiscal) => {
    setSelectedCliente(cliente);
    setShowDetalleDrawer(true);
  };

  const handleExport = () => {
    const exportData = clientes.map(c => {
      const credito = creditoMap.get(c.id);
      return {
        'Nombre': c.nombre,
        'Razón Social': c.razon_social,
        'RFC': c.rfc,
        'Régimen Fiscal': c.regimen_fiscal,
        'C.P. Fiscal': c.codigo_postal_fiscal,
        'Días Crédito': c.dias_credito,
        'Límite Crédito': c.limite_credito,
        'Saldo Actual': credito?.saldo_actual || 0,
        'Utilización %': credito?.utilizacion_pct || 0,
        'Tipo Facturación': c.tipo_facturacion || 'corte',
        'Hrs Cortesía': c.horas_cortesia,
        'Cobra Pernocta': c.cobra_pernocta ? 'Sí' : 'No',
        'Tarifa Pernocta': c.pernocta_tarifa,
        'Días Máx Facturación': c.dias_max_facturacion,
        'Día Corte': c.dia_corte,
        'Día Pago': c.dia_pago,
        'Contacto Facturación': c.contacto_facturacion_nombre,
        'Email Facturación': c.contacto_facturacion_email,
        'Prioridad Cobranza': c.prioridad_cobranza,
        'Activo': c.activo ? 'Sí' : 'No',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `clientes_fiscales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getEstadoFiscal = (cliente: ClienteFiscal) => {
    const hasRFC = !!cliente.rfc;
    const hasRazonSocial = !!cliente.razon_social;
    const hasRegimen = !!cliente.regimen_fiscal;
    const hasCP = !!cliente.codigo_postal_fiscal;
    
    if (hasRFC && hasRazonSocial && hasRegimen && hasCP) {
      return { 
        status: 'completo', 
        icon: CheckCircle2, 
        badge: <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">Completo</Badge>
      };
    } else if (hasRFC || hasRazonSocial) {
      return { 
        status: 'parcial', 
        icon: AlertTriangle, 
        badge: <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0 text-[10px]">Incompleto</Badge>
      };
    }
    return { 
      status: 'pendiente', 
      icon: XCircle, 
      badge: <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-0 text-[10px]">Sin Datos</Badge>
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards with Filters */}
      <CreditoSummaryCards 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                Gestión de Clientes
              </CardTitle>
              {activeFilter !== 'todos' && (
                <Badge variant="secondary" className="text-xs">
                  Filtro: {activeFilter.replace('-', ' ')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente, RFC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={handleExport}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exportar
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Cliente</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead className="text-center">Días Créd</TableHead>
                  <TableHead className="text-center">Tipo Fact.</TableHead>
                  <TableHead className="text-center">Hrs Cortesía</TableHead>
                  <TableHead className="text-center">Pernocta</TableHead>
                  <TableHead className="w-[140px]">Utilización</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => {
                    const estado = getEstadoFiscal(cliente);
                    const credito = creditoMap.get(cliente.id);
                    const utilizacion = credito?.utilizacion_pct || 0;
                    const sobreLimite = credito?.sobre_limite;
                    
                    return (
                      <TableRow 
                        key={cliente.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => handleViewDetails(cliente)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[180px]">
                              {cliente.nombre}
                            </p>
                            {cliente.razon_social && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {cliente.razon_social}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {cliente.rfc || <span className="text-muted-foreground">-</span>}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {cliente.dias_credito || 30}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {cliente.tipo_facturacion === 'inmediata' ? 'Inmediata' : 'Corte'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {cliente.horas_cortesia != null ? (
                            <span className="text-sm font-medium">{cliente.horas_cortesia}h</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {cliente.cobra_pernocta ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">Sí</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cliente.limite_credito ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className={
                                  sobreLimite ? 'text-red-600 font-medium' :
                                  utilizacion > 70 ? 'text-amber-600' : 
                                  'text-muted-foreground'
                                }>
                                  {utilizacion}%
                                </span>
                                {sobreLimite && (
                                  <AlertTriangle className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                              <Progress 
                                value={Math.min(utilizacion, 100)} 
                                className={`h-1.5 ${
                                  sobreLimite ? '[&>div]:bg-red-500' :
                                  utilizacion > 70 ? '[&>div]:bg-amber-500' : ''
                                }`}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {estado.badge}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(cliente)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(cliente)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Mostrando {filteredClientes.length} de {clientes.length} clientes
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ClienteFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        cliente={selectedCliente}
      />

      {/* Detail Drawer */}
      <ClienteDetalleDrawer
        open={showDetalleDrawer}
        onOpenChange={setShowDetalleDrawer}
        cliente={selectedCliente}
        onEdit={() => {
          setShowDetalleDrawer(false);
          setShowEditModal(true);
        }}
      />
    </div>
  );
}
