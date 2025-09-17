
// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRendimientoWorkflow = () => {
  // Obtener métricas generales del workflow
  const { data: metricas, isLoading: loadingMetricas } = useQuery({
    queryKey: ['metricas-workflow'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select(`
          *,
          aprobacion_coordinador(fecha_respuesta),
          analisis_riesgo_seguridad(fecha_analisis),
          programacion_instalaciones(fecha_programada, fecha_completada)
        `)
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;

      // Calcular métricas
      const totalServicios = data.length;
      const serviciosActivos = data.filter(s => s.estado_general === 'servicio_activo').length;
      const serviciosEnProceso = data.filter(s => 
        !['servicio_activo', 'rechazado', 'cancelado', 'suspendido'].includes(s.estado_general)
      ).length;
      
      // Calcular tiempos promedio
      const tiemposAprobacion = data
        .filter(s => s.aprobacion_coordinador?.[0]?.fecha_respuesta)
        .map(s => {
          const inicio = new Date(s.fecha_solicitud);
          const fin = new Date(s.aprobacion_coordinador[0].fecha_respuesta);
          return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60); // horas
        });

      const tiempoPromedioAprobacion = tiemposAprobacion.length > 0 
        ? tiemposAprobacion.reduce((a, b) => a + b, 0) / tiemposAprobacion.length 
        : 0;

      return {
        totalServicios,
        serviciosActivos,
        serviciosEnProceso,
        tiempoPromedioAprobacion: Math.round(tiempoPromedioAprobacion * 10) / 10,
        tasaCompletacion: totalServicios > 0 ? Math.round((serviciosActivos / totalServicios) * 100) : 0
      };
    }
  });

  // Obtener distribución de servicios por etapa
  const { data: distribucionEtapas, isLoading: loadingDistribucion } = useQuery({
    queryKey: ['distribucion-etapas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select('estado_general')
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;

      // Agrupar por estado
      const distribucion = data.reduce((acc, servicio) => {
        const estado = servicio.estado_general || 'sin_estado';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convertir a array para gráficos
      const etapasOrdenadas = [
        'pendiente_evaluacion',
        'pendiente_analisis_riesgo',
        'en_evaluacion_riesgo',
        'programacion_instalacion',
        'instalacion_programada',
        'en_instalacion',
        'instalacion_completada',
        'servicio_activo',
        'rechazado',
        'cancelado'
      ];

      return etapasOrdenadas.map(etapa => ({
        etapa,
        cantidad: distribucion[etapa] || 0,
        nombre: getNombreEtapa(etapa)
      }));
    }
  });

  // Obtener cuellos de botella
  const { data: cuellosBottella, isLoading: loadingCuellos } = useQuery({
    queryKey: ['cuellos-botella'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select(`
          id,
          estado_general,
          fecha_solicitud,
          aprobacion_coordinador(fecha_respuesta),
          analisis_riesgo_seguridad(fecha_analisis)
        `)
        .order('fecha_solicitud', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Identificar servicios que llevan mucho tiempo en una etapa
      const ahora = new Date();
      const cuellos = data
        .filter(servicio => {
          const diasEnEtapa = (ahora.getTime() - new Date(servicio.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24);
          return diasEnEtapa > 3 && !['servicio_activo', 'rechazado', 'cancelado'].includes(servicio.estado_general);
        })
        .map(servicio => {
          const diasEnEtapa = Math.floor((ahora.getTime() - new Date(servicio.fecha_solicitud).getTime()) / (1000 * 60 * 60 * 24));
          return {
            ...servicio,
            diasEnEtapa,
            prioridad: diasEnEtapa > 7 ? 'alta' : diasEnEtapa > 5 ? 'media' : 'baja'
          };
        })
        .sort((a, b) => b.diasEnEtapa - a.diasEnEtapa);

      return cuellos;
    }
  });

  return {
    metricas,
    loadingMetricas,
    distribucionEtapas,
    loadingDistribucion,
    cuellosBottella,
    loadingCuellos
  };
};

const getNombreEtapa = (estado: string): string => {
  const nombres: Record<string, string> = {
    'pendiente_evaluacion': 'Pendiente Evaluación',
    'pendiente_analisis_riesgo': 'Pendiente Análisis Riesgo',
    'en_evaluacion_riesgo': 'En Evaluación Riesgo',
    'programacion_instalacion': 'Programación Instalación',
    'instalacion_programada': 'Instalación Programada',
    'en_instalacion': 'En Instalación',
    'instalacion_completada': 'Instalación Completada',
    'servicio_activo': 'Servicio Activo',
    'rechazado': 'Rechazado',
    'cancelado': 'Cancelado'
  };
  return nombres[estado] || estado;
};
