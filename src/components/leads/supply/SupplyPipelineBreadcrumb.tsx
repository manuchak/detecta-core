import { useNavigate, useLocation } from 'react-router-dom';
import { useSupplyPipelineCounts } from '@/hooks/useSupplyPipelineCounts';
import { cn } from '@/lib/utils';
import { CheckCircle2, ClipboardCheck, Rocket, Users, ChevronRight, Loader2 } from 'lucide-react';

const steps = [
  { key: 'aprobaciones', label: 'Aprobaciones', path: '/leads/approvals', icon: CheckCircle2 },
  { key: 'evaluaciones', label: 'Evaluaciones', path: '/leads/evaluaciones', icon: ClipboardCheck },
  { key: 'liberacion', label: 'Liberación', path: '/leads/liberacion', icon: Rocket },
  { key: 'operativos', label: 'Operativos', path: null, icon: Users },
] as const;

export function SupplyPipelineBreadcrumb() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: counts, isLoading } = useSupplyPipelineCounts();

  const getCount = (key: typeof steps[number]['key']): string => {
    if (isLoading || !counts) return '–';
    const val = counts[key];
    return val !== null ? val.toLocaleString() : '–';
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {steps.map((step, i) => {
        const active = isActive(step.path);
        const clickable = !!step.path;
        const Icon = step.icon;

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
            </button>
          </div>
        );
      })}
    </nav>
  );
}
