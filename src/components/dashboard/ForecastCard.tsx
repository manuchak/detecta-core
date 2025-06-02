
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatters } from "@/hooks/useFormatters";
import { useForecastData } from "@/hooks/useForecastData";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Calendar, Target, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ForecastCardProps {
  totalServices: number;
  totalGMV: number;
}

export const ForecastCard = ({ totalServices, totalGMV }: ForecastCardProps) => {
  const { formatCurrency } = useFormatters();
  const forecastData = useForecastData(totalServices, totalGMV);
  
  const currentYear = new Date().getFullYear();
  
  // Componente para mostrar varianza con colores
  const VarianceIndicator = ({ variance, isPositive = true }: { variance: number; isPositive?: boolean }) => {
    const isGood = isPositive ? variance > 0 : variance < 0;
    const color = isGood ? 'text-green-600' : 'text-red-600';
    const Icon = variance > 0 ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {Math.abs(variance).toFixed(1)}%
        </span>
      </div>
    );
  };
  
  // Componente para métricas de forecast
  const ForecastMetricBox = ({ 
    title, 
    actual, 
    forecast, 
    variance, 
    icon: Icon, 
    isGMV = false,
    period
  }: { 
    title: string; 
    actual: number; 
    forecast: number; 
    variance: number; 
    icon: any; 
    isGMV?: boolean;
    period: 'monthly' | 'annual';
  }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        </div>
        <VarianceIndicator variance={variance} />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {period === 'monthly' ? `Forecast (${forecastData.forecastMonth}):` : 'Forecast Anual:'}
          </span>
          <span className="font-bold text-blue-600">
            {isGMV ? formatCurrency(forecast) : forecast.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Real (Ene-May 2025):
          </span>
          <span className="font-semibold text-gray-900">
            {isGMV ? formatCurrency(actual) : '3,515'}
          </span>
        </div>
      </div>
      
      {period === 'monthly' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>vs Promedio Mensual (703)</span>
            <span>{variance > 0 ? '+' : ''}{variance.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                variance > 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'
              }`}
              style={{ width: `${Math.min(Math.abs(variance) * 2, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Forecast de Servicios y GMV
              </CardTitle>
              <p className="text-sm text-slate-600">
                Basado en 3,515 servicios reales (Ene-May 2025)
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-white/70 px-3 py-1 rounded-full">
            Actualizado: {new Date().toLocaleDateString('es-MX')}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Alerta informativa sobre los datos */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Base de datos real: 3,515 servicios únicos de enero a mayo 2025.</strong> 
            Forecast basado en análisis de tendencias estacionales y promedio de 703 servicios/mes.
          </AlertDescription>
        </Alert>
        
        {/* Forecast Mensual */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800 capitalize">
              Forecast de {forecastData.forecastMonth} {currentYear}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ForecastMetricBox
              title="Servicios del Mes"
              actual={forecastData.monthlyServicesActual}
              forecast={forecastData.monthlyServicesForecast}
              variance={forecastData.monthlyServicesVariance}
              icon={BarChart3}
              period="monthly"
            />
            <ForecastMetricBox
              title="GMV del Mes"
              actual={forecastData.monthlyGmvActual}
              forecast={forecastData.monthlyGmvForecast}
              variance={forecastData.monthlyGmvVariance}
              icon={DollarSign}
              isGMV={true}
              period="monthly"
            />
          </div>
        </div>
        
        {/* Forecast Anual */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              Forecast Anual {currentYear}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ForecastMetricBox
              title="Servicios Anuales"
              actual={forecastData.annualServicesActual}
              forecast={forecastData.annualServicesForecast}
              variance={forecastData.annualServicesVariance}
              icon={BarChart3}
              period="annual"
            />
            <ForecastMetricBox
              title="GMV Anual"
              actual={forecastData.annualGmvActual}
              forecast={forecastData.annualGmvForecast}
              variance={forecastData.annualGmvVariance}
              icon={DollarSign}
              isGMV={true}
              period="annual"
            />
          </div>
        </div>
        
        {/* Resumen de insights */}
        <div className="bg-white/70 rounded-lg p-4 border border-indigo-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metodología del Forecast
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Base real: 3,515 servicios (Ene-May)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Promedio mensual: 703 servicios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Factores estacionales aplicados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Proyección conservadora Jun-Dic</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
