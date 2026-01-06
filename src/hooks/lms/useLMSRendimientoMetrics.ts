import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LMSRendimientoMetrics, QuizRendimiento, RangoCalificacion } from "@/types/lms-reports";

export const useLMSRendimientoMetrics = () => {
  return useQuery({
    queryKey: ['lms-rendimiento-metrics'],
    queryFn: async (): Promise<LMSRendimientoMetrics> => {
      // 1. Obtener todos los progresos de quizzes (donde hay puntaje)
      const { data: progresoData, error: progresoError } = await supabase
        .from('lms_progreso')
        .select('contenido_id, quiz_mejor_puntaje, quiz_intentos')
        .not('quiz_mejor_puntaje', 'is', null);

      if (progresoError) throw progresoError;
      const progresos = progresoData || [];

      // 2. Calificación promedio general
      const puntajesValidos = progresos.filter(p => p.quiz_mejor_puntaje !== null);
      const sumaCalificaciones = puntajesValidos.reduce((sum, p) => sum + (p.quiz_mejor_puntaje || 0), 0);
      const calificacionPromedioGeneral = puntajesValidos.length > 0 
        ? Math.round(sumaCalificaciones / puntajesValidos.length) 
        : 0;

      // 3. Tasa de aprobación general (≥70% se considera aprobado)
      const aprobados = progresos.filter(p => (p.quiz_mejor_puntaje ?? 0) >= 70).length;
      const tasaAprobacionGeneral = progresos.length > 0 
        ? Math.round((aprobados / progresos.length) * 100) 
        : 0;

      // 4. Quizzes perfectos (100%)
      const quizzesPerfectos = progresos.filter(p => p.quiz_mejor_puntaje === 100).length;

      // 5. Intentos promedio general
      const sumaIntentos = progresos.reduce((sum, p) => sum + (p.quiz_intentos || 1), 0);
      const intentosPromedioGeneral = progresos.length > 0 
        ? Math.round((sumaIntentos / progresos.length) * 10) / 10 
        : 0;

      // 6. Obtener contenidos (quizzes) para mapear nombres
      const { data: contenidosData } = await supabase
        .from('lms_contenidos')
        .select('id, titulo, modulo_id')
        .eq('tipo', 'quiz');

      const contenidosMap = new Map((contenidosData || []).map(c => [c.id, { titulo: c.titulo, moduloId: c.modulo_id }]));

      // Obtener módulos para obtener nombres de cursos
      const { data: modulosData } = await supabase
        .from('lms_modulos')
        .select('id, curso_id');

      const modulosMap = new Map((modulosData || []).map(m => [m.id, m.curso_id]));

      const { data: cursosData } = await supabase
        .from('lms_cursos')
        .select('id, titulo');

      const cursosMap = new Map((cursosData || []).map(c => [c.id, c.titulo]));

      // 7. Agrupar por quiz para calcular rendimiento
      const quizzesAgrupados = progresos.reduce((acc, p) => {
        if (!acc[p.contenido_id]) {
          acc[p.contenido_id] = { puntajes: [], intentos: [], aprobados: 0 };
        }
        const puntaje = p.quiz_mejor_puntaje || 0;
        acc[p.contenido_id].puntajes.push(puntaje);
        acc[p.contenido_id].intentos.push(p.quiz_intentos || 1);
        if (puntaje >= 70) {
          acc[p.contenido_id].aprobados++;
        }
        return acc;
      }, {} as Record<string, { puntajes: number[]; intentos: number[]; aprobados: number }>);

      const quizzesPorRendimiento: QuizRendimiento[] = Object.entries(quizzesAgrupados)
        .map(([contenidoId, data]) => {
          const info = contenidosMap.get(contenidoId);
          const moduloId = info?.moduloId;
          const cursoId = moduloId ? modulosMap.get(moduloId) : undefined;
          const cursoTitulo = cursoId ? cursosMap.get(cursoId) : 'Curso desconocido';

          const promPuntaje = data.puntajes.length > 0 
            ? data.puntajes.reduce((a, b) => a + b, 0) / data.puntajes.length 
            : 0;
          const promIntentos = data.intentos.length > 0 
            ? data.intentos.reduce((a, b) => a + b, 0) / data.intentos.length 
            : 0;
          const tasaAprobacion = data.puntajes.length > 0 
            ? (data.aprobados / data.puntajes.length) * 100 
            : 0;

          return {
            contenidoId,
            titulo: info?.titulo || 'Quiz desconocido',
            cursoTitulo: cursoTitulo || 'Curso desconocido',
            calificacionPromedio: Math.round(promPuntaje),
            intentosPromedio: Math.round(promIntentos * 10) / 10,
            tasaAprobacion: Math.round(tasaAprobacion),
            totalIntentos: data.puntajes.length
          };
        })
        .sort((a, b) => a.tasaAprobacion - b.tasaAprobacion); // Más difíciles primero

      // 8. Distribución de calificaciones por rangos
      const rangos = [
        { min: 0, max: 20, label: '0-20%' },
        { min: 21, max: 40, label: '21-40%' },
        { min: 41, max: 60, label: '41-60%' },
        { min: 61, max: 80, label: '61-80%' },
        { min: 81, max: 100, label: '81-100%' }
      ];

      const distribucionCalificaciones: RangoCalificacion[] = rangos.map(rango => {
        const cantidad = puntajesValidos.filter(p => {
          const puntaje = p.quiz_mejor_puntaje || 0;
          return puntaje >= rango.min && puntaje <= rango.max;
        }).length;
        return {
          rango: rango.label,
          cantidad,
          porcentaje: puntajesValidos.length > 0 
            ? Math.round((cantidad / puntajesValidos.length) * 100) 
            : 0
        };
      });

      return {
        calificacionPromedioGeneral,
        tasaAprobacionGeneral,
        quizzesPerfectos,
        intentosPromedioGeneral,
        quizzesPorRendimiento,
        distribucionCalificaciones
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
