import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook personalizado que envuelve useQuery con verificación de autenticación
 * Previene errores de React por queries ejecutándose antes de la autenticación
 */
export function useAuthenticatedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn' | 'enabled'> & {
    config?: 'standard' | 'static' | 'critical';
  }
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
    
    // Aplicar configuración optimizada basada en el tipo de query
    ...(options?.config ? AUTHENTICATED_QUERY_CONFIG[options.config] : AUTHENTICATED_QUERY_CONFIG.standard),
    
    // Las opciones personalizadas sobrescriben la configuración predeterminada
    ...options
  });
}

/**
 * Configuraciones de query optimizadas para diferentes casos de uso
 */
export const AUTHENTICATED_QUERY_CONFIG = {
  // Configuración estándar - datos que cambian regularmente
  standard: {
    retry: 1,
    retryDelay: 1000,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  },
  
  // Configuración para datos estáticos - cambian poco
  static: {
    retry: 1,
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // Configuración para datos críticos - necesitan estar frescos
  critical: {
    retry: 2,
    retryDelay: 500,
    staleTime: 10 * 1000, // 10 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000 // Refetch cada minuto
  }
} as const;