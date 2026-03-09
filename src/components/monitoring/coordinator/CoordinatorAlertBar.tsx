import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Users, RotateCcw, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  unassignedCount: number;
  correctionCount: number;
  gastosCount: number;
}

export const CoordinatorAlertBar: React.FC<Props> = ({
  unassignedCount, correctionCount, gastosCount,
}) => {
  const total = unassignedCount + correctionCount + gastosCount;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chart-2/10 border border-chart-2/20">
        <CheckCircle2 className="h-4 w-4 text-chart-2" />
        <span className="text-sm font-medium text-chart-2">Operación al día</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-destructive/5 border border-destructive/20">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <div className="flex items-center gap-2 flex-wrap">
        {unassignedCount > 0 && (
          <Badge variant="destructive" className="text-[10px] gap-1 px-2 py-0.5">
            <Users className="h-3 w-3" />
            {unassignedCount} sin asignar
          </Badge>
        )}
        {correctionCount > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-amber-500/40 text-amber-600">
            <RotateCcw className="h-3 w-3" />
            {correctionCount} correcciones
          </Badge>
        )}
        {gastosCount > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-emerald-500/40 text-emerald-600">
            <Receipt className="h-3 w-3" />
            {gastosCount} gastos
          </Badge>
        )}
      </div>
    </div>
  );
};
