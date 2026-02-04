import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Phone, 
  Eye, 
  AlertTriangle,
  ArrowUpDown,
  CreditCard,
  FileText
} from 'lucide-react';
import { AgingData, getAgingColor } from '../../hooks/useCuentasPorCobrar';
import { formatCurrency } from '@/utils/formatUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface AgingTableProps {
  data: AgingData[];
  isLoading?: boolean;
  onViewClient?: (cliente: AgingData) => void;
  onCobranza?: (cliente: AgingData) => void;
}

export function AgingTable({ data, isLoading, onViewClient, onCobranza }: AgingTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof AgingData>('saldo_pendiente');
  const [sortDesc, setSortDesc] = useState(true);

  const filteredData = data.filter(d => 
    d.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    d.cliente_rfc?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDesc ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  const toggleSort = (field: keyof AgingData) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const getPrioridadBadge = (prioridad: string | null) => {
    switch (prioridad) {
      case 'alta':
        return <Badge variant="destructive" className="text-[10px]">Alta</Badge>;
      case 'baja':
        return <Badge variant="secondary" className="text-[10px]">Baja</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Normal</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o RFC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {sortedData.length} clientes
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Cliente</TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/80" onClick={() => toggleSort('saldo_pendiente')}>
                <div className="flex items-center justify-end gap-1">
                  Saldo <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/80" onClick={() => toggleSort('vigente')}>
                <div className="flex items-center justify-end gap-1">
                  Vigente <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">1-30d</TableHead>
              <TableHead className="text-right">31-60d</TableHead>
              <TableHead className="text-right">61-90d</TableHead>
              <TableHead className="text-right">&gt;90d</TableHead>
              <TableHead className="text-center">Prioridad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay cuentas por cobrar registradas
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((cliente) => {
                const hasVencidoCritico = (cliente.vencido_61_90 || 0) > 0 || (cliente.vencido_90_mas || 0) > 0;
                
                return (
                  <TableRow 
                    key={cliente.cliente_id}
                    className={hasVencidoCritico ? 'bg-red-50/50 dark:bg-red-950/20' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasVencidoCritico && (
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm truncate max-w-[180px]">
                            {cliente.cliente_nombre}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {cliente.cliente_rfc || 'Sin RFC'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {formatCurrency(cliente.saldo_pendiente || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm px-1.5 py-0.5 rounded ${getAgingColor(0)}`}>
                        {formatCurrency(cliente.vigente || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm px-1.5 py-0.5 rounded ${cliente.vencido_1_30 ? getAgingColor(15) : ''}`}>
                        {cliente.vencido_1_30 ? formatCurrency(cliente.vencido_1_30) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm px-1.5 py-0.5 rounded ${cliente.vencido_31_60 ? getAgingColor(45) : ''}`}>
                        {cliente.vencido_31_60 ? formatCurrency(cliente.vencido_31_60) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm px-1.5 py-0.5 rounded ${cliente.vencido_61_90 ? getAgingColor(75) : ''}`}>
                        {cliente.vencido_61_90 ? formatCurrency(cliente.vencido_61_90) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm px-1.5 py-0.5 rounded ${cliente.vencido_90_mas ? getAgingColor(100) : ''}`}>
                        {cliente.vencido_90_mas ? formatCurrency(cliente.vencido_90_mas) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getPrioridadBadge(cliente.prioridad_cobranza)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => onViewClient?.(cliente)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => onCobranza?.(cliente)}
                        >
                          <Phone className="h-3.5 w-3.5" />
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
    </div>
  );
}
