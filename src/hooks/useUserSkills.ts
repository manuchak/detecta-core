
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skill, UserSkill } from '@/types/skillTypes';
import { useAuth } from './useAuth';

export const useUserSkills = (userId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  // Get current user's skills - for now we'll simulate with role-based access
  const { data: userSkills, isLoading, error } = useQuery({
    queryKey: ['user-skills', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      try {
        // Get user's role to simulate skills
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', targetUserId);

        if (roleError) {
          console.error('Error fetching user roles:', roleError);
          return [];
        }

        // Convert roles to skills based on ROLE_TO_SKILLS_MAPPING
        const skills: UserSkill[] = [];
        
        if (userRoles && userRoles.length > 0) {
          const role = userRoles[0].role;
          
          // Map role to skills based on our mapping
          let mappedSkills: Skill[] = [];
          
          switch (role) {
            case 'owner':
            case 'admin':
              mappedSkills = ['admin_full_access'];
              break;
            case 'supply_admin':
              mappedSkills = ['dashboard_view', 'leads_management', 'services_manage', 'reports_view'];
              break;
            case 'coordinador_operaciones':
              mappedSkills = ['dashboard_view', 'services_manage', 'monitoring_view', 'reports_view'];
              break;
            case 'custodio':
              mappedSkills = ['custodio_tracking_only'];
              break;
            case 'instalador':
              mappedSkills = ['installer_portal_only'];
              break;
            default:
              mappedSkills = [];
          }
          
          // Convert to UserSkill format
          mappedSkills.forEach(skill => {
            skills.push({
              id: `${targetUserId}-${skill}`,
              user_id: targetUserId,
              skill,
              granted_by: targetUserId,
              granted_at: new Date().toISOString(),
              is_active: true
            });
          });
        }

        return skills;
      } catch (err) {
        console.error('Error in useUserSkills:', err);
        return [];
      }
    },
    enabled: !!targetUserId,
    staleTime: 300000, // 5 minutes
  });

  // Check if user has a specific skill
  const hasSkill = (skill: Skill): boolean => {
    if (!userSkills) return false;
    
    // Check for admin_full_access which grants all permissions
    if (userSkills.some(s => s.skill === 'admin_full_access')) {
      return true;
    }
    
    return userSkills.some(s => s.skill === skill);
  };

  // Check if user has any of the specified skills
  const hasAnySkill = (skills: Skill[]): boolean => {
    return skills.some(skill => hasSkill(skill));
  };

  // Grant skill to user (admin only) - placeholder for future implementation
  const grantSkill = useMutation({
    mutationFn: async ({ userId, skill }: { userId: string; skill: Skill }) => {
      try {
        console.log(`Granting skill ${skill} to user ${userId}`);
        
        // Verify admin access
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_user_secure');
        
        if (adminError || !isAdmin) {
          throw new Error('Sin permisos para otorgar skills');
        }

        // For now, just return success - actual implementation would require user_skills table
        return { userId, skill };
      } catch (err) {
        console.error('Error in grantSkill:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      toast({
        title: "Skill otorgado",
        description: "El skill ha sido otorgado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al otorgar skill",
        variant: "destructive",
      });
    }
  });

  // Revoke skill from user (admin only) - placeholder for future implementation
  const revokeSkill = useMutation({
    mutationFn: async ({ userId, skill }: { userId: string; skill: Skill }) => {
      try {
        console.log(`Revoking skill ${skill} from user ${userId}`);
        
        // Verify admin access
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_user_secure');
        
        if (adminError || !isAdmin) {
          throw new Error('Sin permisos para revocar skills');
        }

        // For now, just return success - actual implementation would require user_skills table
        return { userId, skill };
      } catch (err) {
        console.error('Error in revokeSkill:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      toast({
        title: "Skill revocado",
        description: "El skill ha sido revocado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al revocar skill",
        variant: "destructive",
      });
    }
  });

  return {
    userSkills,
    isLoading,
    error,
    hasSkill,
    hasAnySkill,
    grantSkill,
    revokeSkill
  };
};
