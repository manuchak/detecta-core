
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: string | null;
  refreshUserRole: () => Promise<void>;
  confirmEmail: (token: string, type: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Función para actualizar el rol del usuario
  const refreshUserRole = async () => {
    if (!user) {
      setUserRole(null);
      return;
    }

    try {
      console.log("Getting role for user:", user.id);
      
      // Try using the function with proper type casting
      const { data, error } = await (supabase as any)
        .rpc('get_user_role_safe', { user_uid: user.id });
      
      if (error) {
        console.error('Error fetching user role:', error);
        // Fallback to direct table query
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (roleError) {
          console.error('Error fetching user role from table:', roleError);
          setUserRole('pending'); // Default role para nuevos usuarios
          return;
        }
        
        const role = roleData && roleData.length > 0 ? roleData[0].role : 'pending';
        setUserRole(role);
        return;
      }
      
      console.log("Role received:", data);
      setUserRole(typeof data === 'string' ? data : 'pending');
    } catch (error) {
      console.error('Error in refreshUserRole:', error);
      setUserRole('pending'); // Default role
    }
  };

  // Función para confirmar email manualmente
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
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Manejar diferentes eventos de autenticación
        if (event === 'SIGNED_IN' && currentSession?.user) {
          console.log("User signed in:", currentSession.user.email);
          
          // Actualizar último login
          try {
            await supabase.rpc('update_last_login');
          } catch (error) {
            console.error('Error updating last login:', error);
          }
          
          // Actualizar rol después de un breve delay
          setTimeout(() => {
            refreshUserRole();
          }, 100);
          
          toast({
            title: "Bienvenido",
            description: `Has iniciado sesión como ${currentSession.user.email}`,
          });
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUserRole(null);
          toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión exitosamente",
          });
        }
        
        if (event === 'TOKEN_REFRESHED' && currentSession?.user) {
          console.log("Token refreshed for:", currentSession.user.email);
          setTimeout(() => {
            refreshUserRole();
          }, 100);
        }
        
        // Manejar confirmación de email - Fixed the comparison
        if (event === 'USER_UPDATED' && currentSession?.user) {
          // Check if email was just confirmed
          if (currentSession.user.email_confirmed_at) {
            toast({
              title: "Email confirmado",
              description: "Tu email ha sido confirmado exitosamente.",
            });
          }
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      
      // Si hay sesión, obtener el rol
      if (currentSession?.user) {
        refreshUserRole();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        
        // Proporcionar mensajes de error más específicos
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

      // Verificar si el email está confirmado
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return Promise.reject(error);
      }
      setUserRole(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al cerrar sesión",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userRole,
    refreshUserRole,
    confirmEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
