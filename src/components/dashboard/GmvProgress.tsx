
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormatters } from "@/hooks/useFormatters";
import { Target, TrendingUp } from "lucide-react";

interface GmvProgressProps {
  totalGMV: number;
  targetGMV?: number;
}

export const GmvProgress = ({ totalGMV, targetGMV = 1200000 }: GmvProgressProps) => {
  const { formatCurrency } = useFormatters();
  const progressPercentage = Math.min(Math.round((totalGMV / targetGMV) * 100), 100);
  const remaining = Math.max(targetGMV - totalGMV, 0);
  
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Meta Anual de Ingresos
              </CardTitle>
              <CardDescription className="text-slate-600">
                Progreso hacia el objetivo del año
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">{progressPercentage}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalGMV)}
            </div>
            <div className="text-sm text-slate-600">Logrado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(targetGMV)}
            </div>
            <div className="text-sm text-slate-600">Meta</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(remaining)}
            </div>
            <div className="text-sm text-slate-600">Restante</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progreso anual</span>
            <span className="font-semibold text-slate-900">{progressPercentage}%</span>
          </div>
          <div className="h-3 rounded-full bg-white overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out" 
              style={{width: `${progressPercentage}%`}}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>$0</span>
            <span>{formatCurrency(targetGMV)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
