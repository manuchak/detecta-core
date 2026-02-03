import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LMSAdopcionMetrics, InscripcionPorMes, CursoPopular } from "@/types/lms-reports";
import type { EstadoInscripcion } from "@/types/lms";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export const useLMSAdopcionMetrics = () => {
  return useQuery({
    queryKey: ['lms-adopcion-metrics'],
    queryFn: async (): Promise<LMSAdopcionMetrics> => {
      const now = new Date();
      const inicioMesActual = startOfMonth(now);
      const inicioMesPasado = startOfMonth(subMonths(now, 1));
      const finMesPasado = endOfMonth(subMonths(now, 1));

      // 1. Total de inscripciones y usuarios únicos
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('lms_inscripciones')
        .select('id, usuario_id, estado, fecha_inscripcion, curso_id');

      if (inscripcionesError) throw inscripcionesError;

      const inscripciones = inscripcionesData || [];
      const totalInscripciones = inscripciones.length;
      const usuariosUnicos = new Set(inscripciones.map(i => i.usuario_id));
      const usuariosConInscripciones = usuariosUnicos.size;

      // 2. Total usuarios activos (perfiles) - count all profiles
      const { count: totalUsuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usuariosError) {
        console.warn('Error fetching profiles count:', usuariosError);
        // Fallback: use unique users from inscriptions if profiles query fails
      }
      const totalUsuariosActivos = totalUsuarios || usuariosConInscripciones || 1;

      // 3. Tasa de adopción
      const tasaAdopcion = totalUsuariosActivos > 0 
        ? Math.round((usuariosConInscripciones / totalUsuariosActivos) * 100) 
        : 0;

      // 4. Inscripciones este mes vs mes pasado
      const inscripcionesEsteMes = inscripciones.filter(i => 
        new Date(i.fecha_inscripcion) >= inicioMesActual
      ).length;

      const inscripcionesMesPasado = inscripciones.filter(i => {
        const fecha = new Date(i.fecha_inscripcion);
        return fecha >= inicioMesPasado && fecha <= finMesPasado;
      }).length;

      // 5. Inscripciones por mes (últimos 6 meses)
      const inscripcionesPorMes: InscripcionPorMes[] = [];
      for (let i = 5; i >= 0; i--) {
        const mes = subMonths(now, i);
        const inicio = startOfMonth(mes);
        const fin = endOfMonth(mes);
        const count = inscripciones.filter(ins => {
          const fecha = new Date(ins.fecha_inscripcion);
          return fecha >= inicio && fecha <= fin;
        }).length;
        inscripcionesPorMes.push({
          mes: format(mes, 'MMM yyyy', { locale: es }),
          inscripciones: count
        });
      }

      // 6. Distribución por estado - Alineado con EstadoInscripcion de types/lms.ts
      const distribucionPorEstado: Record<EstadoInscripcion, number> = {
        inscrito: 0,
        en_progreso: 0,
        completado: 0,
        vencido: 0,
        abandonado: 0
      };
      inscripciones.forEach(i => {
        const estado = i.estado as EstadoInscripcion;
        if (estado in distribucionPorEstado) {
          distribucionPorEstado[estado]++;
        }
      });

      // 7. Cursos más populares
      const { data: cursosData } = await supabase
        .from('lms_cursos')
        .select('id, titulo');

      const cursosMap = new Map((cursosData || []).map(c => [c.id, c.titulo]));
      
      const inscripcionesPorCurso = inscripciones.reduce((acc, i) => {
        acc[i.curso_id] = (acc[i.curso_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const cursosMasPopulares: CursoPopular[] = Object.entries(inscripcionesPorCurso)
        .map(([cursoId, count]) => ({
          cursoId,
          titulo: cursosMap.get(cursoId) || 'Curso desconocido',
          inscripciones: count
        }))
        .sort((a, b) => b.inscripciones - a.inscripciones)
        .slice(0, 5);

      return {
        totalUsuariosActivos,
        usuariosConInscripciones,
        tasaAdopcion,
        totalInscripciones,
        inscripcionesEsteMes,
        inscripcionesMesPasado,
        inscripcionesPorMes,
        cursosMasPopulares,
        distribucionPorEstado
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
