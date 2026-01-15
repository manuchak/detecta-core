import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'planificador' | 'supply_admin' | 'bi' | 
  'monitoring_supervisor' | 'monitoring' | 'supply' | 'soporte' | 'owner' |
  'custodio' | 'ejecutivo_ventas' | 'coordinador_operaciones' | 'tecnico_instalador' |
  'supply_lead' | 'capacitacion_admin';

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUserRoles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRoles([]);
        setPrimaryRole(null);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 1. Get server-validated primary role (rol efectivo/mayor)
      const { data: serverRole, error: serverRoleError } = await supabase.rpc('get_current_user_role_secure');
      
      if (serverRoleError) {
        console.error('Error fetching primary role from server:', serverRoleError);
      } else if (serverRole) {
        setPrimaryRole(serverRole as AppRole);
      }

      // 2. Get all ACTIVE roles for multi-role features (filter by is_active = true)
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true); // ← CRITICAL: Only active roles

      if (error) throw error;

      const activeRoles = data?.map(r => r.role as AppRole) || [];
      setRoles(activeRoles);
      
      // If no server role but we have active roles, use first active as fallback
      if (!serverRole && activeRoles.length > 0) {
        setPrimaryRole(activeRoles[0]);
      }
      
    } catch (error: any) {
      console.error('Error loading user roles:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los permisos del usuario',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUserRoles();
  }, [loadUserRoles]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((requiredRoles: AppRole[]): boolean => {
    return requiredRoles.some(role => roles.includes(role));
  }, [roles]);

  const isPlanificador = useCallback((): boolean => {
    return hasRole('planificador');
  }, [hasRole]);

  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['admin', 'owner', 'supply_admin']);
  }, [hasAnyRole]);

  return {
    roles,
    primaryRole, // ← NEW: Server-validated effective role
    userId,
    loading,
    hasRole,
    hasAnyRole,
    isPlanificador,
    isAdmin,
    refetch: loadUserRoles
  };
}
