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
          setUserRole('custodio'); // Default role
          return;
        }
        
        const role = roleData && roleData.length > 0 ? roleData[0].role : 'custodio';
        setUserRole(role);
        return;
      }
      
      console.log("Role received:", data);
      setUserRole(typeof data === 'string' ? data : 'custodio');
    } catch (error) {
      console.error('Error in refreshUserRole:', error);
      setUserRole('custodio'); // Default role
    }
  };

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Si el evento es signIn o tokenRefreshed, actualizar el rol
        if (currentSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            refreshUserRole();
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
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
        description: "Ocurrió un error inesperado durante el inicio de sesión",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return Promise.reject(error);
      }

      toast({
        title: "Cuenta creada",
        description: "Su cuenta ha sido creada exitosamente. Ahora puede iniciar sesión.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado durante el registro",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const signOut = async () => {
    try {
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
