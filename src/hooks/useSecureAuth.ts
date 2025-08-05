import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SecureAuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  sessionValid: boolean;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<SecureAuthState>({
    user: null,
    session: null,
    userRole: null,
    loading: true,
    sessionValid: false
  });

  const validateSession = async (session: Session | null): Promise<boolean> => {
    if (!session?.user) return false;

    try {
      // Validar sesión usando función segura de la base de datos
      const { data: isValid, error } = await supabase.rpc('validate_user_session');
      
      if (error) {
        console.error('Session validation error:', error);
        return false;
      }

      return Boolean(isValid);
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      // Usar función segura para obtener el rol
      const { data: role, error } = await supabase.rpc('get_current_user_role');
      
      if (error) {
        console.error('Role fetch error:', error);
        return null;
      }

      return role;
    } catch (error) {
      console.error('Role fetch failed:', error);
      return null;
    }
  };

  const updateAuthState = async (session: Session | null) => {
    if (!session?.user) {
      setAuthState({
        user: null,
        session: null,
        userRole: null,
        loading: false,
        sessionValid: false
      });
      return;
    }

    const sessionValid = await validateSession(session);
    
    if (!sessionValid) {
      // Sesión inválida - limpiar estado y cerrar sesión
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        session: null,
        userRole: null,
        loading: false,
        sessionValid: false
      });
      return;
    }

    const userRole = await getUserRole(session.user.id);

    setAuthState({
      user: session.user,
      session,
      userRole,
      loading: false,
      sessionValid: true
    });
  };

  useEffect(() => {
    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            userRole: null,
            loading: false,
            sessionValid: false
          });
        } else {
          await updateAuthState(session);
        }
      }
    );

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshRole = async () => {
    if (authState.user) {
      const userRole = await getUserRole(authState.user.id);
      setAuthState(prev => ({ ...prev, userRole }));
    }
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!authState.userRole || !authState.sessionValid) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(authState.userRole);
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    refreshRole,
    hasRole
  };
};