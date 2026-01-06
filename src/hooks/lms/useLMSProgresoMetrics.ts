import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LMSProgresoMetrics, ProgresoPorCurso, ContenidoVisto } from "@/types/lms-reports";
import { startOfDay, endOfDay } from "date-fns";

export const useLMSProgresoMetrics = () => {
  return useQuery({
    queryKey: ['lms-progreso-metrics'],
    queryFn: async (): Promise<LMSProgresoMetrics> => {
      const hoy = new Date();
      const inicioHoy = startOfDay(hoy).toISOString();
      const finHoy = endOfDay(hoy).toISOString();

      // 1. Obtener inscripciones con progreso
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('lms_inscripciones')
        .select('id, curso_id, progreso_porcentaje, estado, usuario_id');

      if (inscripcionesError) throw inscripcionesError;
      const inscripciones = inscripcionesData || [];

      // 2. Progreso promedio general
      const progresoTotal = inscripciones.reduce((sum, i) => sum + (i.progreso_porcentaje || 0), 0);
      const progresoPromedioGeneral = inscripciones.length > 0 
        ? Math.round(progresoTotal / inscripciones.length) 
        : 0;

      // 3. Tasa de completación
      const completados = inscripciones.filter(i => i.estado === 'completado').length;
      const tasaCompletacion = inscripciones.length > 0 
        ? Math.round((completados / inscripciones.length) * 100) 
        : 0;

      // 4. Contenidos completados hoy
      const { count: contenidosHoy, error: contenidosHoyError } = await supabase
        .from('lms_progreso')
        .select('*', { count: 'exact', head: true })
        .eq('completado', true)
        .gte('fecha_completado', inicioHoy)
        .lte('fecha_completado', finHoy);

      if (contenidosHoyError) throw contenidosHoyError;
      const contenidosCompletadosHoy = contenidosHoy || 0;

      // 5. Tiempo promedio por sesión (basado en tiempo_dedicado_seg)
      const { data: progresoData, error: progresoError } = await supabase
        .from('lms_progreso')
        .select('tiempo_dedicado_seg, contenido_id, veces_visto');

      if (progresoError) throw progresoError;
      const progresos = progresoData || [];

      const tiempoTotal = progresos.reduce((sum, p) => sum + (p.tiempo_dedicado_seg || 0), 0);
      const sesiones = progresos.filter(p => (p.tiempo_dedicado_seg || 0) > 0).length;
      const tiempoPromedioSesionMin = sesiones > 0 
        ? Math.round((tiempoTotal / sesiones) / 60) 
        : 0;

      // 6. Obtener cursos para mapear nombres
      const { data: cursosData } = await supabase
        .from('lms_cursos')
        .select('id, titulo');

      const cursosMap = new Map((cursosData || []).map(c => [c.id, c.titulo]));

      // 7. Progreso promedio por curso
      const cursosAgrupados = inscripciones.reduce((acc, i) => {
        if (!acc[i.curso_id]) {
          acc[i.curso_id] = { progresos: [], completados: 0 };
        }
        acc[i.curso_id].progresos.push(i.progreso_porcentaje || 0);
        if (i.estado === 'completado') {
          acc[i.curso_id].completados++;
        }
        return acc;
      }, {} as Record<string, { progresos: number[]; completados: number }>);

      const progresoPromedioPorCurso: ProgresoPorCurso[] = Object.entries(cursosAgrupados)
        .map(([cursoId, data]) => {
          const promedio = data.progresos.length > 0 
            ? data.progresos.reduce((a, b) => a + b, 0) / data.progresos.length 
            : 0;
          const inscritos = data.progresos.length;
          const abandonados = data.progresos.filter(p => p > 0 && p < 100).length;
          return {
            cursoId,
            titulo: cursosMap.get(cursoId) || 'Curso desconocido',
            progresoPromedio: Math.round(promedio),
            inscritos,
            completados: data.completados,
            tasaAbandono: inscritos > 0 ? Math.round((abandonados / inscritos) * 100) : 0
          };
        })
        .sort((a, b) => b.inscritos - a.inscritos);

      // 8. Contenidos más vistos
      const { data: contenidosData } = await supabase
        .from('lms_contenidos')
        .select('id, titulo, tipo');

      const contenidosMap = new Map((contenidosData || []).map(c => [c.id, { titulo: c.titulo, tipo: c.tipo }]));

      const vistasAgrupadas = progresos.reduce((acc, p) => {
        acc[p.contenido_id] = (acc[p.contenido_id] || 0) + (p.veces_visto || 1);
        return acc;
      }, {} as Record<string, number>);

      const contenidosMasVistos: ContenidoVisto[] = Object.entries(vistasAgrupadas)
        .map(([contenidoId, vistas]) => {
          const info = contenidosMap.get(contenidoId);
          return {
            contenidoId,
            titulo: info?.titulo || 'Contenido desconocido',
            tipo: info?.tipo || 'desconocido',
            vistas
          };
        })
        .sort((a, b) => b.vistas - a.vistas)
        .slice(0, 10);

      // 9. Distribución por tipo de contenido
      const tiposCount = (contenidosData || []).reduce((acc, c) => {
        acc[c.tipo] = (acc[c.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        progresoPromedioGeneral,
        tasaCompletacion,
        contenidosCompletadosHoy,
        tiempoPromedioSesionMin,
        progresoPromedioPorCurso,
        contenidosMasVistos,
        distribucionPorTipo: tiposCount
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
