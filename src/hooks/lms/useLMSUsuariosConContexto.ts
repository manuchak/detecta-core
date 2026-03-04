import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsuarioConContexto {
  id: string;
  display_name: string;
  email: string;
  roles: string[];
  cursosActivos: number;
  cursosCompletados: number;
  inscripciones: { curso_id: string; estado: string }[];
}

export const useLMSUsuariosConContexto = () => {
  return useQuery({
    queryKey: ['lms-usuarios-con-contexto'],
    queryFn: async (): Promise<UsuarioConContexto[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .order('display_name');

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.id);

      // Fetch roles and inscriptions in parallel
      const [rolesResult, inscripcionesResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds),
        supabase
          .from('lms_inscripciones')
          .select('usuario_id, curso_id, estado')
          .in('usuario_id', userIds),
      ]);

      // Build role map: user_id -> roles[]
      const rolesMap = new Map<string, string[]>();
      (rolesResult.data || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      // Build inscriptions map: user_id -> inscripciones[]
      const inscMap = new Map<string, { curso_id: string; estado: string }[]>();
      (inscripcionesResult.data || []).forEach(i => {
        const existing = inscMap.get(i.usuario_id) || [];
        existing.push({ curso_id: i.curso_id, estado: i.estado });
        inscMap.set(i.usuario_id, existing);
      });

      return profiles.map(p => {
        const inscripciones = inscMap.get(p.id) || [];
        return {
          id: p.id,
          display_name: p.display_name || p.email || 'Sin nombre',
          email: p.email || '',
          roles: rolesMap.get(p.id) || [],
          cursosActivos: inscripciones.filter(i => i.estado === 'inscrito' || i.estado === 'en_progreso').length,
          cursosCompletados: inscripciones.filter(i => i.estado === 'completado').length,
          inscripciones,
        };
      });
    },
    staleTime: 30000,
  });
};
