import { useState } from 'react';
import { useCustodianInvitations } from '@/hooks/useCustodianInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Mail, 
  MailX, 
  MailCheck, 
  MailWarning,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { InvitationActionsDropdown } from './InvitationActionsDropdown';

type StatusFilter = 'all' | 'pending' | 'used' | 'expired' | 'bounced';
type DeliveryFilter = 'all' | 'sent' | 'delivered' | 'bounced' | 'not_sent';

export const CustodianInvitationsList = () => {
  const { invitations, batches, isLoading } = useCustodianInvitations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  const getTokenStatus = (invitation: { used_at: string | null; expires_at: string }) => {
    if (invitation.used_at) {
      return { label: 'Usado', variant: 'default' as const, icon: CheckCircle };
    }
    if (isPast(new Date(invitation.expires_at))) {
      return { label: 'Expirado', variant: 'destructive' as const, icon: XCircle };
    }
    return { label: 'Pendiente', variant: 'secondary' as const, icon: Clock };
  };

  const getDeliveryStatus = (invitation: { 
    email: string | null; 
    delivery_status: string | null;
    bounce_type: string | null;
  }) => {
    if (!invitation.email) {
      return { label: 'Sin email', variant: 'outline' as const, icon: MailWarning };
    }
    
    switch (invitation.delivery_status) {
      case 'delivered':
        return { label: 'Entregado', variant: 'default' as const, icon: MailCheck };
      case 'sent':
        return { label: 'Enviado', variant: 'secondary' as const, icon: Mail };
      case 'bounced':
        return { 
          label: invitation.bounce_type === 'hard' ? 'Bounce Hard' : 'Bounce Soft', 
          variant: 'destructive' as const, 
          icon: MailX 
        };
      case 'complained':
        return { label: 'Queja', variant: 'destructive' as const, icon: AlertTriangle };
      case 'opened':
        return { label: 'Abierto', variant: 'default' as const, icon: MailCheck };
      default:
        return { label: 'Pendiente', variant: 'outline' as const, icon: Clock };
    }
  };

  // Filter invitations
  const filteredInvitations = invitations?.filter(inv => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        inv.nombre?.toLowerCase().includes(search) ||
        inv.email?.toLowerCase().includes(search) ||
        inv.telefono?.includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'used' && !inv.used_at) return false;
      if (statusFilter === 'expired' && (!isPast(new Date(inv.expires_at)) || inv.used_at)) return false;
      if (statusFilter === 'pending' && (inv.used_at || isPast(new Date(inv.expires_at)))) return false;
      if (statusFilter === 'bounced' && inv.delivery_status !== 'bounced') return false;
    }

    // Delivery filter
    if (deliveryFilter !== 'all') {
      if (deliveryFilter === 'not_sent' && inv.email) return false;
      if (deliveryFilter !== 'not_sent' && inv.delivery_status !== deliveryFilter) return false;
    }

    // Batch filter
    if (batchFilter !== 'all' && inv.batch_id !== batchFilter) return false;

    return true;
  }) || [];

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
        <CardTitle>Historial de Invitaciones</CardTitle>
        <CardDescription>
          Links de invitación generados para custodios con tracking de entrega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="used">Usados</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={deliveryFilter} onValueChange={(v) => setDeliveryFilter(v as DeliveryFilter)}>
            <SelectTrigger className="w-[160px]">
              <Mail className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="delivered">Entregados</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="bounced">Rebotados</SelectItem>
              <SelectItem value="not_sent">Sin email</SelectItem>
            </SelectContent>
          </Select>

          {batches && batches.length > 0 && (
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los lotes</SelectItem>
                {batches.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {format(new Date(batch.created_at), 'dd MMM yyyy', { locale: es })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats summary */}
        {invitations && invitations.length > 0 && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {invitations.length}</span>
            <span>•</span>
            <span>Mostrando: {filteredInvitations.length}</span>
            {invitations.filter(i => i.delivery_status === 'bounced').length > 0 && (
              <>
                <span>•</span>
                <span className="text-destructive">
                  {invitations.filter(i => i.delivery_status === 'bounced').length} rebotados
                </span>
              </>
            )}
          </div>
        )}

        {/* Table */}
        {!filteredInvitations.length ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {invitations?.length ? 'No hay invitaciones que coincidan con los filtros.' : 'No hay invitaciones generadas aún.'}
          </p>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const tokenStatus = getTokenStatus(invitation);
                  const deliveryStatus = getDeliveryStatus(invitation);
                  const TokenIcon = tokenStatus.icon;
                  const DeliveryIcon = deliveryStatus.icon;
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.nombre || '-'}
                        {invitation.resent_count > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {invitation.resent_count}x reenviado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {invitation.email || (
                          <span className="text-muted-foreground italic">Sin email</span>
                        )}
                        {invitation.bounce_reason && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={invitation.bounce_reason}>
                            {invitation.bounce_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={deliveryStatus.variant} className="gap-1">
                          <DeliveryIcon className="h-3 w-3" />
                          {deliveryStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tokenStatus.variant} className="gap-1">
                          <TokenIcon className="h-3 w-3" />
                          {tokenStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <InvitationActionsDropdown invitation={invitation} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustodianInvitationsList;
