import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CxPOperativoTab } from './CxPOperativo/CxPOperativoTab';
import { CxPProveedoresTab } from './CxPProveedores/CxPProveedoresTab';
import AprobacionGastosPanel from './GastosExtraordinarios/AprobacionGastosPanel';

type Segment = 'oca' | 'pe' | 'gastos';

export function EgresosTab() {
  const [segment, setSegment] = useState<Segment>('oca');

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['gastos-pendientes-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Egresos — Cuentas por Pagar</h2>
          <p className="text-sm text-muted-foreground">
            Gestión consolidada de pagos internos (OCA) y proveedores externos (PE).
          </p>
        </div>
      </div>

      {/* Segment Control */}
      <div className="inline-flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
        <button
          onClick={() => setSegment('oca')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
            segment === 'oca'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          OCA — Internos
        </button>
        <button
          onClick={() => setSegment('pe')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
            segment === 'pe'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          PE — Proveedores Externos
        </button>
        <button
          onClick={() => setSegment('gastos')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
            segment === 'gastos'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Gastos Custodios
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 min-w-[20px] justify-center">
              {pendingCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Content */}
      {segment === 'oca' && <CxPOperativoTab />}
      {segment === 'pe' && <CxPProveedoresTab />}
      {segment === 'gastos' && <AprobacionGastosPanel />}
    </div>
  );
}
