
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadsDiagnosticData {
  userAuth: {
    user: any;
    error: any;
  };
  userRole: {
    data: any;
    error: any;
  };
  directQuery: {
    data: any;
    error: any;
    count: number;
  };
  leadCount: number;
  sampleLeads: any[];
  errors: string[];
}

export const useLeadsDiagnostic = () => {
  return useQuery({
    queryKey: ['leads-diagnostic'],
    queryFn: async (): Promise<LeadsDiagnosticData> => {
      const errors: string[] = [];
      let leadCount = 0;
      let sampleLeads: any[] = [];
      
      console.log('🔍 DIAGNÓSTICO LEADS - Iniciando análisis completo...');
      
      // PASO 1: Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        errors.push(`Error de autenticación: ${authError.message}`);
      }
      
      // PASO 2: Verificar rol usando función segura
      let userRoleData = null;
      let roleError = null;
      
      try {
        const { data: currentRole, error: currentRoleError } = await supabase
          .rpc('get_current_user_role');
        
        if (currentRoleError) {
          roleError = currentRoleError;
          errors.push(`Error obteniendo rol actual: ${currentRoleError.message}`);
        } else {
          userRoleData = [{ role: currentRole }];
        }
      } catch (err) {
        roleError = err;
        errors.push(`Excepción obteniendo rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
      
      // PASO 3: Consulta directa a leads con diagnóstico detallado
      let directQueryData = null;
      let directError = null;
      
      try {
        console.log('📊 Ejecutando consulta directa a tabla leads...');
        
        const { data: leadsData, error: leadsError, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .order('fecha_creacion', { ascending: false })
          .limit(10);
        
        if (leadsError) {
          directError = leadsError;
          errors.push(`Error en consulta directa: ${leadsError.message} (Código: ${leadsError.code})`);
        } else {
          directQueryData = leadsData;
          leadCount = count || 0;
          sampleLeads = leadsData || [];
        }
      } catch (err) {
        directError = err;
        errors.push(`Excepción en consulta directa: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
      
      return {
        userAuth: {
          user,
          error: authError
        },
        userRole: {
          data: userRoleData,
          error: roleError
        },
        directQuery: {
          data: directQueryData,
          error: directError,
          count: leadCount
        },
        leadCount,
        sampleLeads,
        errors
      };
    },
    retry: 1,
    staleTime: 30000
  });
};
