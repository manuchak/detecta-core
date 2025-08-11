import { usePlaneacionStats } from '@/hooks/usePlaneacion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function KPIDashboard() {
  const { data: stats, isLoading } = usePlaneacionStats();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Servicios",
      value: stats?.total_servicios || 0,
      description: "Servicios registrados",
      icon: Shield,
      color: "text-blue-600"
    },
    {
      title: "Custodios Activos",
      value: stats?.custodios_activos || 0,
      description: "Disponibles para asignación",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Tasa de Aceptación",
      value: `${Math.round((stats?.tasa_aceptacion || 0) * 100)}%`,
      description: "Ofertas aceptadas",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Tiempo Medio Asignación",
      value: `${Math.round(stats?.tiempo_medio_asignacion || 0)}m`,
      description: "Minutos promedio",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Servicios con Gadgets",
      value: stats?.servicios_con_gadgets || 0,
      description: "Requieren equipamiento",
      icon: MapPin,
      color: "text-cyan-600"
    },
    {
      title: "Ingresos Totales",
      value: `$${(stats?.ingresos_totales || 0).toLocaleString()}`,
      description: "Total facturado",
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      title: "Margen Promedio",
      value: `${Math.round((stats?.margen_promedio || 0) * 100)}%`,
      description: "Rentabilidad",
      icon: TrendingUp,
      color: "text-pink-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado de Servicios */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Servicios por Estado
            </CardTitle>
            <CardDescription>
              Distribución actual de servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.servicios_por_estado && Object.entries(stats.servicios_por_estado).map(([estado, cantidad]) => {
              const total = stats.total_servicios || 1;
              const percentage = (cantidad / total) * 100;
              
              const badgeVariant = {
                'nuevo': 'default',
                'en_oferta': 'secondary',
                'asignado': 'outline',
                'en_curso': 'default',
                'finalizado': 'default',
                'cancelado': 'destructive'
              }[estado] as any || 'default';

              return (
                <div key={estado} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariant} className="text-xs">
                        {estado.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm">{cantidad}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Resumen de Operaciones
            </CardTitle>
            <CardDescription>
              Indicadores clave de rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Tasa de Aceptación</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(stats?.tasa_aceptacion || 0) * 100} 
                  className="w-20 h-2" 
                />
                <span className="text-sm font-medium">
                  {Math.round((stats?.tasa_aceptacion || 0) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Margen Promedio</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(stats?.margen_promedio || 0) * 100} 
                  className="w-20 h-2" 
                />
                <span className="text-sm font-medium">
                  {Math.round((stats?.margen_promedio || 0) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Tiempo Medio Asignación</span>
              <span className="text-sm font-medium">
                {Math.round(stats?.tiempo_medio_asignacion || 0)} min
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}