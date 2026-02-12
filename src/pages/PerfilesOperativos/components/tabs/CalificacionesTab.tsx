import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StarRating } from '@/components/ui/star-rating';
import { 
  Star, TrendingUp, Clock, DollarSign, Shuffle, Users, Lock, Loader2,
  Target, ShieldCheck, FileCheck, BookOpen, Activity
} from 'lucide-react';
import { useOperativeRating, type RatingDimension } from '../../hooks/useOperativeRating';
import { formatCurrency } from '@/utils/formatUtils';
import type { OperativeProfileFull } from '../../hooks/useOperativeProfile';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CalificacionesTabProps {
  custodioId: string;
  nombre: string;
  telefono: string | null;
  profile?: OperativeProfileFull;
}

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  performance: TrendingUp,
  disponibilidad: Clock,
  revenue: DollarSign,
  versatilidad: Shuffle,
  cliente: Users,
};

const PERF_BREAKDOWN_ICONS: Record<string, React.ElementType> = {
  puntualidad: Target,
  confiabilidad: ShieldCheck,
  checklist: FileCheck,
  documentacion: BookOpen,
  volumen: Activity,
};

export function CalificacionesTab({ custodioId, nombre, telefono }: CalificacionesTabProps) {
  const { rating, isLoading } = useOperativeRating(custodioId, nombre, telefono);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating General */}
      <RatingOverviewCard rating={rating.ratingGeneral} score={rating.scoreGeneral} label={rating.label} labelColor={rating.labelColor} />

      {/* Dimension Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {rating.dimensions.map(dim => (
          <DimensionCard key={dim.key} dimension={dim} />
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceBreakdown breakdown={rating.performanceBreakdown} />
        <RevenueComparison total={rating.revenueTotal90d} p50={rating.revenueP50} p90={rating.revenueP90} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VersatilidadChart locales={rating.serviciosLocales} foraneos={rating.serviciosForaneos} />
        <HistoricoPlaceholder />
      </div>
    </div>
  );
}

function RatingOverviewCard({ rating, score, label, labelColor }: { rating: number; score: number; label: string; labelColor: string }) {
  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold">{rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
          <div>
            <StarRating rating={Math.round(rating)} size={28} />
            <p className={`text-lg font-semibold mt-1 ${labelColor}`}>{label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Score compuesto</p>
          <div className="flex items-center gap-2">
            <Progress value={score} className="w-32 h-2" />
            <span className="text-sm font-medium">{score}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DimensionCard({ dimension }: { dimension: RatingDimension }) {
  const Icon = DIMENSION_ICONS[dimension.key] || Star;

  if (!dimension.available) {
    return (
      <Card className="border-dashed border-2 opacity-60">
        <CardContent className="py-4 text-center">
          <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">{dimension.label}</p>
          <Badge variant="secondary" className="mt-2 text-xs">Próximamente</Badge>
          <p className="text-xs text-muted-foreground mt-2">Se activará con el portal de clientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4 text-center space-y-2">
        <Icon className="h-5 w-5 mx-auto text-primary" />
        <p className="text-sm font-medium">{dimension.label}</p>
        <StarRating rating={dimension.stars} size={16} />
        <p className="text-2xl font-bold">{dimension.score}</p>
        <Badge variant="outline" className="text-xs">{Math.round(dimension.weight * 100)}% peso</Badge>
      </CardContent>
    </Card>
  );
}

function PerformanceBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const labels: Record<string, string> = {
    puntualidad: 'Puntualidad',
    confiabilidad: 'Confiabilidad',
    checklist: 'Checklist',
    documentacion: 'Documentación',
    volumen: 'Volumen',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Desglose Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(breakdown).map(([key, value]) => {
          const Icon = PERF_BREAKDOWN_ICONS[key] || Star;
          return (
            <div key={key} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm w-28">{labels[key] || key}</span>
              <Progress value={value} className="flex-1 h-2" />
              <span className="text-sm font-medium w-10 text-right">{value}%</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RevenueComparison({ total, p50, p90 }: { total: number; p50: number; p90: number }) {
  const maxVal = Math.max(total, p90) * 1.1 || 1;
  const pctTotal = (total / maxVal) * 100;
  const pctP50 = (p50 / maxVal) * 100;
  const pctP90 = (p90 / maxVal) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Revenue 90 días vs Flota
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-3xl font-bold">{formatCurrency(total)}</span>
          <p className="text-sm text-muted-foreground">generados en 90 días</p>
        </div>
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          {/* P50 marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${pctP50}%` }} />
          {/* P90 marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10" style={{ left: `${pctP90}%` }} />
          {/* Custodio bar */}
          <div className="absolute top-1 bottom-1 bg-primary rounded-full" style={{ width: `${pctTotal}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span className="text-amber-600 dark:text-amber-400">P50: {formatCurrency(p50)}</span>
          <span className="text-emerald-600 dark:text-emerald-400">P90: {formatCurrency(p90)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function VersatilidadChart({ locales, foraneos }: { locales: number; foraneos: number }) {
  const total = locales + foraneos;
  const data = total > 0
    ? [
        { name: 'Locales', value: locales },
        { name: 'Foráneos', value: foraneos },
      ]
    : [{ name: 'Sin datos', value: 1 }];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shuffle className="h-4 w-4" />
          Versatilidad (15 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={25} outerRadius={40} paddingAngle={2}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={total > 0 ? COLORS[i % COLORS.length] : 'hsl(var(--muted))'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Locales: <strong>{locales}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Foráneos: <strong>{foraneos}</strong></span>
            </div>
            {total === 0 && <p className="text-muted-foreground text-xs">Sin servicios en los últimos 15 días</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoricoPlaceholder() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4" />
          Histórico de Rating
          <Badge variant="secondary" className="text-xs">Próximamente</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">
          El histórico de evolución del rating se mostrará aquí una vez que se acumulen snapshots periódicos.
        </p>
      </CardContent>
    </Card>
  );
}
