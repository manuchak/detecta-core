import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Gate {
  id: string;
  label: string;
  level: 'blocker' | 'warning' | 'info';
  passed: boolean;
  detail: string;
  tabTarget?: string;
}

interface Props {
  candidatoNombre: string;
  gates: Gate[];
  canRelease: boolean;
  isLiberating: boolean;
  hasLiberacionRecord: boolean;
  isAlreadyReleased: boolean;
  onRelease: () => void;
  onScrollToBlockers?: () => void;
}

function ProgressRing({ percentage, size = 88, strokeWidth = 6 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const color = percentage === 100 
    ? 'hsl(var(--success))' 
    : percentage >= 70 
      ? 'hsl(var(--warning))' 
      : 'hsl(var(--destructive))';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export function EvaluationHeroStatus({
  candidatoNombre,
  gates,
  canRelease,
  isLiberating,
  hasLiberacionRecord,
  isAlreadyReleased,
  onRelease,
  onScrollToBlockers,
}: Props) {
  const stats = useMemo(() => {
    const requiredGates = gates.filter(g => g.level !== 'info');
    const passed = requiredGates.filter(g => g.passed).length;
    const blockers = gates.filter(g => g.level === 'blocker' && !g.passed).length;
    const warnings = gates.filter(g => g.level === 'warning' && !g.passed).length;
    const percentage = requiredGates.length > 0 ? (passed / requiredGates.length) * 100 : 0;
    return { passed, total: requiredGates.length, blockers, warnings, percentage };
  }, [gates]);

  if (isAlreadyReleased) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5 p-5">
        <div className="h-14 w-14 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">Custodio liberado</p>
          <p className="text-sm text-muted-foreground truncate">{candidatoNombre} fue liberado a Planificación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-5">
        {/* Progress Ring */}
        <ProgressRing percentage={stats.percentage} />

        {/* Summary */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-base font-semibold text-foreground truncate">{candidatoNombre}</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{stats.passed}</span> de {stats.total} completados
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.blockers > 0 && (
              <Badge variant="destructive" className="gap-1 text-xs font-medium">
                <XCircle className="h-3 w-3" />
                {stats.blockers} bloqueo{stats.blockers !== 1 ? 's' : ''}
              </Badge>
            )}
            {stats.warnings > 0 && (
              <Badge className="gap-1 text-xs font-medium bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
                <AlertTriangle className="h-3 w-3" />
                {stats.warnings} advertencia{stats.warnings !== 1 ? 's' : ''}
              </Badge>
            )}
            {stats.blockers === 0 && stats.warnings === 0 && (
              <Badge className="gap-1 text-xs font-medium bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                <CheckCircle2 className="h-3 w-3" />
                Todo listo
              </Badge>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {canRelease ? (
            <Button
              size="lg"
              className="gap-2 rounded-xl bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-semibold px-6 h-12"
              onClick={onRelease}
              disabled={isLiberating}
            >
              {isLiberating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
              {isLiberating ? 'Liberando...' : 'Liberar'}
            </Button>
          ) : stats.blockers > 0 ? (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl font-semibold px-6 h-12"
              onClick={onScrollToBlockers}
            >
              Resolver {stats.blockers} bloqueo{stats.blockers !== 1 ? 's' : ''}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl font-semibold px-6 h-12"
              onClick={onScrollToBlockers}
            >
              {stats.warnings > 0 ? `${stats.warnings} advertencia${stats.warnings !== 1 ? 's' : ''}` : 'Revisar evaluación'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
