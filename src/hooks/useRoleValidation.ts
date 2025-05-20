
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useRoleValidation = () => {
  const { user, userRole, refreshUserRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const validateUserRole = async () => {
    if (!user) return null;
    
    setIsLoading(true);
    
    try {
      console.log("Validating role for user:", user.id);
      
      // Get current user role
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role_safe', { user_uid: user.id });
      
      if (roleError) {
        console.error("Error getting role:", roleError);
        throw roleError;
      }
      
      console.log("Role validation result:", roleData);
      
      // If no role, assign owner role
      if (!roleData) {
        const result = await ensureOwnerRole();
        return result ? 'owner' : null;
      }
      
      // Refresh the role in context if needed
      if (userRole !== roleData) {
        await refreshUserRole();
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
    } finally {
      setIsLoading(false);
    }
  };

  const ensureOwnerRole = async () => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      console.log("Ensuring owner role for user:", user.id);
      
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
        console.error("Error assigning role:", result);
        toast({
          title: "Error",
          description: result.error || "Error al asignar rol de owner",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("Role assignment successful:", result);
      
      toast({
        title: "Rol asignado",
        description: `Rol 'owner' asignado correctamente. Se recomienda cerrar sesión y volver a iniciar para aplicar todos los cambios.`,
      });
      
      // Refresh role immediately
      await refreshUserRole();
      
      return true;
    } catch (error) {
      console.error('Error asignando rol:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar rol de owner",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run validation on mount
  useEffect(() => {
    if (user && !userRole) {
      validateUserRole();
    }
  }, [user, userRole]);

  // Add a second useEffect to ensure validation happens even if userRole is already set
  // This helps with situations where the role might be cached but invalid
  useEffect(() => {
    if (user && userRole && userRole !== 'owner') {
      // Only validate if not already an owner
      validateUserRole();
    }
  }, []);

  return {
    validateUserRole,
    ensureOwnerRole,
    isOwner: userRole === 'owner',
    currentRole: userRole,
    isLoading
  };
};
