
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLeadsDiagnostic = () => {
  return useQuery({
    queryKey: ['leads-diagnostic'],
    queryFn: async () => {
      const diagnosticResults = {
        userAuth: null as any,
        userRole: null as any,
        userPermissions: null as any,
        tableExists: false,
        tableStructure: null as any,
        rlsPolicies: null as any,
        directQuery: null as any,
        leadCount: 0,
        sampleLeads: null as any,
        errors: [] as string[],
      };

      try {
        // 1. Verificar autenticación del usuario
        console.log('🔍 Paso 1: Verificando autenticación...');
        const { data: user, error: authError } = await supabase.auth.getUser();
        diagnosticResults.userAuth = { user: user?.user, error: authError };
        
        if (authError || !user?.user) {
          diagnosticResults.errors.push('Usuario no autenticado');
          return diagnosticResults;
        }
        
        console.log('✅ Usuario autenticado:', user.user.email);

        // 2. Verificar rol del usuario
        console.log('🔍 Paso 2: Verificando rol del usuario...');
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.user.id);
          
          diagnosticResults.userRole = { data: roleData, error: roleError };
          console.log('👤 Roles del usuario:', roleData);
        } catch (error) {
          diagnosticResults.errors.push('Error al obtener rol: ' + (error as Error).message);
        }

        // 3. Verificar si la tabla leads existe y su estructura
        console.log('🔍 Paso 3: Verificando estructura de tabla leads...');
        try {
          const { data: tableInfo, error: tableError } = await supabase
            .rpc('get_table_info', { table_name: 'leads' })
            .single();
          
          diagnosticResults.tableStructure = { data: tableInfo, error: tableError };
        } catch (error) {
          console.log('⚠️ No se pudo obtener info de tabla, continuando...');
        }

        // 4. Intentar consulta directa a la tabla leads
        console.log('🔍 Paso 4: Intentando consulta directa...');
        try {
          const { data: leadsData, error: leadsError, count } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .limit(5);
          
          diagnosticResults.directQuery = { data: leadsData, error: leadsError, count };
          diagnosticResults.leadCount = count || 0;
          diagnosticResults.sampleLeads = leadsData;
          
          console.log('📊 Resultado consulta directa:', {
            count,
            error: leadsError,
            sampleData: leadsData?.slice(0, 2)
          });
          
          if (leadsError) {
            diagnosticResults.errors.push('Error en consulta directa: ' + leadsError.message);
          }
        } catch (error) {
          diagnosticResults.errors.push('Error en consulta: ' + (error as Error).message);
        }

        // 5. Verificar políticas RLS
        console.log('🔍 Paso 5: Verificando políticas RLS...');
        try {
          const { data: policiesData, error: policiesError } = await supabase
            .rpc('get_rls_policies', { table_name: 'leads' });
          
          diagnosticResults.rlsPolicies = { data: policiesData, error: policiesError };
        } catch (error) {
          console.log('⚠️ No se pudieron obtener políticas RLS');
        }

        // 6. Intentar con función bypass si es admin
        console.log('🔍 Paso 6: Intentando función bypass para admin...');
        try {
          const { data: bypassData, error: bypassError } = await supabase
            .rpc('get_all_leads');
          
          if (!bypassError && bypassData) {
            console.log('✅ Función bypass exitosa, leads encontrados:', bypassData.length);
            diagnosticResults.sampleLeads = bypassData.slice(0, 5);
            diagnosticResults.leadCount = bypassData.length;
          } else {
            diagnosticResults.errors.push('Error en función bypass: ' + (bypassError?.message || 'Unknown'));
          }
        } catch (error) {
          diagnosticResults.errors.push('Error ejecutando bypass: ' + (error as Error).message);
        }

        return diagnosticResults;
        
      } catch (error) {
        diagnosticResults.errors.push('Error general: ' + (error as Error).message);
        return diagnosticResults;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};

// Función auxiliar para obtener información de tabla
export const getTableInfo = async (tableName: string) => {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};
