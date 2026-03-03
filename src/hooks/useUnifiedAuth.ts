import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'owner' | 'supply_admin' | 'ejecutivo_ventas' | 'monitoring' | 'coordinador_operaciones' | 'jefe_seguridad' | 'analista_seguridad' | 'bi' | 'supply_lead' | 'supply' | 'planificador' | 'customer_success' | 'unverified';

export interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  permissions: {
    canViewLeads: boolean;
    canEditLeads: boolean;
    canManageUsers: boolean;
    canViewDashboard: boolean;
  };
}

// Definición unificada de permisos por rol
const ROLE_PERMISSIONS: Record<UserRole, AuthState['permissions']> = {
  admin: {
    canViewLeads: true,
    canEditLeads: true,
    canManageUsers: true,
    canViewDashboard: true,
  },
  owner: {
    canViewLeads: true,
    canEditLeads: true,
    canManageUsers: true,
    canViewDashboard: true,
  },
  supply_admin: {
    canViewLeads: true,
    canEditLeads: true,
    canManageUsers: false,
    canViewDashboard: true,
  },
  ejecutivo_ventas: {
    canViewLeads: true,
    canEditLeads: true,
    canManageUsers: false,
    canViewDashboard: false,
  },
  monitoring: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  coordinador_operaciones: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  jefe_seguridad: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  analista_seguridad: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  bi: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  supply_lead: {
    canViewLeads: true,
    canEditLeads: true,
    canManageUsers: false,
    canViewDashboard: true,
  },
  supply: {
    canViewLeads: true,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: false,
  },
  planificador: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  customer_success: {
    canViewLeads: true,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: true,
  },
  unverified: {
    canViewLeads: false,
    canEditLeads: false,
    canManageUsers: false,
    canViewDashboard: false,
  },
};

// Remove hardcoded email bypasses for security

export const useUnifiedAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userRole: null,
    loading: true,
    permissions: ROLE_PERMISSIONS.unverified,
  });

  const mountedRef = useRef(true);
  const roleResolvedRef = useRef(false);

  // Función para obtener rol de base de datos de manera segura
  const resolveUserRole = useCallback(async (user: User): Promise<UserRole> => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_role_secure');

      if (error) {
        console.warn('⚠️ Role DB query failed:', error);
        return 'unverified';
      }

      const role = data as UserRole;
      console.log(`🔍 DB role resolution: ${user.email} -> ${role}`);
      return role || 'unverified';
    } catch (error) {
      console.warn('⚠️ Role resolution error:', error);
      return 'unverified';
    }
  }, []);

  // Función para actualizar estado de manera atómica
  const updateAuthState = useCallback((
    user: User | null,
    session: Session | null,
    userRole: UserRole | null
  ) => {
    if (!mountedRef.current) return;

    const permissions = userRole ? ROLE_PERMISSIONS[userRole] : ROLE_PERMISSIONS.unverified;
    
    setAuthState(prev => ({
      ...prev,
      user,
      session,
      userRole,
      loading: false,
      permissions,
    }));

    console.log(`🔄 Auth state updated: ${user?.email || 'anonymous'} (${userRole})`);
  }, []); // Empty dependencies to prevent re-creation

  // Manejo de cambios de autenticación
  useEffect(() => {
    mountedRef.current = true;
    roleResolvedRef.current = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mountedRef.current) return;

        console.log(`🔐 Auth event: ${event}`);

        if (currentSession?.user && !roleResolvedRef.current) {
          // Marcar que estamos resolviendo el rol para evitar múltiples intentos
          roleResolvedRef.current = true;
          
          // Actualizar inmediatamente con loading
          setAuthState(prev => ({
            ...prev,
            user: currentSession.user,
            session: currentSession,
            loading: true,
          }));

          // Resolver rol de manera determinista
          try {
            const role = await resolveUserRole(currentSession.user);
            updateAuthState(currentSession.user, currentSession, role);
          } catch (error) {
            console.error('❌ Role resolution failed:', error);
            updateAuthState(currentSession.user, currentSession, 'unverified');
          }
        } else if (!currentSession?.user) {
          // Usuario desconectado
          roleResolvedRef.current = false;
          updateAuthState(null, null, null);
        }
      }
    );

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mountedRef.current) return;

      if (currentSession?.user) {
        // Misma lógica que en onAuthStateChange
        setAuthState(prev => ({
          ...prev,
          user: currentSession.user,
          session: currentSession,
          loading: true,
        }));

        resolveUserRole(currentSession.user).then(role => {
          if (mountedRef.current) {
            updateAuthState(currentSession.user, currentSession, role);
          }
        }).catch(error => {
          console.error('❌ Initial role resolution failed:', error);
          if (mountedRef.current) {
            updateAuthState(currentSession.user, currentSession, 'unverified');
          }
        });
      } else {
        updateAuthState(null, null, null);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // Remove dependencies to prevent re-running

  // Función para refrescar rol manualmente
  const refreshRole = useCallback(async () => {
    if (!authState.user || !mountedRef.current) return;

    roleResolvedRef.current = false;
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      const role = await resolveUserRole(authState.user);
      updateAuthState(authState.user, authState.session, role);
    } catch (error) {
      console.error('❌ Role refresh failed:', error);
      updateAuthState(authState.user, authState.session, 'unverified');
    }
  }, [authState.user, authState.session]); // Reduced dependencies

  return {
    ...authState,
    refreshRole,
    // Helper para verificar permisos específicos
    hasPermission: useCallback((permission: keyof AuthState['permissions']) => {
      return authState.permissions[permission];
    }, [authState.permissions]),
    // Helper para verificar roles específicos
    hasRole: useCallback((roles: UserRole | UserRole[]) => {
      if (!authState.userRole) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(authState.userRole);
    }, [authState.userRole]),
  };
};