import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { ConflictAlert } from './ConflictAlert';
import { useToast } from '@/hooks/use-toast';

const TIMEZONE_CDMX = 'America/Mexico_City';
const CDMX_OFFSET = '-06:00';

interface ConflictData {
  custodio_id: string;
  custodio_nombre: string;
  conflictos_count: number;
  conflictos_detalle: any[];
  fecha_servicio: string;
  hora_servicio: string;
}

interface ConflictMonitorProps {
  className?: string;
  onConflictDetected?: (conflicts: ConflictData[]) => void;
}

export const ConflictMonitor: React.FC<ConflictMonitorProps> = ({
  className,
  onConflictDetected
}) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Query para detectar conflictos en servicios planificados del día
  const { data: conflictsToday, isLoading, error, refetch } = useQuery({
    queryKey: ['conflict-monitor', new Date().toDateString()],
    queryFn: async (): Promise<ConflictData[]> => {
      // Usar formatInTimeZone para obtener fecha en CDMX correctamente
      const today = formatInTimeZone(new Date(), TIMEZONE_CDMX, 'yyyy-MM-dd');
      
      // Usar timezone CDMX explícito para los queries
      const inicioDelDia = `${today}T00:00:00${CDMX_OFFSET}`;
      const finDelDia = `${today}T23:59:59${CDMX_OFFSET}`;
      
      // Obtener servicios planificados de hoy
      const { data: serviciosHoy, error: serviciosError } = await supabase
        .from('servicios_planificados')
        .select('*')
        .gte('fecha_hora_cita', inicioDelDia)
        .lt('fecha_hora_cita', finDelDia)
        .in('estado_planeacion', ['planificado', 'asignado', 'confirmado', 'en_progreso']);

      if (serviciosError) throw serviciosError;
      if (!serviciosHoy || serviciosHoy.length === 0) return [];

      const conflictsDetected: ConflictData[] = [];

        // Verificar cada servicio planificado contra conflictos
        for (const servicio of serviciosHoy) {
          if (!servicio.custodio_id || !servicio.custodio_asignado) continue;

          try {
            // Extraer fecha y hora usando timezone CDMX correcto
            const fechaServicio = formatInTimeZone(
              new Date(servicio.fecha_hora_cita), 
              TIMEZONE_CDMX, 
              'yyyy-MM-dd'
            );
            const horaServicio = formatInTimeZone(
              new Date(servicio.fecha_hora_cita), 
              TIMEZONE_CDMX, 
              'HH:mm'
            );
            
            console.log('🔍 ConflictMonitor verificando:', {
              id: servicio.id_servicio,
              fechaOriginal: servicio.fecha_hora_cita,
              fechaCDMX: fechaServicio,
              horaCDMX: horaServicio,
              custodio: servicio.custodio_asignado
            });
            
            const { data: validation, error: validationError } = await supabase.rpc(
              'verificar_disponibilidad_equitativa_custodio',
              {
                p_custodio_id: servicio.custodio_id,
                p_custodio_nombre: servicio.custodio_asignado,
                p_fecha_servicio: fechaServicio,
                p_hora_inicio: horaServicio,
                p_duracion_estimada_horas: 4
              }
            );

            if (validationError) {
              console.warn('Error validating service:', servicio.id, validationError);
              continue;
            }

            // Si hay conflictos, agregarlos a la lista
            if (validation && validation.servicios_en_conflicto > 0) {
              conflictsDetected.push({
                custodio_id: servicio.custodio_id,
                custodio_nombre: servicio.custodio_asignado,
                conflictos_count: validation.servicios_en_conflicto,
                conflictos_detalle: validation.conflictos_detalle || [],
                fecha_servicio: fechaServicio,
                hora_servicio: horaServicio
              });
            }
          } catch (error) {
            console.warn('Error checking conflicts for service:', servicio.id, error);
          }
        }

      return conflictsDetected;
    },
    refetchInterval: 5 * 60 * 1000, // Recheck every 5 minutes
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
  });

  // Notify parent component when conflicts are detected
  useEffect(() => {
    if (conflictsToday && conflictsToday.length > 0 && onConflictDetected) {
      onConflictDetected(conflictsToday);
    }
  }, [conflictsToday, onConflictDetected]);

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Error en Monitor de Conflictos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el monitor de conflictos.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!conflictsToday || conflictsToday.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            ✅ Monitor de Conflictos
          </CardTitle>
          <CardDescription>
            No se detectaron conflictos de horario hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-green-600">
              Sistema Limpio
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Conflictos Detectados
          <Badge variant="destructive">
            {conflictsToday.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Custodios con asignaciones superpuestas detectadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {conflictsToday.map((conflict) => (
          <div key={`${conflict.custodio_id}-${conflict.fecha_servicio}`}>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{conflict.custodio_nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {conflict.conflictos_count} conflicto{conflict.conflictos_count > 1 ? 's' : ''} - {conflict.fecha_servicio}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(
                  showDetails === conflict.custodio_id ? null : conflict.custodio_id
                )}
              >
                <Eye className="h-3 w-3 mr-1" />
                {showDetails === conflict.custodio_id ? 'Ocultar' : 'Ver'}
              </Button>
            </div>

            {showDetails === conflict.custodio_id && (
              <div className="mt-2">
                <ConflictAlert
                  conflictDetails={conflict.conflictos_detalle}
                  custodioNombre={conflict.custodio_nombre}
                  fechaServicio={conflict.fecha_servicio}
                  horaServicio={conflict.hora_servicio}
                />
              </div>
            )}
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="w-full"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Monitor
        </Button>
      </CardContent>
    </Card>
  );
};