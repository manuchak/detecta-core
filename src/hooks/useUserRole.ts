import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'planificador' | 'supply_admin' | 'bi' | 
  'monitoring_supervisor' | 'monitoring' | 'supply' | 'soporte' | 'owner' |
  'custodio' | 'ejecutivo_ventas' | 'coordinador_operaciones' | 'tecnico_instalador' |
  'supply_lead' | 'capacitacion_admin';

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRoles([]);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      setRoles(data?.map(r => r.role as AppRole) || []);
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
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (requiredRoles: AppRole[]): boolean => {
    return requiredRoles.some(role => roles.includes(role));
  };

  const isPlanificador = (): boolean => {
    return hasRole('planificador');
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['admin', 'owner', 'supply_admin']);
  };

  return {
    roles,
    userId,
    loading,
    hasRole,
    hasAnyRole,
    isPlanificador,
    isAdmin,
    refetch: loadUserRoles
  };
}
