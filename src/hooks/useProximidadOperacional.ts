/**
 * Hook para integrar la lógica de proximidad operacional en la asignación de custodios
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  calcularProximidadOperacional, 
  analizarPatronesTrabajoCustomdio,
  generarRazonesRecomendacion,
  type CustodioConHistorial,
  type ServicioNuevo,
  type ServicioHistorico,
  type ScoringProximidad 
} from '@/utils/proximidadOperacional';

export interface CustodioConProximidad extends CustodioConHistorial {
  scoring_proximidad?: ScoringProximidad;
  razones_recomendacion?: string[];
  prioridad_asignacion?: 'alta' | 'media' | 'baja';
}

/**
 * Hook principal para obtener custodios con scoring de proximidad operacional
 */
export function useCustodiosConProximidad(servicioNuevo?: ServicioNuevo) {
  return useQuery({
    queryKey: ['custodios-proximidad', servicioNuevo],
    queryFn: async (): Promise<CustodioConProximidad[]> => {
      // 1. Obtener custodios activos de pc_custodios
      const { data: pcCustodios, error: pcError } = await supabase
        .from('pc_custodios')
        .select(`
          id,
          nombre,
          disponibilidad,
          estado,
          rating_promedio,
          numero_servicios,
          certificaciones,
          comentarios,
          zona_base,
          tiene_gadgets,
          created_at,
          updated_at
        `)
        .eq('estado', 'activo')
        .eq('disponibilidad', 'disponible');

      if (pcError) {
        console.error('Error fetching pc_custodios:', pcError);
      }

      // 2. Obtener candidatos aprobados de candidatos_custodios
      const { data: candidatos, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select(`
          id,
          nombre,
          email,
          telefono,
          zona_preferida_id,
          disponibilidad_horarios,
          vehiculo_propio,
          experiencia_seguridad,
          expectativa_ingresos,
          estado_proceso,
          fuente_reclutamiento,
          created_at
        `)
        .eq('estado_proceso', 'aprobado');

      if (candidatosError) {
        console.error('Error fetching candidatos_custodios:', candidatosError);
      }

      // 3. Obtener servicios próximos para análisis temporal
      const fechaHoy = new Date();
      const fechaInicio = new Date(fechaHoy);
      fechaInicio.setHours(fechaHoy.getHours() - 12); // 12 horas atrás
      const fechaFin = new Date(fechaHoy);
      fechaFin.setHours(fechaHoy.getHours() + 12); // 12 horas adelante

      let serviciosProximos: ServicioHistorico[] = [];
      
      if (servicioNuevo) {
        const { data: servicios } = await supabase
          .from('servicios_custodia')
          .select(`
            id,
            fecha_hora_cita,
            origen,
            destino,
            estado,
            nombre_custodio,
            tipo_servicio,
            km_recorridos
          `)
          .gte('fecha_hora_cita', fechaInicio.toISOString())
          .lte('fecha_hora_cita', fechaFin.toISOString())
          .in('estado', ['finalizado', 'en_progreso', 'programado'])
          .limit(100);

        serviciosProximos = servicios || [];
      }

      // 4. Procesar custodios de pc_custodios
      const custodiosProcesados: CustodioConProximidad[] = [];
      
      if (pcCustodios) {
        for (const custodio of pcCustodios) {
          // Obtener historial de servicios del custodio
          const { data: historialServicios } = await supabase
            .from('servicios_custodia')
            .select(`
              id,
              fecha_hora_cita,
              origen,
              destino,
              estado,
              tipo_servicio,
              km_recorridos
            `)
            .eq('nombre_custodio', custodio.nombre)
            .in('estado', ['finalizado'])
            .order('fecha_hora_cita', { ascending: false })
            .limit(20);

          const serviciosHistoricos = historialServicios || [];
          
          // Analizar patrones de trabajo
          const patronesTrabajo = analizarPatronesTrabajoCustomdio(serviciosHistoricos);
          
          const custodioConHistorial: CustodioConHistorial = {
            ...custodio,
            fuente: 'pc_custodios',
            servicios_historicos: serviciosHistoricos,
            ciudades_frecuentes: patronesTrabajo.ciudades_frecuentes,
            ultima_actividad: serviciosHistoricos[0]?.fecha_hora_cita
          };

          // Calcular scoring de proximidad si tenemos servicio nuevo
          let scoring: ScoringProximidad | undefined;
          let razones: string[] = [];
          let prioridad: 'alta' | 'media' | 'baja' = 'media';

          if (servicioNuevo) {
            scoring = calcularProximidadOperacional(
              custodioConHistorial,
              servicioNuevo,
              serviciosProximos
            );
            
            razones = generarRazonesRecomendacion(scoring, custodioConHistorial);
            
            // Determinar prioridad basada en score
            if (scoring.score_total >= 75) {
              prioridad = 'alta';
            } else if (scoring.score_total >= 50) {
              prioridad = 'media';
            } else {
              prioridad = 'baja';
            }
          }

          custodiosProcesados.push({
            ...custodioConHistorial,
            scoring_proximidad: scoring,
            razones_recomendacion: razones,
            prioridad_asignacion: prioridad
          });
        }
      }

      // 5. Procesar candidatos nuevos
      if (candidatos) {
        for (const candidato of candidatos) {
          const custodioConHistorial: CustodioConHistorial = {
            id: candidato.id,
            nombre: candidato.nombre,
            fuente: 'candidatos_custodios',
            disponibilidad: 'disponible', // Asumimos que están disponibles
            estado: 'activo',
            zona_preferida_id: candidato.zona_preferida_id,
            disponibilidad_horarios: candidato.disponibilidad_horarios,
            vehiculo_propio: candidato.vehiculo_propio,
            experiencia_seguridad: candidato.experiencia_seguridad,
            expectativa_ingresos: candidato.expectativa_ingresos,
            servicios_historicos: [],
            ciudades_frecuentes: []
          };

          // Calcular scoring de proximidad si tenemos servicio nuevo
          let scoring: ScoringProximidad | undefined;
          let razones: string[] = [];
          let prioridad: 'alta' | 'media' | 'baja' = 'media';

          if (servicioNuevo) {
            scoring = calcularProximidadOperacional(
              custodioConHistorial,
              servicioNuevo,
              serviciosProximos
            );
            
            razones = generarRazonesRecomendacion(scoring, custodioConHistorial);
            
            // Determinar prioridad (candidatos nuevos tienen penalización leve)
            if (scoring.score_total >= 70) {
              prioridad = 'alta';
            } else if (scoring.score_total >= 45) {
              prioridad = 'media';
            } else {
              prioridad = 'baja';
            }
          }

          custodiosProcesados.push({
            ...custodioConHistorial,
            scoring_proximidad: scoring,
            razones_recomendacion: razones,
            prioridad_asignacion: prioridad
          });
        }
      }

      // 6. Ordenar por scoring de proximidad si está disponible
      if (servicioNuevo) {
        return custodiosProcesados.sort((a, b) => {
          // Priorizar por tipo (pc_custodios > candidatos_custodios)
          const prioridadTipoA = a.fuente === 'pc_custodios' ? 0 : 1;
          const prioridadTipoB = b.fuente === 'pc_custodios' ? 0 : 1;
          
          if (prioridadTipoA !== prioridadTipoB) {
            return prioridadTipoA - prioridadTipoB;
          }
          
          // Luego por scoring de proximidad
          const scoreA = a.scoring_proximidad?.score_total || 0;
          const scoreB = b.scoring_proximidad?.score_total || 0;
          
          return scoreB - scoreA;
        });
      }

      return custodiosProcesados;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000 // Refetch cada 10 minutos
  });
}

/**
 * Hook simplificado para obtener solo los servicios próximos para análisis
 */
export function useServiciosProximos(horasAtras: number = 12, horasAdelante: number = 12) {
  return useQuery({
    queryKey: ['servicios-proximos', horasAtras, horasAdelante],
    queryFn: async (): Promise<ServicioHistorico[]> => {
      const fechaHoy = new Date();
      const fechaInicio = new Date(fechaHoy);
      fechaInicio.setHours(fechaHoy.getHours() - horasAtras);
      const fechaFin = new Date(fechaHoy);
      fechaFin.setHours(fechaHoy.getHours() + horasAdelante);

      const { data, error } = await supabase
        .from('servicios_custodia')
        .select(`
          id,
          fecha_hora_cita,
          origen,
          destino,
          estado,
          nombre_custodio,
          tipo_servicio,
          km_recorridos
        `)
        .gte('fecha_hora_cita', fechaInicio.toISOString())
        .lte('fecha_hora_cita', fechaFin.toISOString())
        .in('estado', ['finalizado', 'en_progreso', 'programado'])
        .order('fecha_hora_cita', { ascending: true });

      if (error) {
        console.error('Error fetching servicios próximos:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000 // Refetch cada 5 minutos
  });
}