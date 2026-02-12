import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, FileText, FileX } from 'lucide-react';
import type { SIERCPInvitationStatus } from '@/types/siercpInvitationTypes';

export type StatusFilter = SIERCPInvitationStatus | 'all';
export type DateFilter = 'all' | 'today' | '7days' | '30days';
export type ReportFilter = 'all' | 'with_report' | 'without_report';

interface InvitationsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  dateFilter: DateFilter;
  onDateChange: (value: DateFilter) => void;
  reportFilter: ReportFilter;
  onReportChange: (value: ReportFilter) => void;
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'completed', label: 'Completada' },
  { value: 'sent', label: 'Enviada' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'opened', label: 'Abierta' },
  { value: 'started', label: 'Iniciada' },
  { value: 'expired', label: 'Expirada' },
  { value: 'cancelled', label: 'Cancelada' },
];

export function InvitationsFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  reportFilter,
  onReportChange,
  totalCount,
  filteredCount,
  onClearFilters,
  hasActiveFilters,
}: InvitationsFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search + Date + Report filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={dateFilter} onValueChange={(v) => onDateChange(v as DateFilter)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Fecha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el tiempo</SelectItem>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="7days">Últimos 7 días</SelectItem>
            <SelectItem value="30days">Últimos 30 días</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reportFilter} onValueChange={(v) => onReportChange(v as ReportFilter)}>
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue placeholder="Informe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los informes</SelectItem>
            <SelectItem value="with_report">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Con informe
              </span>
            </SelectItem>
            <SelectItem value="without_report">
              <span className="flex items-center gap-1.5">
                <FileX className="h-3.5 w-3.5" /> Sin informe
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={statusFilter === opt.value ? 'default' : 'outline'}
            className="cursor-pointer select-none transition-colors hover:bg-accent"
            onClick={() => onStatusChange(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          Mostrando {filteredCount} de {totalCount} invitaciones
        </p>
      )}
    </div>
  );
}
