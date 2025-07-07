
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const SUPABASE_URL = "https://yydzzeljaewsfhmilnhm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHp6ZWxqYWV3c2ZobWlsbmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTc1MjIsImV4cCI6MjA2MzI3MzUyMn0.iP9UG12mKESneZq7XwY6vHvqRGH3hq3D1Hu0qneu8B8";

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
        console.log('🔍 Iniciando carga de leads...');
        
        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('❌ ERROR DE AUTENTICACIÓN:', authError);
          throw new Error(`Error de autenticación: ${authError.message}`);
        }
        
        if (!user) {
          console.error('❌ USUARIO NO AUTENTICADO');
          throw new Error('Usuario no autenticado');
        }
        
        console.log('✅ Usuario autenticado:', user.email);

        // Consulta simplificada sin joins complejos que puedan causar recursión
        console.log('📊 Ejecutando consulta simplificada de leads...');
        const { data, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .order('fecha_creacion', { ascending: false });
        
        if (error) {
          console.error('❌ ERROR EN CONSULTA:', error);
          throw new Error(`Error al cargar leads: ${error.message}`);
        }
        
        console.log('✅ CONSULTA EXITOSA:', {
          totalRegistros: count,
          registrosDevueltos: data?.length || 0
        });
        
        return data || [];
        
      } catch (error) {
        console.error('💥 ERROR GENERAL EN useLeads:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  const assignLead = useMutation({
    mutationFn: async ({ leadId, analystId }: { leadId: string, analystId: string }) => {
      try {
        console.log(`Asignando lead ${leadId} al analista ${analystId}`);
        
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
          console.error('Error asignando lead:', error);
          throw new Error(`Error al asignar candidato: ${error.message}`);
        }
        
        console.log(`Lead ${leadId} asignado exitosamente`);
        return data;
        
      } catch (error) {
        console.error('Error en assignLead:', error);
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
      console.error('Error en asignación:', error);
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
        console.log(`Actualizando lead ${leadId}`, updates);
        
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
          console.error('Error actualizando lead:', error);
          throw new Error(`Error al actualizar candidato: ${error.message}`);
        }
        
        console.log(`Lead ${leadId} actualizado exitosamente`);
        return data;
        
      } catch (error) {
        console.error('Error en updateLead:', error);
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
      console.error('Error en actualización:', error);
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
        console.log('Creando nuevo lead:', leadData);
        
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
          console.error('Error creando lead:', error);
          throw new Error(`Error al crear candidato: ${error.message}`);
        }
        
        console.log('Lead creado exitosamente:', data.id);
        return data;
        
      } catch (error) {
        console.error('Error en createLead:', error);
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
      console.error('Error en creación:', error);
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
