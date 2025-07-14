
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skill, UserSkill } from '@/types/skillTypes';
import { useAuth } from '@/contexts/AuthContext';

export const useUserSkills = (userId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  // Get current user's skills from the new user_skills table
  const { data: userSkills, isLoading, error } = useQuery({
    queryKey: ['user-skills', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      try {
        const { data, error } = await supabase.rpc('get_user_skills', {
          check_user_id: targetUserId
        });

        if (error) {
          console.error('Error fetching user skills:', error);
          return [];
        }

        // Transform the data to match our UserSkill interface
        const skills: UserSkill[] = (data || []).map((skillData: any) => ({
          id: `${targetUserId}-${skillData.skill}`,
          user_id: targetUserId,
          skill: skillData.skill as Skill,
          granted_by: targetUserId,
          granted_at: skillData.granted_at,
          expires_at: skillData.expires_at,
          is_active: true
        }));

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

  // Grant skill to user (admin only)
  const grantSkill = useMutation({
    mutationFn: async ({ userId, skill }: { userId: string; skill: Skill }) => {
      try {
        console.log(`Granting skill ${skill} to user ${userId}`);
        
        // Insert the skill using direct table access
        const { data, error } = await supabase
          .from('user_skills')
          .insert({
            user_id: userId,
            skill: skill,
            granted_by: user?.id,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Error al otorgar skill: ${error.message}`);
        }

        return data;
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

  // Revoke skill from user (admin only)
  const revokeSkill = useMutation({
    mutationFn: async ({ userId, skill }: { userId: string; skill: Skill }) => {
      try {
        console.log(`Revoking skill ${skill} from user ${userId}`);
        
        // Deactivate the skill instead of deleting it
        const { error } = await supabase
          .from('user_skills')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('skill', skill)
          .eq('is_active', true);

        if (error) {
          throw new Error(`Error al revocar skill: ${error.message}`);
        }

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
