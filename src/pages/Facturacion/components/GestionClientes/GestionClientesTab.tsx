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
  XCircle
} from 'lucide-react';
import { useClientesFiscales, ClienteFiscal } from '../../hooks/useClientesFiscales';
import { ClienteFormModal } from './ClienteFormModal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatUtils';
import * as XLSX from 'xlsx';

export function GestionClientesTab() {
  const { data: clientes = [], isLoading, refetch } = useClientesFiscales();
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteFiscal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.rfc?.toLowerCase().includes(search.toLowerCase()) ||
      c.razon_social?.toLowerCase().includes(search.toLowerCase())
    );
  }, [clientes, search]);

  const handleEdit = (cliente: ClienteFiscal) => {
    setSelectedCliente(cliente);
    setShowEditModal(true);
  };

  const handleExport = () => {
    const exportData = clientes.map(c => ({
      'Nombre': c.nombre,
      'Razón Social': c.razon_social,
      'RFC': c.rfc,
      'Régimen Fiscal': c.regimen_fiscal,
      'C.P. Fiscal': c.codigo_postal_fiscal,
      'Días Crédito': c.dias_credito,
      'Límite Crédito': c.limite_credito,
      'Día Corte': c.dia_corte,
      'Día Pago': c.dia_pago,
      'Contacto Facturación': c.contacto_facturacion_nombre,
      'Email Facturación': c.contacto_facturacion_email,
      'Tel Facturación': c.contacto_facturacion_tel,
      'Prioridad Cobranza': c.prioridad_cobranza,
      'Activo': c.activo ? 'Sí' : 'No',
    }));

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
        color: 'text-emerald-600',
        badge: <Badge className="bg-emerald-500/10 text-emerald-700 border-0">Completo</Badge>
      };
    } else if (hasRFC || hasRazonSocial) {
      return { 
        status: 'parcial', 
        icon: AlertTriangle, 
        color: 'text-amber-600',
        badge: <Badge className="bg-amber-500/10 text-amber-700 border-0">Incompleto</Badge>
      };
    }
    return { 
      status: 'pendiente', 
      icon: XCircle, 
      color: 'text-red-600',
      badge: <Badge className="bg-red-500/10 text-red-700 border-0">Sin Datos</Badge>
    };
  };

  // Stats
  const stats = useMemo(() => {
    const total = clientes.length;
    const completos = clientes.filter(c => c.rfc && c.razon_social && c.regimen_fiscal && c.codigo_postal_fiscal).length;
    const parciales = clientes.filter(c => (c.rfc || c.razon_social) && !(c.rfc && c.razon_social && c.regimen_fiscal && c.codigo_postal_fiscal)).length;
    const sinDatos = total - completos - parciales;
    return { total, completos, parciales, sinDatos };
  }, [clientes]);

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
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Total Clientes</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-[10px] text-muted-foreground">Datos Completos</p>
              <p className="text-lg font-bold text-emerald-600">{stats.completos}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-[10px] text-muted-foreground">Incompletos</p>
              <p className="text-lg font-bold text-amber-600">{stats.parciales}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-[10px] text-muted-foreground">Sin Datos</p>
              <p className="text-lg font-bold text-red-600">{stats.sinDatos}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Gestión de Datos Fiscales
            </CardTitle>
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
                  <TableHead className="text-right">Límite</TableHead>
                  <TableHead className="text-center">Estado Fiscal</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => {
                    const estado = getEstadoFiscal(cliente);
                    return (
                      <TableRow key={cliente.id}>
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
                            {cliente.rfc || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {cliente.dias_credito || 30}
                        </TableCell>
                        <TableCell className="text-right">
                          {cliente.limite_credito 
                            ? formatCurrency(cliente.limite_credito) 
                            : <span className="text-muted-foreground">Sin límite</span>
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          {estado.badge}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
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
    </div>
  );
}
