import { cn } from '@/lib/utils';
import type { FinanceOverviewData } from '../../hooks/useFinanceOverview';

interface Props {
  pipeline: FinanceOverviewData['pipeline'];
}

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

const stages = [
  { key: 'borrador', label: 'Borrador', color: 'bg-muted-foreground/60' },
  { key: 'revision_ops', label: 'Rev. Ops', color: 'bg-amber-500' },
  { key: 'aprobado_finanzas', label: 'Aprobado', color: 'bg-primary' },
  { key: 'dispersado', label: 'Dispersado', color: 'bg-emerald-500' },
  { key: 'pagado', label: 'Pagado', color: 'bg-emerald-700' },
] as const;

export function CxPPipelineChart({ pipeline }: Props) {
  const total = Object.values(pipeline).reduce((s, v) => s + v.count, 0);

  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Pipeline CxP</h3>
        <span className="text-xs text-muted-foreground">{total} cortes</span>
      </div>

      {/* Horizontal funnel bar */}
      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
          {stages.map((stage) => {
            const val = pipeline[stage.key as keyof typeof pipeline];
            const width = (val.count / total) * 100;
            if (width === 0) return null;
            return (
              <div
                key={stage.key}
                className={cn('h-full transition-all', stage.color)}
                style={{ width: `${width}%` }}
                title={`${stage.label}: ${val.count}`}
              />
            );
          })}
        </div>
      )}

      {/* Stage detail */}
      <div className="grid grid-cols-5 gap-1">
        {stages.map((stage) => {
          const val = pipeline[stage.key as keyof typeof pipeline];
          return (
            <div key={stage.key} className="text-center space-y-0.5">
              <div className={cn('h-1.5 w-1.5 rounded-full mx-auto', stage.color)} />
              <p className="text-[10px] text-muted-foreground truncate">{stage.label}</p>
              <p className="text-sm font-bold">{val.count}</p>
              <p className="text-[10px] text-muted-foreground">{fmt(val.monto)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
