import React, { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServiceTimesReport, type ServiceTimeRow } from '@/hooks/useServiceTimesReport';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Search, CalendarDays, ArrowUpDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Props {
  onSelectService: (row: ServiceTimeRow) => void;
  defaultDateFrom?: string;
  defaultDateTo?: string;
}

const fmtTime = (iso: string | null) => {
  if (!iso) return '—';
  return format(new Date(iso), 'HH:mm', { locale: es });
};

const fmtDur = (seconds: number) => {
  if (seconds === 0) return '—';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const fmtDelta = (min: number | null) => {
  if (min === null) return '—';
  return `${min}`;
};

export const ServiceTimesTable: React.FC<Props> = ({ onSelectService, defaultDateFrom, defaultDateTo }) => {
  const today = defaultDateTo ?? format(new Date(), 'yyyy-MM-dd');
  const weekAgo = defaultDateFrom ?? format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);
  const [clienteFilter, setClienteFilter] = useState('');
  const [custodioFilter, setCustodioFilter] = useState('');
  const [folioFilter, setFolioFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useServiceTimesReport({
    dateFrom,
    dateTo,
    cliente: clienteFilter || undefined,
    custodio: custodioFilter || undefined,
    folio: folioFilter || undefined,
  });

  const rows = data || [];

  const columns: ColumnDef<ServiceTimeRow>[] = useMemo(() => [
    {
      accessorKey: 'folio',
      header: 'Folio',
      cell: ({ row }) => (
        <button
          onClick={() => onSelectService(row.original)}
          className="text-primary underline-offset-2 hover:underline font-medium text-xs"
        >
          {row.original.folio}
        </button>
      ),
      size: 100,
    },
    { accessorKey: 'cliente', header: 'Cliente', size: 120 },
    { accessorKey: 'custodio', header: 'Custodio', size: 120 },
    {
      accessorKey: 'citaPlaneacion',
      header: 'Cita',
      cell: ({ getValue }) => fmtTime(getValue() as string | null),
      size: 60,
    },
    {
      accessorKey: 'inicioMonitoreo',
      header: 'Inicio',
      cell: ({ getValue }) => fmtTime(getValue() as string | null),
      size: 60,
    },
    {
      accessorKey: 'combustible',
      header: '⛽',
      cell: ({ getValue }) => fmtDur(getValue() as number),
      size: 50,
    },
    {
      accessorKey: 'baño',
      header: '🚻',
      cell: ({ getValue }) => fmtDur(getValue() as number),
      size: 50,
    },
    {
      accessorKey: 'descanso',
      header: '☕',
      cell: ({ getValue }) => fmtDur(getValue() as number),
      size: 50,
    },
    {
      accessorKey: 'pernocta',
      header: '🛏️',
      cell: ({ getValue }) => fmtDur(getValue() as number),
      size: 50,
    },
    {
      accessorKey: 'trafico',
      header: '🚧',
      cell: ({ getValue }) => fmtDur(getValue() as number),
      size: 50,
    },
    {
      accessorKey: 'incidencia',
      header: '⚠️',
      cell: ({ getValue }) => fmtDur(getValue() as number),
      size: 50,
    },
    {
      accessorKey: 'llegadaDestino',
      header: 'Destino',
      cell: ({ getValue }) => fmtTime(getValue() as string | null),
      size: 60,
    },
    {
      accessorKey: 'liberacion',
      header: 'Liberación',
      cell: ({ getValue }) => fmtTime(getValue() as string | null),
      size: 70,
    },
    {
      accessorKey: 'deltaOrigen',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs" onClick={() => column.toggleSorting()}>
          ΔOrigen <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <span className={v !== null && v > 30 ? 'text-destructive font-bold' : ''}>
            {fmtDelta(v)}
          </span>
        );
      },
      size: 65,
    },
    {
      accessorKey: 'deltaDestino',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs" onClick={() => column.toggleSorting()}>
          ΔDestino <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <span className={v !== null && v > 30 ? 'text-destructive font-bold' : ''}>
            {fmtDelta(v)}
          </span>
        );
      },
      size: 65,
    },
    {
      accessorKey: 'deltaTotal',
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs" onClick={() => column.toggleSorting()}>
          ΔTotal <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return (
          <span className={v !== null && v > 60 ? 'text-destructive font-bold' : 'font-semibold'}>
            {fmtDelta(v)}
          </span>
        );
      },
      size: 60,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => onSelectService(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
      size: 40,
    },
  ], [onSelectService]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      rows.map(r => ({
        Folio: r.folio,
        Cliente: r.cliente,
        Custodio: r.custodio,
        Cita: r.citaPlaneacion ? format(new Date(r.citaPlaneacion), 'dd/MM/yyyy HH:mm') : '',
        Inicio: r.inicioMonitoreo ? format(new Date(r.inicioMonitoreo), 'HH:mm') : '',
        'Combustible (min)': Math.round(r.combustible / 60),
        'Baño (min)': Math.round(r.baño / 60),
        'Descanso (min)': Math.round(r.descanso / 60),
        'Pernocta (min)': Math.round(r.pernocta / 60),
        'Incidencia (min)': Math.round(r.incidencia / 60),
        'Llegada Destino': r.llegadaDestino ? format(new Date(r.llegadaDestino), 'HH:mm') : '',
        'Liberación': r.liberacion ? format(new Date(r.liberacion), 'HH:mm') : '',
        'ΔOrigen (min)': r.deltaOrigen ?? '',
        'ΔDestino (min)': r.deltaDestino ?? '',
        'ΔTotal (min)': r.deltaTotal ?? '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tiempos');
    XLSX.writeFile(wb, `tiempos-servicio-${dateFrom}-${dateTo}.xlsx`);
    toast.success('Excel exportado');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Evolución de Tiempos de Servicio
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport}>
            <Download className="h-3 w-3" /> Exportar Excel
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">a</span>
          <Input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Filtrar cliente..."
              value={clienteFilter}
              onChange={e => setClienteFilter(e.target.value)}
              className="pl-7 w-44 h-8 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {rows.length} servicios
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(var(--content-height-with-tabs,calc(100vh-200px))-100px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => (
                    <TableHead key={h.id} className="text-xs py-2 px-2 whitespace-nowrap">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j} className="py-2 px-2">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground text-sm">
                    No hay servicios en el rango seleccionado
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => onSelectService(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="text-xs py-1.5 px-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
