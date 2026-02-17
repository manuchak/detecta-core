import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'owner' | 'supply_admin' | 'ejecutivo_ventas' | 'monitoring' | 'coordinador_operaciones' | 'jefe_seguridad' | 'analista_seguridad' | 'bi' | 'supply_lead' | 'supply' | 'custodio' | 'planificador' | 'unverified';

interface AuthPermissions {
  canViewLeads: boolean;
  canEditLeads: boolean;
  canManageUsers: boolean;
  canViewDashboard: boolean;
}

// Mapeo directo de permisos por rol (sin funciones complejas)
const PERMISSIONS_MAP: Record<UserRole, AuthPermissions> = {
  admin: { canViewLeads: true, canEditLeads: true, canManageUsers: true, canViewDashboard: true },
  owner: { canViewLeads: true, canEditLeads: true, canManageUsers: true, canViewDashboard: true },
  supply_admin: { canViewLeads: true, canEditLeads: true, canManageUsers: false, canViewDashboard: true },
  ejecutivo_ventas: { canViewLeads: true, canEditLeads: true, canManageUsers: false, canViewDashboard: false },
  supply_lead: { canViewLeads: true, canEditLeads: true, canManageUsers: false, canViewDashboard: true },
  supply: { canViewLeads: true, canEditLeads: false, canManageUsers: false, canViewDashboard: false },
  monitoring: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  coordinador_operaciones: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  jefe_seguridad: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  analista_seguridad: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  bi: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  custodio: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: false },
  planificador: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  unverified: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: false },
};

// Remove hardcoded email bypasses for security

export const useStableAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('unverified');
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<AuthPermissions>(() => PERMISSIONS_MAP.unverified);
  
  const initialized = useRef(false);
  const mounted = useRef(true);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    
    // Solo inicializar una vez
    if (initialized.current) return;
    initialized.current = true;

    console.log('🔧 StableAuth: Initializing...');

    // Resolver rol de manera segura fuera del callback
    const resolveRoleAndSet = async () => {
      if (!mounted.current) return;
      try {
        const { data } = await supabase.rpc('get_current_user_role_secure');
        const role = (data as UserRole) || 'unverified';
        if (mounted.current) {
          setUserRole(role);
          setPermissions(PERMISSIONS_MAP[role]);
        }
      } catch (error) {
        console.warn('Failed to get user role:', error);
        if (mounted.current) {
          setUserRole('unverified');
          setPermissions(PERMISSIONS_MAP.unverified);
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    // Configurar listener — distingue token refresh de login genuino
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 StableAuth: Auth event ${event}`);
      if (!mounted.current) return;

      if (session?.user) {
        const isSameUser = lastUserId.current === session.user.id;
        const isTokenRefresh = event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && isSameUser);

        setUser(session.user);
        setSession(session);

        if (!isTokenRefresh) {
          // Login genuino: resolver rol
          lastUserId.current = session.user.id;
          setUserRole('unverified');
          setPermissions(PERMISSIONS_MAP.unverified);
          setLoading(true);
          setTimeout(resolveRoleAndSet, 0);
        }
        // Token refresh: no tocar userRole ni loading
      } else {
        // Logout
        setUser(null);
        setSession(null);
        setUserRole('unverified');
        setPermissions(PERMISSIONS_MAP.unverified);
        setLoading(false);
        lastUserId.current = null;
      }
    });

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted.current) return;
      if (currentSession?.user) {
        lastUserId.current = currentSession.user.id;
        setUser(currentSession.user);
        setSession(currentSession);
        setLoading(true);
        setTimeout(resolveRoleAndSet, 0);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []); // Sin dependencias para evitar re-ejecución

  return {
    user,
    session,
    userRole,
    loading,
    permissions,
    hasPermission: (permission: keyof AuthPermissions) => permissions[permission],
    hasRole: (roles: UserRole | UserRole[]) => {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(userRole);
    },
  };
};