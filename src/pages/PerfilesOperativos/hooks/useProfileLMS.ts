import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LMSInscripcion {
  id: string;
  estado: string;
  progreso_porcentaje: number;
  calificacion_final: number | null;
  fecha_inscripcion: string;
  certificado_generado: boolean;
  curso: {
    id: string;
    titulo: string;
    codigo: string;
  } | null;
}

export interface LMSCertificado {
  id: string;
  codigo_verificacion: string;
  fecha_emision: string;
  curso_titulo: string;
}

export interface LMSBadge {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  fecha_obtencion: string;
}

export function useProfileLMSInscripciones(userId: string | null) {
  return useQuery({
    queryKey: ['profile-lms-inscripciones', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('lms_inscripciones')
        .select(`
          id,
          estado,
          progreso_porcentaje,
          calificacion_final,
          fecha_inscripcion,
          certificado_generado,
          curso:lms_cursos(id, titulo, codigo)
        `)
        .eq('usuario_id', userId)
        .order('fecha_inscripcion', { ascending: false });
      
      if (error) {
        console.error('Error fetching LMS inscripciones:', error);
        return [];
      }
      
      // Transform array relation to single object
      return (data || []).map(item => ({
        ...item,
        curso: Array.isArray(item.curso) ? item.curso[0] : item.curso
      })) as LMSInscripcion[];
    },
    enabled: !!userId
  });
}

export function useProfileLMSCertificados(userId: string | null) {
  return useQuery({
    queryKey: ['profile-lms-certificados', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('lms_certificados')
        .select(`
          id,
          codigo_verificacion,
          fecha_emision,
          inscripcion:lms_inscripciones(
            curso:lms_cursos(titulo)
          )
        `)
        .eq('usuario_id', userId)
        .order('fecha_emision', { ascending: false });
      
      if (error) {
        console.error('Error fetching LMS certificados:', error);
        return [];
      }
      
      // Transform data to flatten nested structure
      return data.map(cert => ({
        id: cert.id,
        codigo_verificacion: cert.codigo_verificacion,
        fecha_emision: cert.fecha_emision,
        curso_titulo: (cert.inscripcion as any)?.curso?.titulo || 'Curso'
      })) as LMSCertificado[];
    },
    enabled: !!userId
  });
}

export function useProfileLMSBadges(userId: string | null) {
  return useQuery({
    queryKey: ['profile-lms-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('lms_usuarios_badges')
        .select(`
          id,
          fecha_obtencion,
          badge:lms_badges(nombre, descripcion, icono)
        `)
        .eq('usuario_id', userId)
        .order('fecha_obtencion', { ascending: false });
      
      if (error) {
        console.error('Error fetching LMS badges:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        nombre: (item.badge as any)?.nombre || 'Badge',
        descripcion: (item.badge as any)?.descripcion || '',
        icono: (item.badge as any)?.icono || '🏆',
        fecha_obtencion: item.fecha_obtencion
      })) as LMSBadge[];
    },
    enabled: !!userId
  });
}

export function useLMSStats(userId: string | null) {
  const { data: inscripciones, isLoading: loadingInsc } = useProfileLMSInscripciones(userId);
  const { data: certificados, isLoading: loadingCert } = useProfileLMSCertificados(userId);
  const { data: badges, isLoading: loadingBadges } = useProfileLMSBadges(userId);
  
  const stats = {
    cursosInscritos: inscripciones?.length || 0,
    cursosCompletados: inscripciones?.filter(i => i.estado === 'completado').length || 0,
    progresoPromedio: inscripciones?.length 
      ? Math.round(inscripciones.reduce((acc, i) => acc + i.progreso_porcentaje, 0) / inscripciones.length)
      : 0,
    certificados: certificados?.length || 0,
    badges: badges?.length || 0
  };
  
  return { 
    stats, 
    isLoading: loadingInsc || loadingCert || loadingBadges,
    inscripciones,
    certificados,
    badges
  };
}
