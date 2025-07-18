import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialSystem } from '@/hooks/useFinancialSystem';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calculator,
  PieChart,
  BarChart3,
  MapPin
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

const FinancialROIDashboard = () => {
  const {
    gastos,
    presupuestos,
    roiCustodios,
    metricasCanales,
    loading,
    crearGasto,
    crearPresupuesto,
    calcularROIZona
  } = useFinancialSystem();

  // Calcular métricas agregadas
  const totalExpenses = gastos?.reduce((sum, gasto) => sum + Number(gasto.monto), 0) || 0;
  const totalBudget = presupuestos?.reduce((sum, presupuesto) => sum + Number(presupuesto.presupuesto_asignado), 0) || 0;
  const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  // Gastos por categoría para gráfica
  const expensesByCategory = gastos?.reduce((acc, gasto) => {
    const categoria = gasto.categoria_id || 'Sin categoría';
    acc[categoria] = (acc[categoria] || 0) + Number(gasto.monto);
    return acc;
  }, {} as Record<string, number>) || {};

  const categoryChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // ROI por zona
  const roiByZone = roiCustodios?.map(roi => ({
    zona: roi.zona_id,
    roi: Number(roi.roi_percentage || 0),
    custodios: Number(roi.servicios_completados || 0),
    costo: Number(roi.costo_adquisicion || 0)
  })) || [];

  // Colores para gráficas
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Asignado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilización Presupuesto</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(budgetUtilization)}</div>
            <p className="text-xs text-muted-foreground">
              Del total asignado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiByZone.length > 0 
                ? formatPercentage(roiByZone.reduce((sum, z) => sum + z.roi, 0) / roiByZone.length)
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Todas las zonas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="expenses">Gastos por Categoría</TabsTrigger>
          <TabsTrigger value="roi">ROI por Zona</TabsTrigger>
          <TabsTrigger value="budget">Gestión Presupuesto</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gastos por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Gastos</CardTitle>
                <CardDescription>
                  Gastos de reclutamiento por categoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ROI por zona */}
            <Card>
              <CardHeader>
                <CardTitle>ROI por Zona Operativa</CardTitle>
                <CardDescription>
                  Retorno de inversión en reclutamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiByZone}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zona" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="roi" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Detallado de Gastos</CardTitle>
              <CardDescription>
                Desglose de inversiones en adquisición de custodios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gastos?.slice(0, 10).map((gasto) => (
                  <div key={gasto.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{gasto.concepto}</h4>
                      <p className="text-sm text-muted-foreground">
                        {gasto.descripcion}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {gasto.categoria_id}
                        </Badge>
                        <Badge variant={gasto.estado === 'aprobado' ? 'default' : 'secondary'}>
                          {gasto.estado}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(Number(gasto.monto))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(gasto.fecha_gasto).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de ROI Detallado</CardTitle>
              <CardDescription>
                Métricas de retorno de inversión por zona operativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {roiCustodios?.map((roi) => (
                  <div key={roi.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <MapPin className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-medium">Zona {roi.zona_id}</h4>
                        <p className="text-sm text-muted-foreground">
                          {roi.servicios_completados} servicios completados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold flex items-center gap-2">
                        {Number(roi.roi_percentage) >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {formatPercentage(Number(roi.roi_percentage || 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Costo: {formatCurrency(Number(roi.costo_adquisicion || 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Presupuestos</CardTitle>
              <CardDescription>
                Control presupuestario por zona y período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {presupuestos?.map((presupuesto) => {
                  const gastoZona = gastos?.filter(g => g.zona_id === presupuesto.zona_id)
                    .reduce((sum, g) => sum + Number(g.monto), 0) || 0;
                  const utilizacion = (gastoZona / Number(presupuesto.presupuesto_asignado)) * 100;
                  const fechaInicio = new Date(presupuesto.periodo_inicio).toLocaleDateString('es-MX');
                  const fechaFin = new Date(presupuesto.periodo_fin).toLocaleDateString('es-MX');
                  
                  return (
                    <div key={presupuesto.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">Zona {presupuesto.zona_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            {fechaInicio} - {fechaFin}
                          </p>
                        </div>
                        <Badge variant={utilizacion > 90 ? 'destructive' : utilizacion > 75 ? 'default' : 'secondary'}>
                          {formatPercentage(utilizacion)} utilizado
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Presupuestado:</span>
                          <span className="font-medium">{formatCurrency(Number(presupuesto.presupuesto_asignado))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Gastado:</span>
                          <span className="font-medium">{formatCurrency(gastoZona)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Disponible:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(Number(presupuesto.presupuesto_asignado) - gastoZona)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(utilizacion, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialROIDashboard;