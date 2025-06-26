
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

        // 3. Intentar consulta directa a la tabla leads
        console.log('🔍 Paso 3: Intentando consulta directa...');
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

        // 4. Verificar si existen leads usando una consulta simple
        console.log('🔍 Paso 4: Verificando existencia de datos...');
        try {
          const { data: simpleQuery, error: simpleError } = await supabase
            .from('leads')
            .select('id, nombre, email')
            .limit(1);
          
          if (simpleError) {
            diagnosticResults.errors.push('Error en consulta simple: ' + simpleError.message);
          } else if (simpleQuery && simpleQuery.length > 0) {
            console.log('✅ Se encontraron leads en la base de datos');
            diagnosticResults.tableExists = true;
          } else {
            console.log('⚠️ No se encontraron leads en la base de datos');
            diagnosticResults.errors.push('La tabla leads está vacía');
          }
        } catch (error) {
          diagnosticResults.errors.push('Error verificando datos: ' + (error as Error).message);
        }

        // 5. Verificar permisos básicos - intentar insertar y eliminar un registro de prueba
        console.log('🔍 Paso 5: Verificando permisos de escritura...');
        try {
          // Intentar insertar un lead de prueba
          const testLead = {
            nombre: 'Test Lead - Diagnóstico',
            email: `test-${Date.now()}@diagnostic.com`,
            telefono: '+52 55 0000 0000',
            estado: 'nuevo',
            fuente: 'diagnostic',
            notas: 'Lead de prueba para diagnóstico - eliminar'
          };

          const { data: insertData, error: insertError } = await supabase
            .from('leads')
            .insert([testLead])
            .select()
            .single();

          if (insertError) {
            diagnosticResults.errors.push('Error de permisos INSERT: ' + insertError.message);
          } else {
            console.log('✅ Permisos de INSERT funcionan correctamente');
            
            // Intentar eliminar el lead de prueba
            const { error: deleteError } = await supabase
              .from('leads')
              .delete()
              .eq('id', insertData.id);

            if (deleteError) {
              console.log('⚠️ Error eliminando lead de prueba:', deleteError.message);
            } else {
              console.log('✅ Permisos de DELETE funcionan correctamente');
            }
          }
        } catch (error) {
          diagnosticResults.errors.push('Error verificando permisos: ' + (error as Error).message);
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
