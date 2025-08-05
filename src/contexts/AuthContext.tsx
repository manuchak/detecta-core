import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthPermissions {
  canViewLeads: boolean;
  canEditLeads: boolean;
  canManageUsers: boolean;
  canViewDashboard: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  permissions: AuthPermissions;
  hasPermission: (permission: keyof AuthPermissions) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmEmail: (token: string, type: string) => Promise<void>;
  assignRole: (userId: string, role: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mapeo de permisos por rol
  const getPermissionsForRole = (role: string | null): AuthPermissions => {
    switch (role) {
      case 'admin':
      case 'owner':
        return {
          canViewLeads: true,
          canEditLeads: true,
          canManageUsers: true,
          canViewDashboard: true,
        };
      case 'supply_admin':
        return {
          canViewLeads: true,
          canEditLeads: true,
          canManageUsers: false,
          canViewDashboard: true,
        };
      case 'ejecutivo_ventas':
        return {
          canViewLeads: true,
          canEditLeads: true,
          canManageUsers: false,
          canViewDashboard: false,
        };
      case 'supply_lead':
        return {
          canViewLeads: true,
          canEditLeads: false,
          canManageUsers: false,
          canViewDashboard: true,
        };
      case 'supply':
        return {
          canViewLeads: true,
          canEditLeads: false,
          canManageUsers: false,
          canViewDashboard: false,
        };
      case 'monitoring':
      case 'coordinador_operaciones':
      case 'jefe_seguridad':
      case 'analista_seguridad':
      case 'bi':
        return {
          canViewLeads: false,
          canEditLeads: false,
          canManageUsers: false,
          canViewDashboard: true,
        };
      default:
        return {
          canViewLeads: false,
          canEditLeads: false,
          canManageUsers: false,
          canViewDashboard: false,
        };
    }
  };

  // Memoize permissions to prevent infinite re-renders
  const permissions = useMemo(() => getPermissionsForRole(userRole), [userRole]);

  const fetchUserRole = async () => {
    try {
      if (!supabase.auth.getSession) {
        console.log('Auth not ready yet');
        return null;
      }

      // Use secure function to get user role
      const { data, error } = await supabase.rpc('get_current_user_role');

      if (error) {
        console.error('Error fetching user role:', error);
        return 'unverified';
      }

      console.log('Fetched user role:', data);
      return data || 'unverified';
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return 'unverified';
    }
  };

  const assignRole = async (userId: string, role: string): Promise<boolean> => {
    try {
      console.log(`Assigning role ${role} to user ${userId}`);
      
      const { data, error } = await supabase.rpc('assign_user_role_secure', {
        target_user_id: userId,
        new_role: role,
        change_reason: 'Role assignment via admin interface'
      });
      
      if (error) {
        console.error('Error assigning role:', error);
        throw new Error(`Error asignando rol: ${error.message}`);
      }
      
      console.log('Role assigned successfully with audit trail');
      return true;
    } catch (error) {
      console.error('Error in assignRole:', error);
      throw error;
    }
  };

  const confirmEmail = async (token: string, type: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any
      });

      if (error) {
        console.error('Error confirming email:', error);
        toast({
          title: "Error",
          description: "No se pudo confirmar el email. El enlace puede haber expirado.",
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Email confirmado",
          description: "Tu email ha sido confirmado exitosamente. Ya puedes iniciar sesión.",
        });
      }
    } catch (error) {
      console.error('Error in confirmEmail:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al confirmar el email.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        // Secure role fetching - no hardcoded email bypasses
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole(null); // Reset role
          
          // Always fetch role from database securely
          setTimeout(async () => {
            if (mounted) {
              try {
                const role = await fetchUserRole();
                if (mounted) {
                  setUserRole(role);
                }
              } catch (error) {
                console.error('Error fetching user role:', error);
                if (mounted) {
                  setUserRole('unverified');
                }
              }
            }
          }, 50);
        } else {
          setSession(currentSession);
          setUser(null);
          setUserRole(null);
        }
        
        // Handle auth events
        if (event === 'SIGNED_IN' && currentSession?.user) {
          console.log("User signed in:", currentSession.user.email);
          toast({
            title: "Bienvenido",
            description: `Has iniciado sesión como ${currentSession.user.email}`,
          });
          
          // Update last login
          setTimeout(async () => {
            if (mounted) {
              try {
                await supabase.rpc('update_last_login');
              } catch (error) {
                console.error('Error updating last login:', error);
              }
            }
          }, 100);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión exitosamente",
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      
      console.log("Initial session check:", currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserRole().then(role => {
          if (mounted) {
            setUserRole(role);
          }
        });
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = "Error al iniciar sesión";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.";
        } else if (error.message.includes('too_many_requests')) {
          errorMessage = "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return Promise.reject(error);
      }

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        toast({
          title: "Email no confirmado",
          description: "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
          variant: "destructive",
        });
        return Promise.reject(new Error('Email not confirmed'));
      }

    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado durante el inicio de sesión",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${currentOrigin}/auth/email-confirmation`;
      
      console.log('Sign up redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        
        let errorMessage = "Error al crear la cuenta";
        
        if (error.message.includes('User already registered')) {
          errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres.";
        } else if (error.message.includes('Signup is disabled')) {
          errorMessage = "El registro está temporalmente deshabilitado.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return Promise.reject(error);
      }

      if (data.user && !data.session) {
        toast({
          title: "Cuenta creada",
          description: "Se ha enviado un email de confirmación. Por favor revisa tu bandeja de entrada.",
        });
      }
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado durante el registro",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear user state immediately for better UX
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Clear any localStorage data (like forecast settings)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('forecastConfig');
        // Clear any other app-specific localStorage items if needed
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Error",
          description: "Error al cerrar sesión: " + error.message,
          variant: "destructive",
        });
        return Promise.reject(error);
      }
      
      // Navigate to detectasecurity.io after successful logout
      if (typeof window !== 'undefined') {
        window.location.href = 'https://www.detectasecurity.io';
      }
      
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al cerrar sesión",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: keyof AuthPermissions) => permissions[permission];
  
  const hasRole = (roles: string | string[]) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return userRole ? roleArray.includes(userRole) : false;
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    permissions,
    hasPermission,
    hasRole,
    signIn,
    signUp,
    signOut,
    confirmEmail,
    assignRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
