import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import { PoolBenchmarks } from '../../../hooks/usePoolBenchmarks';

interface PoolRankingCardProps {
  benchmarks: PoolBenchmarks;
}

export function PoolRankingCard({ benchmarks }: PoolRankingCardProps) {
  const getPercentilBadge = (percentil: number) => {
    if (percentil >= 95) return { label: 'Elite', variant: 'default' as const, icon: Trophy, color: 'text-yellow-500' };
    if (percentil >= 80) return { label: 'Top Performer', variant: 'secondary' as const, icon: Medal, color: 'text-orange-500' };
    if (percentil >= 50) return { label: 'Promedio+', variant: 'outline' as const, icon: Award, color: 'text-blue-500' };
    return { label: 'En desarrollo', variant: 'outline' as const, icon: TrendingUp, color: 'text-muted-foreground' };
  };

  const percentilInfo = getPercentilBadge(benchmarks.percentil);
  const IconComponent = percentilInfo.icon;

  const rankings = [
    {
      label: 'Por Ingresos',
      position: benchmarks.rankingIngresos,
      total: benchmarks.totalCustodiosActivos
    },
    {
      label: 'Por Servicios',
      position: benchmarks.rankingServicios,
      total: benchmarks.totalCustodiosActivos
    },
    {
      label: 'Por $/Km',
      position: benchmarks.rankingIngresoPorKm,
      total: benchmarks.totalCustodiosActivos
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Ranking en Pool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Percentil destacado */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border">
          <IconComponent className={`h-8 w-8 mx-auto mb-2 ${percentilInfo.color}`} />
          <p className="text-3xl font-bold">Top {100 - benchmarks.percentil}%</p>
          <Badge variant={percentilInfo.variant} className="mt-2">
            {percentilInfo.label}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            de {benchmarks.totalCustodiosActivos} custodios activos
          </p>
        </div>

        {/* Rankings individuales */}
        <div className="space-y-3">
          {rankings.map((ranking, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">{ranking.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">#{ranking.position}</span>
                <span className="text-xs text-muted-foreground">/ {ranking.total}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparación con top */}
        {benchmarks.topIngresosTotales > 0 && (
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground mb-1">Top performer del pool</p>
            <p className="text-sm font-medium">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(benchmarks.topIngresosTotales)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
