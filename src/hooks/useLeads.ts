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
        console.log('🔍 DIAGNÓSTICO DETALLADO - Iniciando consulta de leads...');
        
        // PASO 1: Verificar conexión a Supabase
        console.log('📡 Verificando conexión a Supabase...');
        console.log('Supabase URL:', supabase.supabaseUrl);
        console.log('Supabase Key:', supabase.supabaseKey ? 'Configurada ✅' : 'No configurada ❌');
        
        // PASO 2: Verificar autenticación
        console.log('🔐 Verificando autenticación...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('❌ ERROR DE AUTENTICACIÓN:', authError);
          console.error('Código de error:', authError.message);
          throw new Error(`Error de autenticación: ${authError.message}`);
        }
        
        if (!user) {
          console.error('❌ USUARIO NO AUTENTICADO');
          throw new Error('Usuario no autenticado');
        }
        
        console.log('✅ Usuario autenticado:', {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        });

        // PASO 3: Verificar roles del usuario
        console.log('👥 Verificando roles del usuario...');
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          if (roleError) {
            console.error('❌ ERROR AL OBTENER ROLES:', roleError);
            console.error('Código:', roleError.code, 'Mensaje:', roleError.message);
          } else {
            console.log('✅ Roles obtenidos:', roleData);
          }
        } catch (roleErr) {
          console.error('❌ EXCEPCIÓN AL OBTENER ROLES:', roleErr);
        }
        
        // PASO 4: Verificar tabla leads existe
        console.log('🗂️ Verificando existencia de tabla leads...');
        try {
          const { data: tableCheck, error: tableError } = await supabase
            .from('leads')
            .select('count', { count: 'exact', head: true });
          
          if (tableError) {
            console.error('❌ ERROR AL VERIFICAR TABLA LEADS:', tableError);
            console.error('Código:', tableError.code, 'Mensaje:', tableError.message);
            throw new Error(`Error al verificar tabla leads: ${tableError.message}`);
          }
          
          console.log('✅ Tabla leads existe, total registros:', tableCheck);
        } catch (tableErr) {
          console.error('❌ EXCEPCIÓN AL VERIFICAR TABLA:', tableErr);
          throw tableErr;
        }
        
        // PASO 5: Consulta principal de leads
        console.log('📊 Ejecutando consulta principal de leads...');
        const { data, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .order('fecha_creacion', { ascending: false });
        
        if (error) {
          console.error('❌ ERROR EN CONSULTA PRINCIPAL:', error);
          console.error('Detalles completos del error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw new Error(`Error al cargar leads: ${error.message} (Código: ${error.code})`);
        }
        
        console.log('✅ CONSULTA EXITOSA:', {
          totalRegistros: count,
          registrosDevueltos: data?.length || 0,
          primerosRegistros: data?.slice(0, 3) || []
        });
        
        return data || [];
        
      } catch (error) {
        console.error('💥 ERROR GENERAL EN useLeads:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    },
    retry: 1,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
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
