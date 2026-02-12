import { useState, useMemo } from 'react';
import { useAllSIERCPInvitations } from '@/hooks/useSIERCPInvitations';
import type { SIERCPInvitationWithEvaluation } from '@/hooks/useSIERCPInvitations';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SIERCPStatusBadge } from './SIERCPStatusBadge';
import { InvitationsFilters, type StatusFilter, type DateFilter, type ReportFilter } from './InvitationsFilters';
import { 
  Copy, ExternalLink, Eye, RotateCcw, XCircle, Mail, Clock, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import type { SIERCPInvitation } from '@/types/siercpInvitationTypes';
import { SIERCPReportDialog } from '@/components/recruitment/psychometrics/SIERCPReportDialog';
import type { EvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { useDebounce } from '@/hooks/useDebounce';

type SortField = 'score' | 'date' | null;
type SortDir = 'asc' | 'desc';

export function InvitationsTable() {
  const { invitations, isLoading, cancelInvitation, getInvitationUrl } = useAllSIERCPInvitations();
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<SIERCPInvitationWithEvaluation | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const debouncedSearch = useDebounce(searchTerm, 250);

  const hasActiveFilters = debouncedSearch !== '' || statusFilter !== 'all' || dateFilter !== 'all' || reportFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setReportFilter('all');
    setSortField(null);
  };

  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];
    
    let result = [...invitations];

    // Search
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(i =>
        i.lead_nombre?.toLowerCase().includes(term) ||
        i.lead_email?.toLowerCase().includes(term)
      );
    }

    // Status
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }

    // Date
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = dateFilter === 'today' ? startOfDay(now)
        : dateFilter === '7days' ? subDays(now, 7)
        : subDays(now, 30);
      result = result.filter(i => i.created_at && new Date(i.created_at) >= cutoff);
    }

    // Report
    if (reportFilter === 'with_report') {
      result = result.filter(i => i.evaluacion?.ai_report);
    } else if (reportFilter === 'without_report') {
      result = result.filter(i => !i.evaluacion?.ai_report);
    }

    // Sort
    if (sortField === 'score') {
      result.sort((a, b) => {
        const sa = a.evaluacion?.score_global ?? -1;
        const sb = b.evaluacion?.score_global ?? -1;
        return sortDir === 'asc' ? sa - sb : sb - sa;
      });
    } else if (sortField === 'date') {
      result.sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sortDir === 'asc' ? da - db : db - da;
      });
    }

    return result;
  }, [invitations, debouncedSearch, statusFilter, dateFilter, reportFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const handleCopyLink = (token: string) => {
    const url = getInvitationUrl(token);
    navigator.clipboard.writeText(url);
    toast({ title: 'Enlace copiado', description: 'El enlace de evaluación ha sido copiado al portapapeles.' });
  };

  const handleCancel = async (id: string) => {
    try { await cancelInvitation.mutateAsync(id); } catch {}
  };

  const getExpirationDisplay = (invitation: SIERCPInvitation) => {
    const expiresAt = new Date(invitation.expires_at);
    if (invitation.status === 'completed') {
      return (
        <Badge variant="outline" className="gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" /> Completada
        </Badge>
      );
    }
    if (isPast(expiresAt)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" /> Expirada
        </Badge>
      );
    }
    return (
      <span className="text-sm text-muted-foreground">
        {formatDistanceToNow(expiresAt, { locale: es, addSuffix: true })}
      </span>
    );
  };

  const getScoreClasses = (score: number) => {
    if (score >= 70) return 'text-green-700 bg-green-500/15 border-green-500/30 font-semibold';
    if (score >= 50) return 'text-amber-700 bg-amber-500/15 border-amber-500/30 font-semibold';
    return 'text-red-700 bg-red-500/15 border-red-500/30 font-semibold';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay invitaciones enviadas aún</p>
        <p className="text-sm">Las invitaciones se crean desde el perfil de cada candidato</p>
      </div>
    );
  }

  return (
    <>
      <InvitationsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        reportFilter={reportFilter}
        onReportChange={setReportFilter}
        totalCount={invitations.length}
        filteredCount={filteredInvitations.length}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Candidato</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('date')}
            >
              <span className="inline-flex items-center">
                Enviado <SortIcon field="date" />
              </span>
            </TableHead>
            <TableHead>Expira</TableHead>
            <TableHead
              className="text-center cursor-pointer select-none"
              onClick={() => toggleSort('score')}
            >
              <span className="inline-flex items-center justify-center">
                Score <SortIcon field="score" />
              </span>
            </TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No se encontraron invitaciones con los filtros seleccionados
              </TableCell>
            </TableRow>
          ) : (
            filteredInvitations.map((invitation) => (
              <TableRow key={invitation.id} className="hover:bg-muted/60">
                <TableCell>
                  <div>
                    <p className="font-medium">{invitation.lead_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.lead_email || invitation.lead_telefono || 'Sin contacto'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <SIERCPStatusBadge status={invitation.status} />
                </TableCell>
                <TableCell>
                  {invitation.sent_at ? (
                    <div>
                      <p className="text-sm">
                        {format(new Date(invitation.sent_at), "dd MMM", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        vía {invitation.sent_via || 'manual'}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No enviado</span>
                  )}
                </TableCell>
                <TableCell>
                  {getExpirationDisplay(invitation)}
                </TableCell>
                <TableCell className="text-center">
                  {invitation.evaluacion?.score_global !== undefined ? (
                    <Badge variant="outline" className={getScoreClasses(invitation.evaluacion.score_global)}>
                      {invitation.evaluacion.score_global}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {['pending', 'sent', 'opened', 'started'].includes(invitation.status) && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyLink(invitation.token)} title="Copiar enlace">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleCancel(invitation.id)} className="text-destructive hover:text-destructive" title="Cancelar invitación">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {invitation.status === 'completed' && invitation.evaluacion && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedInvitation(invitation); setReportOpen(true); }}
                        title={invitation.evaluacion.ai_report ? 'Ver informe guardado' : 'Generar informe'}
                      >
                        {invitation.evaluacion.ai_report ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {invitation.status === 'expired' && (
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => {
                        toast({ title: 'Reenviar invitación', description: 'Para reenviar, crea una nueva invitación desde el perfil del candidato.' });
                      }}>
                        <RotateCcw className="h-4 w-4" /> Reenviar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedInvitation?.evaluacion && (
        <SIERCPReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          evaluation={selectedInvitation.evaluacion as unknown as EvaluacionPsicometrica}
          candidateName={selectedInvitation.lead_nombre}
        />
      )}
    </>
  );
}
