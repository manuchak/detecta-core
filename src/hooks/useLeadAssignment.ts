
import { useState, useCallback } from 'react';
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

      // Filtrar solo los roles que pueden ser asignados leads
      const analystRoles = [
        'admin', 
        'owner', 
        'supply_admin', 
        'supply_lead',
        'supply',
        'analista_seguridad', 
        'custodio', 
        'coordinador_operaciones', 
        'jefe_seguridad'
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

      console.log('Filtered analysts:', filteredAnalysts);
      setAnalysts(filteredAnalysts);
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

  return {
    analysts,
    loading,
    fetchAnalysts
  };
};
