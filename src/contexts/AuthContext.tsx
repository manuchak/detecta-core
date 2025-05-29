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
  confirmEmail: (token: string, type: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

    // Set up the auth state listener - KEEP IT SIMPLE
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        // Only update state - no other async operations
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Show appropriate toasts for auth events
        if (event === 'SIGNED_IN' && currentSession?.user) {
          console.log("User signed in:", currentSession.user.email);
          toast({
            title: "Bienvenido",
            description: `Has iniciado sesión como ${currentSession.user.email}`,
          });
          
          // Update last login in background without blocking
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
        
        if (event === 'USER_UPDATED' && currentSession?.user) {
          if (currentSession.user.email_confirmed_at) {
            toast({
              title: "Email confirmado",
              description: "Tu email ha sido confirmado exitosamente.",
            });
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      
      console.log("Initial session check:", currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
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
    confirmEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
