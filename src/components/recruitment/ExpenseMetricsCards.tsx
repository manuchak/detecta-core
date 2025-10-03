import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCPADetails } from '@/hooks/useCPADetails';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const ExpenseMetricsCards = () => {
  const { cpaDetails, loading } = useCPADetails();

  const metrics = [
    {
      title: 'Total Invertido',
      value: formatCurrency(cpaDetails.yearlyBreakdown.totalCosts),
      description: 'Gastos del año',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Custodios Obtenidos',
      value: cpaDetails.yearlyBreakdown.totalNewCustodians.toString(),
      description: 'Total del año',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'CPA Promedio',
      value: formatCurrency(cpaDetails.overallCPA),
      description: 'Costo por adquisición',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Mes Actual',
      value: formatCurrency(cpaDetails.currentMonthData.costs),
      description: cpaDetails.currentMonthData.month,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.title}
            className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
                <div className={`${metric.bgColor} p-3 rounded-lg transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full ${metric.bgColor} opacity-50`} />
          </Card>
        );
      })}
    </div>
  );
};
