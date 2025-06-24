
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  fecha_creacion: string;
  asignado_a?: string;
  notas?: string;
}

export const useLeads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading, error, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        console.log('Fetching leads...');
        
        // Verificar primero el rol del usuario
        const { data: userRole, error: roleError } = await (supabase as any).rpc('get_current_user_role');
        
        if (roleError) {
          console.error('Error checking user role:', roleError);
          throw new Error('No se pudo verificar los permisos del usuario');
        }
        
        console.log('Current user role:', userRole);
        
        // Obtener leads directamente - las políticas RLS manejarán el acceso
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('fecha_creacion', { ascending: false });
        
        if (error) {
          console.error("Error fetching leads:", error);
          throw new Error(`Error al cargar candidatos: ${error.message}`);
        }
        
        console.log('Leads fetched successfully:', data?.length || 0, 'leads');
        return data || [];
        
      } catch (error) {
        console.error("Error in useLeads:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Error desconocido al cargar candidatos');
      }
    },
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const assignLead = useMutation({
    mutationFn: async ({ leadId, analystId }: { leadId: string, analystId: string }) => {
      try {
        console.log(`Assigning lead ${leadId} to analyst ${analystId}`);
        
        const { data, error } = await supabase
          .from('leads')
          .update({ 
            asignado_a: analystId,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select()
          .single();
        
        if (error) {
          console.error('Error assigning lead:', error);
          throw new Error(`Error al asignar candidato: ${error.message}`);
        }
        
        console.log(`Successfully assigned lead ${leadId} to analyst ${analystId}`);
        return data;
        
      } catch (error) {
        console.error('Error in assignLead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "Candidato asignado",
        description: "El candidato ha sido asignado correctamente",
      });
    },
    onError: (error) => {
      console.error('Assignment error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar el candidato",
        variant: "destructive",
      });
    }
  });

  const updateLead = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string, updates: Partial<Lead> }) => {
      try {
        console.log(`Updating lead ${leadId}`, updates);
        
        const { data, error } = await supabase
          .from('leads')
          .update({ 
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating lead:', error);
          throw new Error(`Error al actualizar candidato: ${error.message}`);
        }
        
        console.log(`Successfully updated lead ${leadId}`);
        return data;
        
      } catch (error) {
        console.error('Error in updateLead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "Candidato actualizado",
        description: "El candidato ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el candidato",
        variant: "destructive",
      });
    }
  });

  const createLead = useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'fecha_creacion'>) => {
      try {
        console.log('Creating new lead:', leadData);
        
        const { data, error } = await supabase
          .from('leads')
          .insert([{
            ...leadData,
            fecha_creacion: new Date().toISOString(),
            estado: leadData.estado || 'nuevo'
          }])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating lead:', error);
          throw new Error(`Error al crear candidato: ${error.message}`);
        }
        
        console.log('Successfully created lead:', data.id);
        return data;
        
      } catch (error) {
        console.error('Error in createLead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "Candidato creado",
        description: "El candidato ha sido creado correctamente",
      });
    },
    onError: (error) => {
      console.error('Creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear el candidato",
        variant: "destructive",
      });
    }
  });

  return {
    leads,
    isLoading,
    error,
    refetch,
    assignLead,
    updateLead,
    createLead
  };
};
