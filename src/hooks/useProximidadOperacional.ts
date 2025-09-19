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

// Función auxiliar para normalizar nombres y detectar duplicados
const normalizarNombre = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Función para detectar duplicados por nombre
const sonNombresSimilares = (nombre1: string, nombre2: string): boolean => {
  const norm1 = normalizarNombre(nombre1);
  const norm2 = normalizarNombre(nombre2);
  
  // Exacto match
  if (norm1 === norm2) return true;
  
  // Verificar si uno contiene al otro (para casos como "Juan" vs "Juan Carlos")
  const palabras1 = norm1.split(' ');
  const palabras2 = norm2.split(' ');
  
  // Si ambos nombres tienen al menos 2 palabras en común
  const palabrasComunes = palabras1.filter(p1 => 
    palabras2.some(p2 => p1 === p2 && p1.length > 2)
  ).length;
  
  return palabrasComunes >= 2;
};

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
          certificaciones,
          comentarios,
          zona_base,
          tiene_gadgets,
          created_at,
          updated_at
        `)
        .eq('estado', 'activo');

      if (pcError) {
        console.error('Error fetching pc_custodios:', pcError);
      }

      // 2. Obtener candidatos de candidatos_custodios (incluir más estados)
      const { data: candidatosCustodios, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select(`
          id,
          nombre,
          telefono,
          email,
          estado_proceso,
          created_at,
          updated_at
        `)
        .in('estado_proceso', ['activo', 'aprobado', 'pendiente_aprobacion']);

      if (candidatosError) {
        console.error('Error fetching candidatos_custodios:', candidatosError);
      }

      // 3. Obtener custodios históricos como fallback (últimos 3 meses)
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - 3);

      const { data: custodiosHistoricos, error: historicosError } = await supabase
        .from('servicios_custodia')
        .select(`
          id,
          nombre_custodio,
          fecha_hora_cita,
          origen,
          destino,
          tipo_servicio,
          estado
        `)
        .not('nombre_custodio', 'is', null)
        .gte('fecha_hora_cita', fechaLimite.toISOString())
        .ilike('estado', 'finalizado')
        .order('fecha_hora_cita', { ascending: false })
        .limit(100);

      if (historicosError) {
        console.error('Error fetching servicios_custodia:', historicosError);
      }

      // Eliminar duplicados usando comparación de nombres
      const eliminarDuplicados = (custodios: CustodioConHistorial[]): CustodioConHistorial[] => {
        const custodiosUnicos: CustodioConHistorial[] = [];
        const nombresVistos = new Set<string>();
        
        // Priorizar por fuente: pc_custodios > candidatos_custodios > historico
        const custodiosOrdenados = [...custodios].sort((a, b) => {
          const prioridadFuente = { 'pc_custodios': 0, 'candidatos_custodios': 1, 'historico': 2 };
          return prioridadFuente[a.fuente] - prioridadFuente[b.fuente];
        });
        
        for (const custodio of custodiosOrdenados) {
          if (!custodio.nombre) continue;
          
          const nombreNormalizado = normalizarNombre(custodio.nombre);
          
          // Verificar si ya existe un nombre similar
          const yaExiste = custodiosUnicos.some(existente => 
            sonNombresSimilares(existente.nombre, custodio.nombre)
          );
          
          if (!yaExiste && !nombresVistos.has(nombreNormalizado)) {
            custodiosUnicos.push(custodio);
            nombresVistos.add(nombreNormalizado);
          }
        }
        
        return custodiosUnicos;
      };

      // Procesar y combinar todos los custodios
      const todosCustodios: CustodioConHistorial[] = [
        // PC Custodios
        ...(pcCustodios || []).map(custodio => ({
          id: custodio.id,
          nombre: custodio.nombre,
          disponibilidad: custodio.disponibilidad,
          estado: custodio.estado,
          rating_promedio: custodio.rating_promedio,
          numero_servicios: 0, // Default value since this field doesn't exist in pc_custodios
          certificaciones: custodio.certificaciones || [],
          comentarios: custodio.comentarios,
          zona_base: custodio.zona_base,
          tiene_gadgets: custodio.tiene_gadgets || false,
          servicios_historicos: [],
          fuente: 'pc_custodios' as const,
          created_at: custodio.created_at,
          updated_at: custodio.updated_at
        })),
        
        // Candidatos custodios
        ...(candidatosCustodios || []).map(candidato => ({
          id: candidato.id,
          nombre: candidato.nombre,
          telefono: candidato.telefono,
          email: candidato.email,
          estado_proceso: candidato.estado_proceso,
          disponibilidad: 'disponible' as const,
          estado: 'candidato' as const,
          rating_promedio: null,
          numero_servicios: 0,
          certificaciones: [],
          comentarios: null,
          zona_base: null,
          tiene_gadgets: false,
          servicios_historicos: [],
          fuente: 'candidatos_custodios' as const,
          created_at: candidato.created_at,
          updated_at: candidato.updated_at
        })),
        
        // Custodios históricos (como fallback)
        ...(custodiosHistoricos || []).map(historico => ({
          id: `historico_${historico.nombre_custodio?.replace(/\s+/g, '_')}_${Math.random()}`,
          nombre: historico.nombre_custodio || 'Custodio Desconocido',
          disponibilidad: 'inactivo' as const,
          estado: 'historico' as const,
          rating_promedio: null,
          numero_servicios: 1, // Al menos tuvo un servicio
          certificaciones: [],
          comentarios: 'Custodio identificado en registros históricos - sujeto a validación',
          zona_base: null,
          tiene_gadgets: false,
          servicios_historicos: [{
            id: historico.id,
            fecha_hora_cita: historico.fecha_hora_cita,
            origen: historico.origen,
            destino: historico.destino,
            estado: historico.estado,
            nombre_custodio: historico.nombre_custodio,
            tipo_servicio: historico.tipo_servicio
          }],
          fuente: 'historico' as const,
          created_at: historico.fecha_hora_cita,
          updated_at: historico.fecha_hora_cita
        }))
      ];
      
      // Eliminar duplicados
      const custodiosFormateados = eliminarDuplicados(todosCustodios);

      console.log(`📊 Custodios encontrados:`, {
        pc_custodios: pcCustodios?.length || 0,
        candidatos: candidatosCustodios?.length || 0,
        historicos: custodiosHistoricos?.length || 0,
        total_antes_deduplicacion: todosCustodios.length,
        total_despues_deduplicacion: custodiosFormateados.length,
        fallback_historicos_activo: custodiosFormateados.some(c => c.fuente === 'historico'),
        estados_candidatos: candidatosCustodios?.map(c => c.estado_proceso) || [],
        nombres_custodios: custodiosFormateados.map(c => `${c.nombre} (${c.fuente})`).slice(0, 10)
      });

      // Si tenemos un servicio nuevo, calcular proximidad operacional para cada custodio
      if (servicioNuevo) {
        // Obtener servicios próximos para análisis temporal
        const fechaHoy = new Date();
        const fechaInicio = new Date(fechaHoy);
        fechaInicio.setHours(fechaHoy.getHours() - 12);
        const fechaFin = new Date(fechaHoy);
        fechaFin.setHours(fechaHoy.getHours() + 12);

        const { data: serviciosProximos } = await supabase
          .from('servicios_custodia')
          .select(`
            id,
            nombre_custodio,
            fecha_hora_cita,
            origen,
            destino,
            tipo_servicio,
            estado
          `)
          .gte('fecha_hora_cita', fechaInicio.toISOString())
          .lte('fecha_hora_cita', fechaFin.toISOString())
          .not('nombre_custodio', 'is', null);

        // Calcular scoring de proximidad para cada custodio
        const custodiosConScoring = await Promise.all(
          custodiosFormateados.map(async (custodio) => {
            try {
              // Obtener servicios históricos del custodio para análisis de patrones
              const { data: serviciosHistoricosCustodio } = await supabase
                .from('servicios_custodia')
                .select(`
                  id,
                  nombre_custodio,
                  fecha_hora_cita,
                  origen,
                  destino,
                  tipo_servicio,
                  estado
                `)
                .eq('nombre_custodio', custodio.nombre)
                .ilike('estado', 'finalizado')
                .order('fecha_hora_cita', { ascending: false })
                .limit(10);

              // Actualizar servicios históricos
              const custodioActualizado: CustodioConHistorial = {
                ...custodio,
                servicios_historicos: (serviciosHistoricosCustodio || []).map(servicio => ({
                  id: servicio.id,
                  fecha_hora_cita: servicio.fecha_hora_cita,
                  origen: servicio.origen,
                  destino: servicio.destino,
                  estado: servicio.estado,
                  nombre_custodio: servicio.nombre_custodio,
                  tipo_servicio: servicio.tipo_servicio
                }))
              };

              // Analizar patrones de trabajo
              const patrones = analizarPatronesTrabajoCustomdio(custodioActualizado.servicios_historicos || []);
              custodioActualizado.ciudades_frecuentes = patrones.ciudades_frecuentes;

              // Calcular proximidad operacional
              const scoring = calcularProximidadOperacional(
                custodioActualizado,
                servicioNuevo,
                (serviciosProximos || []).map(servicio => ({
                  id: servicio.id,
                  fecha_hora_cita: servicio.fecha_hora_cita,
                  origen: servicio.origen,
                  destino: servicio.destino,
                  estado: servicio.estado,
                  nombre_custodio: servicio.nombre_custodio,
                  tipo_servicio: servicio.tipo_servicio
                }))
              );

              // Generar razones de recomendación
              const razones = generarRazonesRecomendacion(scoring, custodioActualizado);

              // Determinar prioridad de asignación
              let prioridad: 'alta' | 'media' | 'baja' = 'baja';
              if (scoring.score_total >= 80) {
                prioridad = 'alta';
              } else if (scoring.score_total >= 60) {
                prioridad = 'media';
              }

              return {
                ...custodioActualizado,
                scoring_proximidad: scoring,
                razones_recomendacion: razones,
                prioridad_asignacion: prioridad
              };
            } catch (error) {
              console.error(`Error processing custodio ${custodio.nombre}:`, error);
              return {
                ...custodio,
                servicios_historicos: [],
                scoring_proximidad: {
                  score_total: 50,
                  score_temporal: 50,
                  score_geografico: 50,
                  score_operacional: 50,
                  detalles: {
                    razones: []
                  }
                },
                razones_recomendacion: [],
                prioridad_asignacion: 'baja' as const
              };
            }
          })
        );

        // Ordenar por fuente y luego por score
        return custodiosConScoring.sort((a, b) => {
          // Primero por fuente (pc_custodios > candidatos > historico)
          const prioridadFuente = { 'pc_custodios': 0, 'candidatos_custodios': 1, 'historico': 2 };
          const diffFuente = prioridadFuente[a.fuente] - prioridadFuente[b.fuente];
          if (diffFuente !== 0) return diffFuente;
          
          // Luego por score de proximidad
          const scoreA = a.scoring_proximidad?.score_total || 0;
          const scoreB = b.scoring_proximidad?.score_total || 0;
          return scoreB - scoreA;
        });
      }

      // Si no hay servicio nuevo, devolver custodios sin scoring
      return custodiosFormateados.map(custodio => ({
        ...custodio,
        servicios_historicos: [],
        scoring_proximidad: {
          score_total: 50,
          score_temporal: 50,
          score_geografico: 50,
          score_operacional: 50,
          detalles: {
            razones: []
          }
        },
        razones_recomendacion: [],
        prioridad_asignacion: 'media' as const
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });
}

/**
 * Hook auxiliar para obtener servicios próximos en una ventana de tiempo
 */
export function useServiciosProximos(ventanaHoras: number = 12) {
  return useQuery({
    queryKey: ['servicios-proximos', ventanaHoras],
    queryFn: async (): Promise<ServicioHistorico[]> => {
      const fechaHoy = new Date();
      const fechaInicio = new Date(fechaHoy);
      fechaInicio.setHours(fechaHoy.getHours() - ventanaHoras);
      const fechaFin = new Date(fechaHoy);
      fechaFin.setHours(fechaHoy.getHours() + ventanaHoras);

      const { data, error } = await supabase
        .from('servicios_custodia')
        .select(`
          id,
          nombre_custodio,
          fecha_hora_cita,
          origen,
          destino,
          tipo_servicio,
          estado
        `)
        .gte('fecha_hora_cita', fechaInicio.toISOString())
        .lte('fecha_hora_cita', fechaFin.toISOString())
        .not('nombre_custodio', 'is', null);

      if (error) {
        console.error('Error fetching servicios próximos:', error);
        return [];
      }

      return data?.map(servicio => ({
        id: servicio.id,
        fecha_hora_cita: servicio.fecha_hora_cita,
        origen: servicio.origen,
        destino: servicio.destino,
        estado: servicio.estado,
        nombre_custodio: servicio.nombre_custodio,
        tipo_servicio: servicio.tipo_servicio
      })) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false
  });
}