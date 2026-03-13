import { useState } from 'react';
import { cn } from '@/lib/utils';
import { InventarioGadgetsPanel } from './InventarioGadgetsPanel';
import { RentasGadgetsPanel } from './RentasGadgetsPanel';
import { GadgetsPnLPanel } from './GadgetsPnLPanel';

type Segment = 'inventario' | 'rentas' | 'pnl';

export function GadgetsTab() {
  const [segment, setSegment] = useState<Segment>('pnl');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Gadgets — Inventario, Rentas & P&L</h2>
        <p className="text-sm text-muted-foreground">
          Control de candados y GPS: inventario, costos de renta y margen vs lo cobrado a clientes.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
        {([
          { key: 'pnl', label: 'P&L' },
          { key: 'inventario', label: 'Inventario' },
          { key: 'rentas', label: 'Rentas Mensuales' },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
              segment === s.key
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {segment === 'pnl' && <GadgetsPnLPanel />}
      {segment === 'inventario' && <InventarioGadgetsPanel />}
      {segment === 'rentas' && <RentasGadgetsPanel />}
    </div>
  );
}
