
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Analyst {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export const useLeadAssignment = () => {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalysts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching analysts for lead assignment...');
      
      // Usar la función segura existente
      const { data, error } = await supabase.rpc('get_users_with_roles_secure');

      if (error) {
        console.error('Error fetching analysts:', error);
        throw error;
      }

      console.log('Raw data from get_users_with_roles_secure:', data);

      if (!data || data.length === 0) {
        console.log('No users returned from function');
        setAnalysts([]);
        return;
      }

      // Filtrar solo los roles que gestionan candidatos
      const analystRoles = [
        'admin', 
        'owner', 
        'supply_admin', 
        'supply_lead',
        'supply'
      ];

      const filteredAnalysts = data
        .filter((user: any) => {
          const hasValidRole = analystRoles.includes(user.role);
          console.log(`Usuario: ${user.email}, Rol: ${user.role}, Válido: ${hasValidRole}`);
          return hasValidRole;
        })
        .map((user: any) => ({
          id: user.id,
          display_name: user.display_name || user.email,
          email: user.email,
          role: user.role
        }))
        // Eliminar duplicados basados en el ID
        .filter((analyst, index, self) => 
          index === self.findIndex(a => a.id === analyst.id)
        );

      // Ordenar analistas por nombre para mejor UX
      const sortedAnalysts = filteredAnalysts.sort((a, b) => 
        a.display_name.localeCompare(b.display_name)
      );

      console.log('Filtered and sorted analysts:', sortedAnalysts);
      setAnalysts(sortedAnalysts);
    } catch (error) {
      console.error('Error in fetchAnalysts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los analistas disponibles.",
        variant: "destructive",
      });
      setAnalysts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Auto-fetch analysts on mount
  useEffect(() => {
    fetchAnalysts();
  }, [fetchAnalysts]);

  return {
    analysts,
    loading,
    fetchAnalysts
  };
};
