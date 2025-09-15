import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'owner' | 'supply_admin' | 'ejecutivo_ventas' | 'monitoring' | 'coordinador_operaciones' | 'jefe_seguridad' | 'analista_seguridad' | 'bi' | 'supply_lead' | 'supply' | 'custodio' | 'unverified';

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

  useEffect(() => {
    mounted.current = true;
    
    // Solo inicializar una vez
    if (initialized.current) return;
    initialized.current = true;

    console.log('🔧 StableAuth: Initializing...');

    // Actualiza estado de forma síncrona; resolución de rol se hace aparte
    const updateAuthState = (newSession: Session | null) => {
      if (!mounted.current) return;

      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);
        setUserRole('unverified');
        setPermissions(PERMISSIONS_MAP.unverified);
        setLoading(true);
      } else {
        setUser(null);
        setSession(null);
        setUserRole('unverified');
        setPermissions(PERMISSIONS_MAP.unverified);
        setLoading(false);
      }
    };

    // Resolver rol de manera segura fuera del callback
    const resolveRoleAndSet = async () => {
      if (!mounted.current) return;
      try {
        const { data } = await supabase.rpc('get_current_user_role_secure');
        const role = (data as UserRole) || 'unverified';
        setUserRole(role);
        setPermissions(PERMISSIONS_MAP[role]);
      } catch (error) {
        console.warn('Failed to get user role:', error);
        setUserRole('unverified');
        setPermissions(PERMISSIONS_MAP.unverified);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    // Configurar listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 StableAuth: Auth event ${event}`);
      updateAuthState(session);
      if (session?.user) {
        setTimeout(resolveRoleAndSet, 0);
      }
    });

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      updateAuthState(currentSession);
      if (currentSession?.user) {
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