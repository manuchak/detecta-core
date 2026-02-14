import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCSLoyaltyFunnel, type LoyaltyStage } from '@/hooks/useCSLoyaltyFunnel';
import { Sparkles, Activity, Shield, Star, Crown, AlertTriangle } from 'lucide-react';

const FUNNEL_STAGES: LoyaltyStage[] = ['nuevo', 'activo', 'leal', 'promotor', 'embajador'];

const STAGE_GRADIENTS: Record<string, string> = {
  nuevo: 'bg-gradient-to-r from-blue-500 to-blue-600',
  activo: 'bg-gradient-to-r from-slate-400 to-slate-500',
  leal: 'bg-gradient-to-r from-green-500 to-green-600',
  promotor: 'bg-gradient-to-r from-amber-500 to-amber-600',
  embajador: 'bg-gradient-to-r from-purple-500 to-purple-600',
};

const STAGE_ICONS: Record<string, React.ElementType> = {
  nuevo: Sparkles,
  activo: Activity,
  leal: Shield,
  promotor: Star,
  embajador: Crown,
  en_riesgo: AlertTriangle,
};

const INDENT_STEP = 3; // percentage per stage

interface Props {
  onStageClick?: (stage: LoyaltyStage) => void;
  selectedStage?: LoyaltyStage | null;
}

export function CSLoyaltyFunnel({ onStageClick, selectedStage }: Props) {
  const { data, isLoading } = useCSLoyaltyFunnel();

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!data) return null;

  const funnelItems = data.funnel.filter(f => FUNNEL_STAGES.includes(f.stage));
  const riesgoItem = data.funnel.find(f => f.stage === 'en_riesgo');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Funnel de Fidelidad</CardTitle>
        <p className="text-xs text-muted-foreground">{data.total} clientes activos · Customer Loyalty Ladder</p>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Trapezoid funnel */}
        <div className="flex flex-col">
          {funnelItems.map((item, index) => {
            const Icon = STAGE_ICONS[item.stage];
            const isSelected = selectedStage === item.stage;
            const indent = index * INDENT_STEP;
            const clipPath = `polygon(${indent}% 0%, ${100 - indent}% 0%, ${100 - indent - INDENT_STEP}% 100%, ${indent + INDENT_STEP}% 100%)`;

            return (
              <button
                key={item.stage}
                onClick={() => onStageClick?.(item.stage)}
                className={`relative flex items-center justify-between cursor-pointer transition-all duration-200 hover:brightness-110 ${
                  STAGE_GRADIENTS[item.stage]
                } ${isSelected ? 'ring-2 ring-white/40 z-10 brightness-110' : ''}`}
                style={{
                  clipPath,
                  height: '48px',
                  marginTop: index > 0 ? '-2px' : '0',
                  paddingLeft: `calc(${indent + INDENT_STEP + 2}% + 8px)`,
                  paddingRight: `calc(${indent + INDENT_STEP + 2}% + 8px)`,
                }}
              >
                <div className="flex items-center gap-2 z-10">
                  <Icon className="h-4 w-4 text-white/80" />
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
                <div className="flex items-center gap-3 z-10">
                  <span className="text-lg font-bold text-white">{item.count}</span>
                  <span className="text-xs text-white/70">{item.percentage}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* En Riesgo - separate alert card */}
        {riesgoItem && riesgoItem.count > 0 && (
          <button
            onClick={() => onStageClick?.('en_riesgo')}
            className={`mt-8 w-full flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 transition-all hover:shadow-md cursor-pointer ${
              selectedStage === 'en_riesgo' ? 'ring-2 ring-destructive' : ''
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              {riesgoItem.count} cliente{riesgoItem.count !== 1 ? 's' : ''} en riesgo
            </span>
            <span className="text-xs text-red-500/70 ml-auto">Requieren atención</span>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
