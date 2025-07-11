import { useState, useEffect } from 'react';
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

// Hook simplificado que evita el React error #300
export const useLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar autenticación de forma simple
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      console.log('📊 Cargando leads...');
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      
      if (error) {
        console.error('❌ Error:', error);
        throw new Error(`Error al cargar leads: ${error.message}`);
      }
      
      console.log('✅ Leads cargados:', data?.length || 0);
      setLeads(data || []);
      
    } catch (err) {
      console.error('💥 Error en fetchLeads:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Retraso pequeño para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      fetchLeads();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const assignLead = async (leadId: string, analystId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          asignado_a: analystId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();
      
      if (error) throw new Error(`Error al asignar: ${error.message}`);
      
      toast({
        title: "Candidato asignado",
        description: "El candidato ha sido asignado correctamente",
      });
      
      await fetchLeads(); // Recargar datos
      return data;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al asignar el candidato";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateLead = async ({ leadId, updates }: { leadId: string, updates: Partial<Lead> }) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();
      
      if (error) throw new Error(`Error al actualizar: ${error.message}`);
      
      toast({
        title: "Candidato actualizado",
        description: "El candidato ha sido actualizado correctamente",
      });
      
      await fetchLeads(); // Recargar datos
      return data;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al actualizar el candidato";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'fecha_creacion'>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          fecha_creacion: new Date().toISOString(),
          estado: leadData.estado || 'nuevo'
        }])
        .select()
        .single();
      
      if (error) throw new Error(`Error al crear: ${error.message}`);
      
      toast({
        title: "Candidato creado",
        description: "El candidato ha sido creado correctamente",
      });
      
      await fetchLeads(); // Recargar datos
      return data;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al crear el candidato";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    leads,
    isLoading,
    error,
    refetch: fetchLeads,
    assignLead: { 
      mutateAsync: assignLead,
      isPending: isLoading
    },
    updateLead: { 
      mutateAsync: updateLead,
      isPending: isLoading
    },
    createLead: { 
      mutateAsync: createLead,
      isPending: isLoading
    }
  };
};