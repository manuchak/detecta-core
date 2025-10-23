import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { ProveedorPagoRecord } from '@/hooks/useProveedoresPagos';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PagosDataTableProps {
  servicios: ProveedorPagoRecord[];
  loading?: boolean;
  onRegistrarPago: (servicio: ProveedorPagoRecord) => void;
  onVerDetalle: (servicio: ProveedorPagoRecord) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function PagosDataTable({
  servicios,
  loading,
  onRegistrarPago,
  onVerDetalle,
  selectedIds,
  onSelectionChange,
}: PagosDataTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
    }).format(amount);
  };

  const getEstadoPagoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <Badge variant="default" className="bg-success text-success-foreground">Pagado</Badge>;
      case 'en_proceso':
        return <Badge variant="default" className="bg-warning text-warning-foreground">En Proceso</Badge>;
      case 'pendiente':
        return <Badge variant="default" className="bg-destructive text-destructive-foreground">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const columns: ColumnDef<ProveedorPagoRecord>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            if (value) {
              const pendingIds = servicios
                .filter(s => s.estado_pago === 'pendiente')
                .map(s => s.id);
              onSelectionChange(pendingIds);
            } else {
              onSelectionChange([]);
            }
          }}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => {
        const servicio = row.original;
        const canSelect = servicio.estado_pago === 'pendiente';
        return (
          <Checkbox
            checked={selectedIds.includes(servicio.id)}
            disabled={!canSelect}
            onCheckedChange={(value) => {
              if (value) {
                onSelectionChange([...selectedIds, servicio.id]);
              } else {
                onSelectionChange(selectedIds.filter(id => id !== servicio.id));
              }
            }}
            aria-label="Seleccionar fila"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'servicio_id',
      header: 'ID Servicio',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.servicio_id}</span>
      ),
    },
    {
      accessorKey: 'fecha_servicio',
      header: 'Fecha',
      cell: ({ row }) => {
        const fecha = new Date(row.original.fecha_servicio);
        return format(fecha, 'dd/MMM/yy', { locale: es });
      },
    },
    {
      accessorKey: 'proveedor_nombre',
      header: 'Proveedor',
    },
    {
      accessorKey: 'armado_nombre',
      header: 'Armado',
    },
    {
      accessorKey: 'tarifa_acordada',
      header: 'Tarifa',
      cell: ({ row }) => formatCurrency(row.original.tarifa_acordada, row.original.moneda),
    },
    {
      accessorKey: 'estado_pago',
      header: 'Estado',
      cell: ({ row }) => getEstadoPagoBadge(row.original.estado_pago),
    },
    {
      accessorKey: 'fecha_pago',
      header: 'Fecha Pago',
      cell: ({ row }) => {
        if (!row.original.fecha_pago) return <span className="text-muted-foreground">—</span>;
        return format(new Date(row.original.fecha_pago), 'dd/MMM/yy', { locale: es });
      },
    },
    {
      accessorKey: 'metodo_pago',
      header: 'Método',
      cell: ({ row }) => {
        const metodo = row.original.metodo_pago;
        if (!metodo) return <span className="text-muted-foreground">—</span>;
        return <span className="capitalize">{metodo}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const servicio = row.original;
        return (
          <div className="flex items-center gap-2">
            {servicio.estado_pago === 'pendiente' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onRegistrarPago(servicio)}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Registrar Pago
              </Button>
            )}
            {servicio.estado_pago === 'pagado' && servicio.numero_factura && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVerDetalle(servicio)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Ver Comprobante
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onVerDetalle(servicio)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={servicios} loading={loading} />;
}
