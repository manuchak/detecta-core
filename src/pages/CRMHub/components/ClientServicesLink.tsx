import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCrmClientMatches, useSearchClients, useLinkDealToClient, useUnlinkDealFromClient } from '@/hooks/useCrmClientMatcher';
import { CRMHeroCard, type HealthStatus } from './CRMHeroCard';
import { Check, X, AlertCircle, Link2, Unlink, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientMatchResult } from '@/types/crm';
import { cn } from '@/lib/utils';

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(value);
}

function MatchStatusBadge({ status }: { status: ClientMatchResult['matchStatus'] }) {
  const config = {
    verified: { label: 'Verificado', icon: Check, className: 'bg-green-500/10 text-green-600 border-green-200' },
    'auto-match': { label: 'Auto-match', icon: Check, className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    pending: { label: 'Pendiente', icon: AlertCircle, className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    'no-match': { label: 'Sin match', icon: X, className: 'bg-red-500/10 text-red-600 border-red-200' },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

interface LinkDialogProps {
  match: ClientMatchResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LinkDialog({ match, open, onOpenChange }: LinkDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: searchResults, isLoading: searching } = useSearchClients(searchTerm);
  const linkMutation = useLinkDealToClient();

  const handleLink = async (clientName: string) => {
    if (!match) return;
    
    try {
      await linkMutation.mutateAsync({ dealId: match.dealId, clientName });
      toast.success('Cliente vinculado correctamente');
      onOpenChange(false);
      setSearchTerm('');
    } catch (error) {
      toast.error('Error al vincular cliente');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Cliente</DialogTitle>
          <DialogDescription>
            Busca y selecciona el cliente de servicios_custodia para vincular con "{match?.dealTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {searching && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {!searching && searchResults && searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleLink(name)}
                  disabled={linkMutation.isPending}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {name}
                </Button>
              ))}
            </div>
          )}

          {!searching && searchTerm.length >= 2 && (!searchResults || searchResults.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se encontraron clientes con "{searchTerm}"
            </p>
          )}

          {searchTerm.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientServicesLink() {
  const { data: matches, isLoading } = useCrmClientMatches();
  const unlinkMutation = useUnlinkDealFromClient();
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ClientMatchResult | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const filteredMatches = showOnlyPending
    ? (matches || []).filter(m => m.matchStatus === 'pending' || m.matchStatus === 'no-match')
    : matches || [];

  const handleUnlink = async (dealId: string) => {
    try {
      await unlinkMutation.mutateAsync(dealId);
      toast.success('Vinculación eliminada');
    } catch (error) {
      toast.error('Error al eliminar vinculación');
    }
  };

  const openLinkDialog = (match: ClientMatchResult) => {
    setSelectedMatch(match);
    setLinkDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Summary stats
  const stats = {
    total: matches?.length || 0,
    verified: matches?.filter(m => m.matchStatus === 'verified').length || 0,
    autoMatch: matches?.filter(m => m.matchStatus === 'auto-match').length || 0,
    pending: matches?.filter(m => m.matchStatus === 'pending' || m.matchStatus === 'no-match').length || 0,
  };

  // Calculate match rate
  const matchRate = stats.total > 0 ? ((stats.verified + stats.autoMatch) / stats.total) * 100 : 0;

  // Health based on pending items
  const health: HealthStatus = stats.pending === 0 ? 'healthy'
    : stats.pending <= 5 ? 'warning'
    : 'critical';

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <CRMHeroCard
        title="¿Tenemos los deals vinculados a clientes?"
        value={`${matchRate.toFixed(0)}% vinculados`}
        subtitle={`${stats.verified + stats.autoMatch} de ${stats.total} deals tienen cliente asignado`}
        health={health}
        progress={{
          value: matchRate,
          label: `${stats.pending} pendientes de vincular`,
        }}
        secondaryMetrics={[
          { label: 'Verificados', value: String(stats.verified) },
          { label: 'Auto-match', value: String(stats.autoMatch) },
          { label: 'Pendientes', value: String(stats.pending), highlight: stats.pending > 0 },
        ]}
        icon={<Users className="h-8 w-8 text-muted-foreground/20" />}
      />

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="pending-only"
          checked={showOnlyPending}
          onCheckedChange={setShowOnlyPending}
        />
        <Label htmlFor="pending-only" className="text-sm">
          Mostrar solo pendientes ({stats.pending})
        </Label>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vinculación Cliente → Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal / Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Deal Value</TableHead>
                <TableHead className="text-right">GMV Real</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {showOnlyPending ? 'No hay deals pendientes de vincular 🎉' : 'No hay deals disponibles'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatches.map((match) => (
                  <TableRow 
                    key={match.dealId}
                    className={cn(
                      (match.matchStatus === 'pending' || match.matchStatus === 'no-match') && 
                      'bg-amber-50/50'
                    )}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{match.dealTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {match.organizationName || 'Sin organización'}
                        </div>
                        {match.matchedClientName && (
                          <div className="text-xs text-primary font-medium">
                            → {match.matchedClientName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <MatchStatusBadge status={match.matchStatus} />
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(match.dealValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {match.gmvReal !== null ? (
                        <span className="font-medium text-green-600 text-sm">
                          {formatCurrency(match.gmvReal)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {match.matchStatus !== 'no-match' && match.matchedClientName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlink(match.dealId)}
                            disabled={unlinkMutation.isPending}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant={match.matchStatus === 'pending' || match.matchStatus === 'no-match' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => openLinkDialog(match)}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Vincular
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Link Dialog */}
      <LinkDialog
        match={selectedMatch}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />
    </div>
  );
}
