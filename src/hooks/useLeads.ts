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
  empresa?: string;
  fuente?: string;
  mensaje?: string;
  fecha_contacto?: string;
}

export const useLeads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading, error, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        console.log('🔍 Iniciando consulta de leads...');
        
        // Verificar primero el usuario autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('👤 Usuario autenticado:', userData?.user?.email);
        
        if (userError) {
          console.error('❌ Error de autenticación:', userError);
          throw new Error(`Error de autenticación: ${userError.message}`);
        }

        // Intentar consulta directa básica primero
        console.log('📊 Intentando consulta SELECT básica...');
        const { data, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .order('fecha_creacion', { ascending: false });
        
        console.log('📈 Resultado consulta:', {
          data: data?.slice(0, 2), // Solo mostrar primeros 2 para debug
          count,
          error,
          totalRecords: data?.length
        });
        
        if (error) {
          console.error("❌ Error en consulta SELECT:", error);
          
          // Información detallada del error para diagnóstico
          console.error("Detalles del error:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          throw new Error(`Error al cargar leads: ${error.message} (Código: ${error.code})`);
        }
        
        if (!data) {
          console.warn('⚠️ La consulta no devolvió datos (null)');
          return [];
        }
        
        console.log(`✅ Leads cargados exitosamente: ${data.length} registros`);
        console.log('📋 Primeros leads:', data.slice(0, 3).map(lead => ({
          id: lead.id,
          nombre: lead.nombre,
          email: lead.email,
          fuente: lead.fuente
        })));
        
        return data || [];
        
      } catch (error) {
        console.error("💥 Error en useLeads:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Error desconocido al cargar leads');
      }
    },
    retry: 1, // Reducir reintentos para debug más rápido
    staleTime: 10000, // 10 segundos
    refetchOnWindowFocus: true, // Ayuda con debugging
    refetchOnMount: true
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
