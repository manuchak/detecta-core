import { useState } from 'react';
import { useAllSIERCPInvitations } from '@/hooks/useSIERCPInvitations';
import type { SIERCPInvitationWithEvaluation } from '@/hooks/useSIERCPInvitations';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SIERCPStatusBadge } from './SIERCPStatusBadge';
import { 
  Copy, 
  ExternalLink,
  Eye, 
  RotateCcw, 
  XCircle,
  Mail,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import type { SIERCPInvitation } from '@/types/siercpInvitationTypes';
import { SIERCPReportDialog } from '@/components/recruitment/psychometrics/SIERCPReportDialog';
import type { EvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';

export function InvitationsTable() {
  const { invitations, isLoading, cancelInvitation, getInvitationUrl } = useAllSIERCPInvitations();
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<SIERCPInvitationWithEvaluation | null>(null);

  const handleCopyLink = (token: string) => {
    const url = getInvitationUrl(token);
    navigator.clipboard.writeText(url);
    toast({
      title: 'Enlace copiado',
      description: 'El enlace de evaluación ha sido copiado al portapapeles.',
    });
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvitation.mutateAsync(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getExpirationDisplay = (invitation: SIERCPInvitation) => {
    const expiresAt = new Date(invitation.expires_at);
    
    if (invitation.status === 'completed') {
      return (
        <Badge variant="outline" className="gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          Completada
        </Badge>
      );
    }
    
    if (isPast(expiresAt)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          Expirada
        </Badge>
      );
    }
    
    return (
      <span className="text-sm text-muted-foreground">
        {formatDistanceToNow(expiresAt, { locale: es, addSuffix: true })}
      </span>
    );
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidato</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Enviado</TableHead>
          <TableHead>Expira</TableHead>
          <TableHead className="text-center">Score</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
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
                <Badge 
                  variant="outline" 
                  className={
                    invitation.evaluacion.score_global >= 80 
                      ? 'text-green-600 border-green-500/30' 
                      : invitation.evaluacion.score_global >= 60 
                        ? 'text-yellow-600 border-yellow-500/30'
                        : 'text-red-600 border-red-500/30'
                  }
                >
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyLink(invitation.token)}
                      title="Copiar enlace"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancel(invitation.id)}
                      className="text-destructive hover:text-destructive"
                      title="Cancelar invitación"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {invitation.status === 'completed' && invitation.evaluacion && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedInvitation(invitation);
                      setReportOpen(true);
                    }}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      toast({
                        title: 'Reenviar invitación',
                        description: 'Para reenviar, crea una nueva invitación desde el perfil del candidato.',
                      });
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reenviar
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
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
