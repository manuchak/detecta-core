
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type Role = 'admin' | 'supply' | 'supply_admin' | 'soporte' | 'bi' | 'monitoring' | 'monitoring_supervisor' | 'owner' | 'pending' | 'unverified';

export type UserWithRole = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
  last_login: string;
};

export const useRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all users from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        throw new Error(`Error fetching profiles: ${profilesError.message}`);
      }

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) {
        throw new Error(`Error fetching roles: ${rolesError.message}`);
      }

      // Combine data
      return profiles.map((profile) => {
        const userRole = userRoles.find((ur) => ur.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          role: userRole ? userRole.role : 'unverified',
          created_at: profile.created_at,
          last_login: profile.last_login,
        } as UserWithRole;
      });
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['available-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_roles');
      
      if (error) {
        // If the RPC doesn't exist, return hardcoded roles
        console.error("Error fetching roles:", error);
        return [
          'owner',
          'admin',
          'supply_admin',
          'supply',
          'soporte',
          'bi',
          'monitoring_supervisor',
          'monitoring',
          'pending',
          'unverified'
        ];
      }
      
      return data;
    }
  });

  const { data: permissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) {
        throw new Error(`Error fetching permissions: ${error.message}`);
      }

      // Group permissions by role
      const permissionsByRole: Record<string, any[]> = {};
      
      data.forEach(permission => {
        if (!permissionsByRole[permission.role]) {
          permissionsByRole[permission.role] = [];
        }
        permissionsByRole[permission.role].push(permission);
      });
      
      return permissionsByRole;
    }
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: Role }) => {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: role
      });
      
      if (error) {
        throw new Error(`Error updating role: ${error.message}`);
      }
      
      return { userId, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updatePermission = useMutation({
    mutationFn: async ({ id, allowed }: { id: number, allowed: boolean }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update({ allowed })
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error updating permission: ${error.message}`);
      }
      
      return { id, allowed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso actualizado",
        description: "El permiso ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addPermission = useMutation({
    mutationFn: async ({ role, permissionType, permissionId, allowed }: 
      { role: Role, permissionType: string, permissionId: string, allowed: boolean }) => {
      const { error } = await supabase
        .from('role_permissions')
        .insert({ role, permission_type: permissionType, permission_id: permissionId, allowed });
      
      if (error) {
        throw new Error(`Error adding permission: ${error.message}`);
      }
      
      return { role, permissionType, permissionId, allowed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Permiso añadido",
        description: "El nuevo permiso ha sido añadido correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const verifyUserEmail = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase.rpc('verify_user_email', {
        target_user_id: userId
      });
      
      if (error) {
        throw new Error(`Error verifying email: ${error.message}`);
      }
      
      return { userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Email verificado",
        description: "El email del usuario ha sido verificado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    users,
    roles,
    permissions,
    isLoading: isLoading || loadingPermissions,
    error,
    updateUserRole,
    updatePermission,
    addPermission,
    verifyUserEmail
  };
};
