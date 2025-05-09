
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, ArrowUp, ArrowDown, CircleDollarSign, TrendingUp } from "lucide-react";
import { DashboardMetrics } from "@/hooks/useDashboardData";
import { useFormatters } from "@/hooks/useFormatters";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export const MetricsCards = ({ metrics, isLoading }: MetricsCardsProps) => {
  const { formatCurrency } = useFormatters();
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="card-apple hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Servicios</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{isLoading ? '...' : metrics.totalServices}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {metrics.yearlyGrowth >= 0 ? (
              <>
                <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">{metrics.yearlyGrowth}%</span>
              </>
            ) : (
              <>
                <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-500">{Math.abs(metrics.yearlyGrowth)}%</span>
              </>
            )}
            {' desde el mes anterior'}
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-apple hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">GMV Total</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{isLoading ? '...' : formatCurrency(metrics.totalGMV)}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-green-500">21%</span> desde el mes anterior
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-apple hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{isLoading ? '...' : metrics.activeClients}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-green-500">3.3%</span> desde el mes anterior
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-apple hover-lift">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Promedio</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{isLoading ? '...' : formatCurrency(metrics.averageServiceValue)}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
            <span className="text-green-500">5%</span> desde el mes anterior
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
