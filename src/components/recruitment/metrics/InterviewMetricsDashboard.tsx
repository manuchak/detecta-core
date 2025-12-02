import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInterviewMetrics, useStructuredInterviews } from '@/hooks/useStructuredInterview';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, Users, Clock, TrendingUp, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DECISION_COLORS = {
  aprobar: '#22c55e',
  rechazar: '#ef4444',
  segunda_entrevista: '#f59e0b',
  pendiente: '#6b7280',
};

export function InterviewMetricsDashboard() {
  const { data: weeklyMetrics, isLoading: loadingWeekly } = useInterviewMetrics();
  const { data: allInterviews, isLoading: loadingAll } = useStructuredInterviews();

  if (loadingWeekly || loadingAll) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate summary stats
  const totalInterviews = allInterviews?.length || 0;
  const avgRating = allInterviews?.length 
    ? allInterviews.reduce((acc, i) => acc + (i.rating_promedio || 0), 0) / allInterviews.length 
    : 0;
  const avgDuration = allInterviews?.length
    ? allInterviews.reduce((acc, i) => acc + (i.duracion_minutos || 0), 0) / allInterviews.length
    : 0;

  // Decision breakdown
  const decisionBreakdown = allInterviews?.reduce((acc, i) => {
    const decision = i.decision || 'pendiente';
    acc[decision] = (acc[decision] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(decisionBreakdown).map(([name, value]) => ({
    name: name === 'aprobar' ? 'Aprobados' :
          name === 'rechazar' ? 'Rechazados' :
          name === 'segunda_entrevista' ? '2da Entrevista' :
          'Pendientes',
    value,
    color: DECISION_COLORS[name as keyof typeof DECISION_COLORS],
  }));

  // Weekly chart data
  const weeklyData = weeklyMetrics?.map(m => ({
    semana: format(new Date(m.semana), 'd MMM', { locale: es }),
    total: m.total_entrevistas,
    promedio: Number(m.promedio_general?.toFixed(1)) || 0,
    aprobados: m.aprobados,
    rechazados: m.rechazados,
  })).reverse() || [];

  const approvalRate = totalInterviews > 0 
    ? ((decisionBreakdown.aprobar || 0) / totalInterviews * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Entrevistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInterviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Rating Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgRating.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">de 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasa de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvalRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duración Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(avgDuration)}</div>
            <p className="text-xs text-muted-foreground">minutos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrevistas por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin datos de entrevistas</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="semana" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aprobados" fill="#22c55e" name="Aprobados" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Decision Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución de Decisiones</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin datos de decisiones</p>
            ) : (
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de Decisiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{decisionBreakdown.aprobar || 0}</div>
                <div className="text-xs text-green-700">Aprobados</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{decisionBreakdown.rechazar || 0}</div>
                <div className="text-xs text-red-700">Rechazados</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div>
                <div className="text-2xl font-bold text-amber-600">{decisionBreakdown.segunda_entrevista || 0}</div>
                <div className="text-xs text-amber-700">2da Entrevista</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Clock className="h-8 w-8 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{decisionBreakdown.pendiente || 0}</div>
                <div className="text-xs text-gray-700">Pendientes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
