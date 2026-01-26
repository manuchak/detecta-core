import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, FileCheck, Calendar, AlertTriangle, 
  CheckCircle2, Clock, Star, TrendingUp 
} from 'lucide-react';
import { useOperativeProfile, type ArmadoProfileFull } from '../../hooks/useOperativeProfile';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface ArmadoEvaluacionesTabProps {
  armadoId: string;
  armadoNombre: string;
}

export function ArmadoEvaluacionesTab({ armadoId, armadoNombre }: ArmadoEvaluacionesTabProps) {
  const { data: profile, isLoading } = useOperativeProfile(armadoId, 'armado');
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  
  const armado = profile as ArmadoProfileFull | undefined;
  
  if (!armado) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontró información del armado</p>
        </CardContent>
      </Card>
    );
  }
  
  // License status calculation
  const getLicenseStatus = () => {
    if (!armado.fecha_vencimiento_licencia) {
      return { status: 'unknown', label: 'Sin información', color: 'text-muted-foreground', days: null };
    }
    
    const diasRestantes = differenceInDays(parseISO(armado.fecha_vencimiento_licencia), new Date());
    
    if (diasRestantes < 0) {
      return { status: 'expired', label: 'Vencida', color: 'text-destructive', days: Math.abs(diasRestantes) };
    }
    if (diasRestantes <= 30) {
      return { status: 'warning', label: 'Por vencer', color: 'text-amber-600', days: diasRestantes };
    }
    return { status: 'valid', label: 'Vigente', color: 'text-emerald-600', days: diasRestantes };
  };
  
  const licenseStatus = getLicenseStatus();
  
  // Calculate reliability score based on available metrics
  const reliabilityScore = armado.tasa_confiabilidad ?? armado.tasa_confirmacion ?? 0;
  const responseRate = armado.tasa_respuesta ?? 0;
  
  return (
    <div className="space-y-6">
      {/* License Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Licencia de Portación
          </CardTitle>
          <CardDescription>Estado de documentación oficial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Número de Licencia</p>
              <p className="font-medium">
                {armado.licencia_portacion || 'No registrada'}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
              <p className="font-medium">
                {armado.fecha_vencimiento_licencia 
                  ? format(parseISO(armado.fecha_vencimiento_licencia), "d 'de' MMMM, yyyy", { locale: es })
                  : 'No registrada'}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="flex items-center gap-2">
                {licenseStatus.status === 'valid' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
                {licenseStatus.status === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                {licenseStatus.status === 'expired' && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
                {licenseStatus.status === 'unknown' && (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                <Badge className={cn(
                  'text-sm',
                  licenseStatus.status === 'valid' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
                  licenseStatus.status === 'warning' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                  licenseStatus.status === 'expired' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                  licenseStatus.status === 'unknown' && 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                )}>
                  {licenseStatus.label}
                  {licenseStatus.days !== null && (
                    <span className="ml-1">
                      ({licenseStatus.days}d {licenseStatus.status === 'expired' ? 'vencida' : 'restantes'})
                    </span>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reliability Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Confiabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {reliabilityScore.toFixed(0)}%
              </span>
              <Badge variant={reliabilityScore >= 80 ? 'default' : reliabilityScore >= 60 ? 'secondary' : 'destructive'}>
                {reliabilityScore >= 80 ? 'Excelente' : reliabilityScore >= 60 ? 'Bueno' : 'Mejorar'}
              </Badge>
            </div>
            <Progress value={reliabilityScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Basado en servicios completados sin incidentes
            </p>
          </CardContent>
        </Card>
        
        {/* Response Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Tasa de Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {responseRate.toFixed(0)}%
              </span>
              <Badge variant={responseRate >= 80 ? 'default' : responseRate >= 60 ? 'secondary' : 'destructive'}>
                {responseRate >= 80 ? 'Óptima' : responseRate >= 60 ? 'Aceptable' : 'Baja'}
              </Badge>
            </div>
            <Progress value={responseRate} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Velocidad de confirmación a solicitudes de servicio
            </p>
          </CardContent>
        </Card>
        
        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              Experiencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Años de experiencia</span>
                <span className="text-2xl font-bold">
                  {armado.experiencia_anos ?? 'N/A'} {armado.experiencia_anos !== null && 'años'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Servicios completados</span>
                <span className="text-2xl font-bold">
                  {armado.numero_servicios ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5" />
              Calificación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold">
                {armado.rating_promedio?.toFixed(1) ?? 'N/A'}
              </span>
              {armado.rating_promedio && (
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-5 w-5',
                        star <= Math.round(armado.rating_promedio || 0)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Basado en evaluaciones de custodios y coordinadores
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Equipment */}
      {armado.equipamiento_disponible && armado.equipamiento_disponible.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Equipamiento Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {armado.equipamiento_disponible.map((equipo, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {equipo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
