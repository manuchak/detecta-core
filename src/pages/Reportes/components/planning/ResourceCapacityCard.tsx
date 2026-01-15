import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Shield, Wrench, ThermometerSun, UserX } from 'lucide-react';
import type { RecursosCustodios, RecursosArmados, IndisponibilidadTemporal } from '../../types/planningResources';
import ClusterBarChart from './ClusterBarChart';

interface ResourceCapacityCardProps {
  title: string;
  type: 'custodios' | 'armados';
  data: RecursosCustodios | RecursosArmados;
}

const TIPO_INDISPONIBILIDAD_LABELS: Record<string, { label: string; icon: typeof Wrench }> = {
  falla_mecanica: { label: 'Falla mecánica', icon: Wrench },
  enfermedad: { label: 'Enfermedad', icon: ThermometerSun },
  familiar: { label: 'Personal/Familiar', icon: UserX },
  personal: { label: 'Personal', icon: UserX },
  vacaciones: { label: 'Vacaciones', icon: ThermometerSun },
  capacitacion: { label: 'Capacitación', icon: Users },
  mantenimiento: { label: 'Mantenimiento', icon: Wrench },
  otro: { label: 'Otro', icon: AlertTriangle },
};

export default function ResourceCapacityCard({ title, type, data }: ResourceCapacityCardProps) {
  const Icon = type === 'custodios' ? Users : Shield;
  const totalActivos = data.total_activos;
  const disponibles = data.disponibles;
  const conServicio = type === 'custodios' 
    ? (data as RecursosCustodios).con_servicio_reciente 
    : (data as RecursosArmados).con_servicio_30d;
  
  const nuncaAsignados = data.clusters.nunca_asignado;
  const hayAlertaNuncaAsignado = nuncaAsignados > totalActivos * 0.5;
  
  // Calcular inactivos en riesgo (60-120 días)
  const inactivosRiesgo = data.clusters.inactivo_60_90d + data.clusters.inactivo_90_120d;
  const hayAlertaInactivos = inactivosRiesgo > 10;
  
  return (
    <Card className="shadow-apple-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-sm font-medium">
            {totalActivos} total
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Métricas principales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {disponibles}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">Disponibles</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {conServicio}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-500">Activos 30d</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50 border">
            <div className="text-2xl font-bold">
              {data.tasa_activacion}%
            </div>
            <div className="text-xs text-muted-foreground">Tasa Activación</div>
          </div>
        </div>
        
        {/* Clusters de inactividad */}
        <div className="pt-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Distribución por última actividad
          </div>
          <ClusterBarChart 
            clusters={data.clusters} 
            total={totalActivos}
            showNuncaAsignado={true}
          />
        </div>
        
        {/* Alertas */}
        {(hayAlertaNuncaAsignado || hayAlertaInactivos) && (
          <div className="space-y-2 pt-2 border-t">
            {hayAlertaNuncaAsignado && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{nuncaAsignados}</strong> sin asignar ({Math.round((nuncaAsignados / totalActivos) * 100)}%) — 
                  revisar calidad de datos
                </span>
              </div>
            )}
            {hayAlertaInactivos && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{inactivosRiesgo}</strong> con 60-120 días sin servicios — 
                  riesgo de pérdida
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Indisponibilidades temporales */}
        {data.indisponibilidades.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <span>Indisponibilidades Temporales</span>
              <Badge variant="outline" className="text-xs">
                {data.indisponibilidades.reduce((acc, i) => acc + i.cantidad, 0)} activas
              </Badge>
            </div>
            <div className="space-y-1.5">
              {data.indisponibilidades.map((indisp) => {
                const config = TIPO_INDISPONIBILIDAD_LABELS[indisp.tipo] || TIPO_INDISPONIBILIDAD_LABELS.otro;
                const IconIndisp = config.icon;
                
                return (
                  <div 
                    key={indisp.tipo} 
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <IconIndisp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{config.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {indisp.cantidad}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
