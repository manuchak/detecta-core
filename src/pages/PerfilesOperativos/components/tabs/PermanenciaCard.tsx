import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, TrendingUp, Activity } from 'lucide-react';
import { differenceInDays, differenceInMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PermanenciaCardProps {
  createdAt: string;
  fechaUltimoServicio: string | null;
  numeroServicios: number | null;
}

export function PermanenciaCard({ createdAt, fechaUltimoServicio, numeroServicios }: PermanenciaCardProps) {
  const fechaRegistro = new Date(createdAt);
  const hoy = new Date();
  
  // Calcular tiempo en plataforma
  const diasActivo = differenceInDays(hoy, fechaRegistro);
  const mesesActivo = differenceInMonths(hoy, fechaRegistro);
  const añosActivo = Math.floor(mesesActivo / 12);
  const mesesRestantes = mesesActivo % 12;
  
  // Formatear tiempo activo
  const tiempoActivo = añosActivo > 0 
    ? `${añosActivo} año${añosActivo > 1 ? 's' : ''}, ${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`
    : mesesActivo > 0
      ? `${mesesActivo} mes${mesesActivo > 1 ? 'es' : ''}, ${diasActivo % 30} días`
      : `${diasActivo} días`;
  
  // Calcular días sin servicio
  const diasSinServicio = fechaUltimoServicio 
    ? differenceInDays(hoy, new Date(fechaUltimoServicio))
    : null;
  
  // Calcular promedio de servicios por mes
  const serviciosPorMes = numeroServicios && mesesActivo > 0
    ? (numeroServicios / Math.max(mesesActivo, 1)).toFixed(1)
    : numeroServicios && diasActivo > 0
      ? ((numeroServicios / diasActivo) * 30).toFixed(1)
      : '0';
  
  // Determinar estado de actividad
  const getEstadoActividad = () => {
    if (diasSinServicio === null) return { label: 'Nuevo', color: 'bg-blue-500/10 text-blue-500' };
    if (diasSinServicio <= 7) return { label: 'Muy Activo', color: 'bg-green-500/10 text-green-500' };
    if (diasSinServicio <= 30) return { label: 'Activo', color: 'bg-emerald-500/10 text-emerald-500' };
    if (diasSinServicio <= 60) return { label: 'Moderado', color: 'bg-amber-500/10 text-amber-500' };
    if (diasSinServicio <= 90) return { label: 'Bajo', color: 'bg-orange-500/10 text-orange-500' };
    return { label: 'Inactivo', color: 'bg-red-500/10 text-red-500' };
  };
  
  const estadoActividad = getEstadoActividad();

  const MetricRow = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue 
  }: { 
    icon: any; 
    label: string; 
    value: React.ReactNode; 
    subValue?: string;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Permanencia y Actividad
          <Badge className={`ml-auto ${estadoActividad.color}`}>
            {estadoActividad.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <MetricRow 
          icon={Calendar} 
          label="Tiempo en plataforma" 
          value={tiempoActivo}
          subValue={`Desde ${format(fechaRegistro, "d 'de' MMMM yyyy", { locale: es })}`}
        />
        <MetricRow 
          icon={Activity} 
          label="Días sin servicio" 
          value={diasSinServicio !== null ? `${diasSinServicio} días` : 'Sin servicios registrados'}
          subValue={fechaUltimoServicio 
            ? `Último: ${format(new Date(fechaUltimoServicio), "d MMM yyyy", { locale: es })}`
            : undefined
          }
        />
        <MetricRow 
          icon={TrendingUp} 
          label="Promedio servicios/mes" 
          value={serviciosPorMes}
          subValue={`${numeroServicios || 0} servicios totales`}
        />
      </CardContent>
    </Card>
  );
}
