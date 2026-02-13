import { useState } from 'react';
import { useCSClientesConQuejas } from '@/hooks/useCSHealthScores';
import { useCSLoyaltyFunnel } from '@/hooks/useCSLoyaltyFunnel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle } from 'lucide-react';
import { CSLoyaltyBadge } from './CSLoyaltyBadge';
import { CSClienteProfileModal } from './CSClienteProfileModal';

const RIESGO_COLORS: Record<string, string> = {
  bajo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medio: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  alto: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critico: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function CSClientesList() {
  const { data: clientes, isLoading } = useCSClientesConQuejas();
  const { data: loyalty } = useCSLoyaltyFunnel();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  const sorted = [...(clientes || [])].sort((a, b) => {
    const riesgoOrder = { critico: 0, alto: 1, medio: 2, bajo: 3 };
    return (riesgoOrder[a.riesgo as keyof typeof riesgoOrder] ?? 4) - (riesgoOrder[b.riesgo as keyof typeof riesgoOrder] ?? 4);
  });

  const enRiesgo = sorted.filter(c => c.riesgo === 'alto' || c.riesgo === 'critico').length;

  return (
    <div className="space-y-4 mt-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {sorted.length} clientes activos</span>
        {enRiesgo > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-4 w-4" /> {enRiesgo} en riesgo
          </span>
        )}
      </div>

      {/* Client list */}
      <div className="space-y-2">
        {sorted.map(c => {
          const clientLoyalty = loyalty?.clients.find(lc => lc.id === c.id);
          return (
            <Card
              key={c.id}
              className="hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => setSelectedClienteId(c.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.nombre_comercial}</p>
                      {clientLoyalty && <CSLoyaltyBadge stage={clientLoyalty.stage} />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{c.total_quejas} quejas totales</span>
                      {c.quejas_abiertas > 0 && (
                        <span className="text-destructive font-medium">{c.quejas_abiertas} abiertas</span>
                      )}
                      <span>CSAT: {c.csat ? c.csat.toFixed(1) : '—'}</span>
                      <span>
                        {c.diasSinContacto < 999
                          ? `Último contacto: hace ${c.diasSinContacto}d`
                          : 'Sin contacto registrado'}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={RIESGO_COLORS[c.riesgo] || ''}>
                    Riesgo {c.riesgo}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CSClienteProfileModal
        clienteId={selectedClienteId}
        onClose={() => setSelectedClienteId(null)}
      />
    </div>
  );
}
