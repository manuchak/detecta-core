import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CxPOperativoTab } from './CxPOperativo/CxPOperativoTab';
import { CxPProveedoresTab } from './CxPProveedores/CxPProveedoresTab';

type Segment = 'oca' | 'pe' | 'gastos';

export function EgresosTab() {
  const [segment, setSegment] = useState<Segment>('oca');

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
      </div>

      {/* Content */}
      {segment === 'oca' ? <CxPOperativoTab /> : <CxPProveedoresTab />}
    </div>
  );
}
