import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPinCheck, Clock, AlertTriangle, UserPlus } from 'lucide-react';
import { ServicioTurno } from './useServiciosTurno';
import React from 'react';

interface ServicioPlanificadoPayload {
  id: string;
  nombre_cliente: string | null;
  origen: string | null;
  destino: string | null;
  custodio_asignado: string | null;
  fecha_hora_cita: string | null;
  estado_planeacion: string | null;
  hora_inicio_real: string | null;
}

/**
 * Hook para escuchar cambios en tiempo real en servicios_planificados
 * y mostrar toasts de notificación cuando ocurren eventos relevantes
 */
export const useServiciosTurnoRealtime = (servicios: ServicioTurno[]) => {
  const queryClient = useQueryClient();
  const previousServiciosRef = useRef<Map<string, ServicioTurno>>(new Map());
  const alertedServiciosRef = useRef<Set<string>>(new Set());

  // Actualizar referencia de servicios previos
  useEffect(() => {
    const newMap = new Map<string, ServicioTurno>();
    servicios.forEach(s => newMap.set(s.id, s));
    previousServiciosRef.current = newMap;
  }, [servicios]);

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('monitoring-posicionamiento')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'servicios_planificados'
        },
        (payload) => {
          const oldRecord = payload.old as ServicioPlanificadoPayload;
          const newRecord = payload.new as ServicioPlanificadoPayload;

          // Detectar posicionamiento (hora_inicio_real cambió de NULL a valor)
          if (!oldRecord.hora_inicio_real && newRecord.hora_inicio_real) {
            toast.success('Custodio Posicionado', {
              description: `${newRecord.custodio_asignado || 'Custodio'} llegó a ${newRecord.origen || 'destino'}`,
              icon: React.createElement(MapPinCheck, { className: "h-5 w-5 text-emerald-500" }),
              duration: 8000,
            });
          }

          // Detectar asignación de custodio
          if (!oldRecord.custodio_asignado && newRecord.custodio_asignado) {
            toast.info('Custodio Asignado', {
              description: `${newRecord.custodio_asignado} asignado a ${newRecord.nombre_cliente || 'servicio'}`,
              icon: React.createElement(UserPlus, { className: "h-5 w-5 text-blue-500" }),
              duration: 6000,
            });
          }

          // Invalidar query para refrescar datos
          queryClient.invalidateQueries({ queryKey: ['servicios-turno'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Verificar alertas por tiempo en cada actualización de servicios
  useEffect(() => {
    servicios.forEach(servicio => {
      const alertKey = `${servicio.id}-${servicio.estadoVisual}`;
      
      // Evitar alertas duplicadas
      if (alertedServiciosRef.current.has(alertKey)) return;

      // Servicio entrando a ventana "En Camino" (< 60 min)
      if (
        servicio.estadoVisual === 'proximo' && 
        servicio.minutosParaCita <= 60 && 
        servicio.minutosParaCita > 55
      ) {
        toast.info('Entrando en Ventana Próxima', {
          description: `${servicio.nombre_cliente || 'Servicio'} a ${servicio.minutosParaCita} minutos`,
          icon: React.createElement(Clock, { className: "h-5 w-5 text-amber-500" }),
          duration: 6000,
        });
        alertedServiciosRef.current.add(alertKey);
      }

      // Alerta crítica: Sin custodio y < 30 min para cita
      if (
        servicio.estadoVisual === 'sin_asignar' && 
        servicio.minutosParaCita <= 30 && 
        servicio.minutosParaCita > 0
      ) {
        toast.warning('¡Alerta Crítica!', {
          description: `${servicio.nombre_cliente || 'Servicio'} sin custodio a ${servicio.minutosParaCita} minutos`,
          icon: React.createElement(AlertTriangle, { className: "h-5 w-5 text-orange-500" }),
          duration: 10000,
        });
        alertedServiciosRef.current.add(alertKey);
      }
    });

    // Limpiar alertas antiguas cada 5 minutos para permitir re-alertar si persiste
    const cleanupInterval = setInterval(() => {
      alertedServiciosRef.current.clear();
    }, 5 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [servicios]);
};
