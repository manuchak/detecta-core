import { useNavigate, useLocation } from 'react-router-dom';
import { useSupplyPipelineCounts } from '@/hooks/useSupplyPipelineCounts';
import { useSupplyPipelineAlerts } from '@/hooks/useSupplyPipelineAlerts';
import { cn } from '@/lib/utils';
import { CheckCircle2, ClipboardCheck, Rocket, Users, ChevronRight, Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const steps = [
  { key: 'candidatos', label: 'Candidatos', path: '/leads', icon: UserPlus },
  { key: 'aprobaciones', label: 'Aprobaciones', path: '/leads/approvals', icon: CheckCircle2 },
  { key: 'evaluaciones', label: 'Evaluaciones', path: '/leads/evaluaciones', icon: ClipboardCheck },
  { key: 'liberacion', label: 'Liberación', path: '/leads/liberacion', icon: Rocket },
  { key: 'operativos', label: 'Operativos', path: null, icon: Users },
] as const;

const alertColorMap = {
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
  red: 'text-destructive',
} as const;

const alertBgMap = {
  yellow: 'bg-yellow-500/15',
  orange: 'bg-orange-500/15',
  red: 'bg-destructive/15',
} as const;

type AlertKey = 'evaluaciones' | 'liberacion';

function getWorstLevel(counts: { yellow: number; orange: number; red: number }) {
  if (counts.red > 0) return 'red' as const;
  if (counts.orange > 0) return 'orange' as const;
  if (counts.yellow > 0) return 'yellow' as const;
  return null;
}

export function SupplyPipelineBreadcrumb() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: counts, isLoading } = useSupplyPipelineCounts();
  const { data: alertsSummary } = useSupplyPipelineAlerts();

  const getCount = (key: typeof steps[number]['key']): string => {
    if (isLoading || !counts) return '–';
    const val = counts[key];
    return val !== null ? val.toLocaleString() : '–';
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  const getAlertInfo = (key: string) => {
    if (!alertsSummary || !['evaluaciones', 'liberacion'].includes(key)) return null;
    const stageAlerts = alertsSummary[key as AlertKey];
    if (!stageAlerts || stageAlerts.total === 0) return null;
    const worst = getWorstLevel(stageAlerts);
    if (!worst) return null;
    return { total: stageAlerts.total, level: worst, ...stageAlerts };
  };

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {steps.map((step, i) => {
          const active = isActive(step.path);
          const clickable = !!step.path;
          const Icon = step.icon;
          const alertInfo = getAlertInfo(step.key);

          return (
            <div key={step.key} className="flex items-center shrink-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => step.path && navigate(step.path)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : clickable
                      ? 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
                      : 'bg-muted/40 text-muted-foreground cursor-default'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{step.label}</span>
                <span className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-foreground'
                )}>
                  {isLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : getCount(step.key)}
                </span>

                {/* Alert badge */}
                {alertInfo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                        alertBgMap[alertInfo.level],
                        alertColorMap[alertInfo.level],
                      )}>
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {alertInfo.total}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <div className="space-y-0.5">
                        {alertInfo.red > 0 && <div className="text-destructive">🔴 {alertInfo.red} con +30 días sin avance</div>}
                        {alertInfo.orange > 0 && <div className="text-orange-500">🟠 {alertInfo.orange} con +15 días</div>}
                        {alertInfo.yellow > 0 && <div className="text-yellow-500">🟡 {alertInfo.yellow} con +7 días</div>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </button>
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
