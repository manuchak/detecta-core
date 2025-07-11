import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook personalizado que envuelve useQuery con verificación de autenticación
 * Previene errores de React por queries ejecutándose antes de la autenticación
 */
export function useAuthenticatedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  const { user, loading: authLoading, userRole } = useAuth();

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Verificar sesión antes de ejecutar la query
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuario no autenticado - sesión inválida');
      }

      console.log(`🔍 Ejecutando query autenticada: ${queryKey.join('/')}`);
      console.log(`👤 Usuario: ${user?.email}, Rol: ${userRole}`);

      try {
        const result = await queryFn();
        console.log(`✅ Query exitosa: ${queryKey.join('/')}`);
        return result;
      } catch (error) {
        console.error(`❌ Error en query: ${queryKey.join('/')}`, error);
        throw error;
      }
    },
    enabled: !!user && !authLoading && !!userRole, // Solo ejecutar con autenticación completa
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 segundos de cache por defecto
    ...options
  });
}

/**
 * Patrón de configuración estándar para queries autenticadas
 */
export const AUTHENTICATED_QUERY_CONFIG = {
  retry: 1,
  retryDelay: 1000,
  staleTime: 30000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true
} as const;