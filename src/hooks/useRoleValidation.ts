
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useRoleValidation = () => {
  const { user, userRole, refreshUserRole } = useAuth();
  const { toast } = useToast();

  const validateUserRole = async () => {
    if (!user) return null;
    
    try {
      // Get current user role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role_safe', { user_uid: user.id });
      
      if (roleError) {
        throw roleError;
      }
      
      // If no role, assign owner role
      if (!roleData) {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No hay sesión activa");
        }

        // Call the Edge Function to assign the owner role
        const response = await fetch('https://beefjsdgrdeiymzxwxru.supabase.co/functions/v1/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: user.id,
            role: 'owner'
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || "Error al asignar rol de owner");
        }
        
        toast({
          title: "Rol asignado",
          description: `Rol 'owner' asignado correctamente. Se recomienda cerrar sesión y volver a iniciar para ver los cambios.`,
        });
        
        // Refresh role
        await refreshUserRole();
        return 'owner';
      }
      
      return roleData;
    } catch (error) {
      console.error('Error validando rol:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al validar rol de usuario",
        variant: "destructive",
      });
      return null;
    }
  };

  const ensureOwnerRole = async () => {
    const currentRole = await validateUserRole();
    
    if (currentRole !== 'owner') {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Call the Edge Function to assign the owner role
      const response = await fetch('https://beefjsdgrdeiymzxwxru.supabase.co/functions/v1/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          role: 'owner'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Error al asignar rol de owner",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Rol asignado",
        description: `Rol 'owner' asignado correctamente. Cerrando sesión para aplicar cambios...`,
      });
      
      // Refresh role
      await refreshUserRole();
      
      // Wait a moment before returning
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    }
    
    toast({
      title: "Rol verificado",
      description: `Ya tienes el rol 'owner' asignado correctamente.`,
    });
    
    return true;
  };
  
  // Run validation on mount
  useEffect(() => {
    if (user && !userRole) {
      validateUserRole();
    }
  }, [user, userRole]);

  return {
    validateUserRole,
    ensureOwnerRole,
    isOwner: userRole === 'owner',
    currentRole: userRole
  };
};
