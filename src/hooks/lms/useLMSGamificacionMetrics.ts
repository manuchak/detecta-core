import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LMSGamificacionMetrics, DistribucionNivel, TopUsuario, BadgeComun } from "@/types/lms-reports";

export const useLMSGamificacionMetrics = () => {
  return useQuery({
    queryKey: ['lms-gamificacion-metrics'],
    queryFn: async (): Promise<LMSGamificacionMetrics> => {
      // 1. Obtener todos los perfiles de gamificación
      const { data: perfilesData, error: perfilesError } = await supabase
        .from('lms_gamificacion_perfil')
        .select('usuario_id, puntos_totales, nivel, racha_actual, racha_maxima');

      if (perfilesError) throw perfilesError;
      const perfiles = perfilesData || [];

      // 2. Puntos totales otorgados
      const puntosTotalesOtorgados = perfiles.reduce((sum, p) => sum + (p.puntos_totales || 0), 0);

      // 3. Usuarios con puntos
      const usuariosConPuntos = perfiles.filter(p => (p.puntos_totales || 0) > 0).length;

      // 4. Nivel promedio
      const nivelesValidos = perfiles.filter(p => (p.nivel || 0) > 0);
      const sumaNiveles = nivelesValidos.reduce((sum, p) => sum + (p.nivel || 1), 0);
      const nivelPromedio = nivelesValidos.length > 0 
        ? Math.round((sumaNiveles / nivelesValidos.length) * 10) / 10 
        : 1;

      // 5. Racha promedio
      const rachasValidas = perfiles.filter(p => (p.racha_actual || 0) > 0);
      const sumaRachas = rachasValidas.reduce((sum, p) => sum + (p.racha_actual || 0), 0);
      const rachaPromedio = rachasValidas.length > 0 
        ? Math.round((sumaRachas / rachasValidas.length) * 10) / 10 
        : 0;

      // 6. Badges totales otorgados
      const { count: badgesCount, error: badgesCountError } = await supabase
        .from('lms_badges_usuario')
        .select('*', { count: 'exact', head: true });

      if (badgesCountError) throw badgesCountError;
      const badgesTotalesOtorgados = badgesCount || 0;

      // 7. Distribución por nivel (1-10)
      const nivelesCount: Record<number, number> = {};
      for (let i = 1; i <= 10; i++) {
        nivelesCount[i] = 0;
      }
      perfiles.forEach(p => {
        const nivel = p.nivel || 1;
        if (nivel >= 1 && nivel <= 10) {
          nivelesCount[nivel]++;
        }
      });

      const distribucionNiveles: DistribucionNivel[] = Object.entries(nivelesCount).map(([nivel, usuarios]) => ({
        nivel: parseInt(nivel),
        usuarios,
        porcentaje: perfiles.length > 0 ? Math.round((usuarios / perfiles.length) * 100) : 0
      }));

      // 8. Top 10 usuarios por puntos
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nombre_completo, email');

      const profilesMap = new Map((profilesData || []).map(p => [p.id, { nombre: p.nombre_completo, email: p.email }]));

      // Obtener badges por usuario
      const { data: badgesUsuarioData } = await supabase
        .from('lms_badges_usuario')
        .select('usuario_id');

      const badgesPorUsuario = (badgesUsuarioData || []).reduce((acc, b) => {
        acc[b.usuario_id] = (acc[b.usuario_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topUsuariosPorPuntos: TopUsuario[] = perfiles
        .filter(p => (p.puntos_totales || 0) > 0)
        .sort((a, b) => (b.puntos_totales || 0) - (a.puntos_totales || 0))
        .slice(0, 10)
        .map(p => {
          const profile = profilesMap.get(p.usuario_id);
          return {
            usuarioId: p.usuario_id,
            nombre: profile?.nombre || 'Usuario',
            email: profile?.email || '',
            puntos: p.puntos_totales || 0,
            nivel: p.nivel || 1,
            badges: badgesPorUsuario[p.usuario_id] || 0,
            rachaActual: p.racha_actual || 0
          };
        });

      // 9. Badges más comunes
      const { data: badgesData } = await supabase
        .from('lms_badges')
        .select('id, codigo, nombre');

      const badgesMap = new Map((badgesData || []).map(b => [b.id, { codigo: b.codigo, nombre: b.nombre }]));

      const { data: badgesUsuarioCompleto } = await supabase
        .from('lms_badges_usuario')
        .select('badge_id');

      const badgesConteo = (badgesUsuarioCompleto || []).reduce((acc, b) => {
        acc[b.badge_id] = (acc[b.badge_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const badgesMasComunes: BadgeComun[] = Object.entries(badgesConteo)
        .map(([badgeId, otorgados]) => {
          const info = badgesMap.get(badgeId);
          return {
            badgeId,
            codigo: info?.codigo || 'unknown',
            nombre: info?.nombre || 'Badge desconocido',
            otorgados
          };
        })
        .sort((a, b) => b.otorgados - a.otorgados)
        .slice(0, 5);

      return {
        puntosTotalesOtorgados,
        badgesTotalesOtorgados,
        nivelPromedio,
        rachaPromedio,
        usuariosConPuntos,
        distribucionNiveles,
        topUsuariosPorPuntos,
        badgesMasComunes
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
