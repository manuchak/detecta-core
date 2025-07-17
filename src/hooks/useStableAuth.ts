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
  supply_lead: { canViewLeads: true, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  supply: { canViewLeads: true, canEditLeads: false, canManageUsers: false, canViewDashboard: false },
  monitoring: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  coordinador_operaciones: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  jefe_seguridad: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  analista_seguridad: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  bi: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: true },
  custodio: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: false },
  unverified: { canViewLeads: false, canEditLeads: false, canManageUsers: false, canViewDashboard: false },
};

// Mapeo directo de emails conocidos
const KNOWN_USERS: Record<string, UserRole> = {
  'admin@admin.com': 'admin',
  'brenda.jimenez@detectasecurity.io': 'supply_admin',
  'marbelli.casillas@detectasecurity.io': 'supply_admin',
};

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

    // Función para actualizar estado
    const updateAuthState = (newSession: Session | null) => {
      if (!mounted.current) return;

      if (newSession?.user) {
        const email = newSession.user.email || '';
        const role = KNOWN_USERS[email] || 'unverified';
        const userPermissions = PERMISSIONS_MAP[role];

        console.log(`✅ StableAuth: User ${email} -> Role: ${role}`);

        setUser(newSession.user);
        setSession(newSession);
        setUserRole(role);
        setPermissions(userPermissions);
        setLoading(false);
      } else {
        console.log('❌ StableAuth: No user session');
        setUser(null);
        setSession(null);
        setUserRole('unverified');
        setPermissions(PERMISSIONS_MAP.unverified);
        setLoading(false);
      }
    };

    // Configurar listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 StableAuth: Auth event ${event}`);
      updateAuthState(session);
    });

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      updateAuthState(currentSession);
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