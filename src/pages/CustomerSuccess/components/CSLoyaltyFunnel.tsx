import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCSLoyaltyFunnel, type LoyaltyStage } from '@/hooks/useCSLoyaltyFunnel';
import { Sparkles, Activity, Shield, Star, Crown, AlertTriangle } from 'lucide-react';

const STAGE_COLORS: Record<LoyaltyStage, string> = {
  nuevo: 'bg-blue-500',
  activo: 'bg-muted-foreground/50',
  leal: 'bg-green-500',
  promotor: 'bg-amber-500',
  embajador: 'bg-purple-500',
  en_riesgo: 'bg-destructive',
};

const STAGE_BG: Record<LoyaltyStage, string> = {
  nuevo: 'bg-blue-50 dark:bg-blue-950/30',
  activo: 'bg-secondary/50',
  leal: 'bg-green-50 dark:bg-green-950/30',
  promotor: 'bg-amber-50 dark:bg-amber-950/30',
  embajador: 'bg-purple-50 dark:bg-purple-950/30',
  en_riesgo: 'bg-red-50 dark:bg-red-950/30',
};

const STAGE_ICONS: Record<LoyaltyStage, React.ElementType> = {
  nuevo: Sparkles,
  activo: Activity,
  leal: Shield,
  promotor: Star,
  embajador: Crown,
  en_riesgo: AlertTriangle,
};

interface Props {
  onStageClick?: (stage: LoyaltyStage) => void;
  selectedStage?: LoyaltyStage | null;
}

export function CSLoyaltyFunnel({ onStageClick, selectedStage }: Props) {
  const { data, isLoading } = useCSLoyaltyFunnel();

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!data) return null;

  const maxCount = Math.max(...data.funnel.map(f => f.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Funnel de Fidelidad</CardTitle>
        <p className="text-xs text-muted-foreground">{data.total} clientes activos · Customer Loyalty Ladder</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2">
          {data.funnel.map(item => {
            const Icon = STAGE_ICONS[item.stage];
            const isSelected = selectedStage === item.stage;
            const barHeight = Math.max((item.count / maxCount) * 60, 4);

            return (
              <button
                key={item.stage}
                onClick={() => onStageClick?.(item.stage)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                  STAGE_BG[item.stage]
                } ${isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">{item.label}</span>
                <div className="w-full flex items-end justify-center h-[60px]">
                  <div
                    className={`w-full max-w-[40px] rounded-t ${STAGE_COLORS[item.stage]} transition-all`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <span className="text-lg font-bold">{item.count}</span>
                <span className="text-[10px] text-muted-foreground">{item.percentage}%</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
