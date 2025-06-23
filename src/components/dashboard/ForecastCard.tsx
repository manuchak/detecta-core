
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormatters } from "@/hooks/useFormatters";
import { useForecastData } from "@/hooks/useForecastData";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Calendar, Target, Info, Database, Loader2, AlertTriangle, Activity, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ForecastCardProps {
  totalServices: number;
  totalGMV: number;
  isLoading?: boolean;
  error?: any;
}

export const ForecastCard = ({ totalServices, totalGMV, isLoading = false, error }: ForecastCardProps) => {
  const { formatCurrency } = useFormatters();
  const forecastData = useForecastData(totalServices, totalGMV);
  
  const currentYear = new Date().getFullYear();
  
  // Si hay error en los datos del forecast
  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 via-red-50 to-red-100 border-red-200 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-red-900">
                Error en Forecast
              </CardTitle>
              <p className="text-sm text-red-700">
                No se pudieron cargar los datos anuales
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-100 border-red-300">
            <AlertTriangle className="h-4 w-4 text-red-700" />
            <AlertDescription className="text-red-800">
              Error al obtener datos: {error?.message || 'Error desconocido'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Si está cargando
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Cargando Forecast...
              </CardTitle>
              <p className="text-sm text-slate-600">
                Procesando datos de auditoría forense
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/70 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Componente para mostrar varianza con mejores visuales
  const VarianceIndicator = ({ variance, label, isPositive = true }: { variance: number; label: string; isPositive?: boolean }) => {
    const isGood = isPositive ? variance > 0 : variance < 0;
    const colorClass = isGood ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
    const Icon = variance > 0 ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colorClass} border border-current/20`}>
        <Icon className="h-4 w-4" />
        <div className="text-sm">
          <span className="font-bold">{Math.abs(variance).toFixed(1)}%</span>
          <span className="ml-1 opacity-75">{label}</span>
        </div>
      </div>
    );
  };
  
  // Componente mejorado para métricas de forecast
  const ForecastMetricCard = ({ 
    title, 
    actual, 
    forecast, 
    variance, 
    icon: Icon, 
    isGMV = false,
    period,
    progress
  }: { 
    title: string; 
    actual: number; 
    forecast: number; 
    variance: number; 
    icon: any; 
    isGMV?: boolean;
    period: 'monthly' | 'annual';
    progress?: number;
  }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isGMV ? 'bg-green-50' : 'bg-blue-50'}`}>
            <Icon className={`h-5 w-5 ${isGMV ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">
              {period === 'monthly' ? `Junio ${currentYear}` : `Año ${currentYear}`}
            </p>
          </div>
        </div>
        <VarianceIndicator 
          variance={variance} 
          label={period === 'monthly' ? "vs promedio" : "proyectado"}
        />
      </div>
      
      {/* Values */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Forecast:
          </span>
          <span className={`font-bold text-lg ${isGMV ? 'text-green-600' : 'text-blue-600'}`}>
            {isGMV ? formatCurrency(forecast) : forecast.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Real (Ene-May):
          </span>
          <span className="font-semibold text-gray-900">
            {isGMV ? formatCurrency(actual) : actual.toLocaleString()}
          </span>
        </div>
        
        {/* Progress bar for visual representation */}
        {progress && (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso del año</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );

  // Calculate progress percentages
  const monthlyServicesProgress = (forecastData.monthlyServicesActual / forecastData.annualServicesForecast) * 100;
  const monthlyGMVProgress = (forecastData.monthlyGmvActual / forecastData.annualGmvForecast) * 100;
  
  return (
    <Card className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 border-0 shadow-xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Forecast de Servicios y GMV
              </CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <Database className="h-3 w-3 mr-1" />
                  Auditoría Forense
                </Badge>
                <Badge variant="outline" className="text-slate-600">
                  <Activity className="h-3 w-3 mr-1" />
                  Actualizado: {new Date().toLocaleDateString('es-MX')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Alerta informativa mejorada */}
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Base de datos validada:</strong> {forecastData.monthlyServicesActual.toLocaleString()} servicios finalizados
              </div>
              <div className="text-right">
                <strong>GMV auditado:</strong> {formatCurrency(forecastData.monthlyGmvActual)}
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Forecast Mensual */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Forecast de {forecastData.forecastMonth} {currentYear}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ForecastMetricCard
              title="Servicios del Mes"
              actual={forecastData.monthlyServicesActual}
              forecast={forecastData.monthlyServicesForecast}
              variance={forecastData.monthlyServicesVariance}
              icon={BarChart3}
              period="monthly"
            />
            <ForecastMetricCard
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
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Proyección Anual {currentYear}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ForecastMetricCard
              title="Servicios Anuales"
              actual={forecastData.annualServicesActual}
              forecast={forecastData.annualServicesForecast}
              variance={forecastData.annualServicesVariance}
              icon={BarChart3}
              period="annual"
              progress={monthlyServicesProgress}
            />
            <ForecastMetricCard
              title="GMV Anual"
              actual={forecastData.annualGmvActual}
              forecast={forecastData.annualGmvForecast}
              variance={forecastData.annualGmvVariance}
              icon={DollarSign}
              isGMV={true}
              period="annual"
              progress={monthlyGMVProgress}
            />
          </div>
        </div>
        
        {/* Metodología mejorada */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Zap className="h-5 w-5 text-slate-600" />
            </div>
            <h4 className="font-bold text-slate-800">Metodología del Forecast</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Base Auditada</div>
                <div className="text-gray-600">{forecastData.monthlyServicesActual.toLocaleString()} servicios</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">GMV Validado</div>
                <div className="text-gray-600">{formatCurrency(forecastData.monthlyGmvActual)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
              <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Promedio Mensual</div>
                <div className="text-gray-600">{Math.round(forecastData.monthlyServicesActual / 5)} servicios</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
              <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Precisión</div>
                <div className="text-gray-600">100% consistente</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
