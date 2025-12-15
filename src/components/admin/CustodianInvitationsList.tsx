import { useCustodianInvitations } from '@/hooks/useCustodianInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Copy, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

export const CustodianInvitationsList = () => {
  const { invitations, isLoading, getInvitationLink } = useCustodianInvitations();
  const { toast } = useToast();

  const handleCopy = async (token: string) => {
    try {
      const link = getInvitationLink(token);
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado',
        description: 'El link ha sido copiado al portapapeles.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el link.',
        variant: 'destructive',
      });
    }
  };

  const getStatus = (invitation: { used_at: string | null; expires_at: string }) => {
    if (invitation.used_at) {
      return { label: 'Usado', variant: 'default' as const, icon: CheckCircle };
    }
    if (isPast(new Date(invitation.expires_at))) {
      return { label: 'Expirado', variant: 'destructive' as const, icon: XCircle };
    }
    return { label: 'Pendiente', variant: 'secondary' as const, icon: Clock };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitaciones Enviadas</CardTitle>
        <CardDescription>
          Historial de links de invitación generados para custodios
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!invitations?.length ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay invitaciones generadas aún.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const status = getStatus(invitation);
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.nombre || '-'}
                    </TableCell>
                    <TableCell>{invitation.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invitation.expires_at), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {!invitation.used_at && !isPast(new Date(invitation.expires_at)) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(invitation.token)}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CustodianInvitationsList;
