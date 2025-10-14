import { useSandbox } from '@/contexts/SandboxContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tablas que soportan segregación Sandbox/Producción
 * Cualquier query a estas tablas se filtrará automáticamente por is_test
 */
const SANDBOX_AWARE_TABLES = [
  'leads', 
  'candidatos_custodios', 
  'vapi_call_logs', 
  'dialfire_call_logs',
  'manual_call_logs',
  'lead_approval_process'
] as const;

type SandboxAwareTable = typeof SANDBOX_AWARE_TABLES[number];

/**
 * Mapeo de funciones RPC a sus versiones Sandbox-aware (_v2)
 * Solo se usan en modo Sandbox para garantizar aislamiento
 */
const SANDBOX_RPC_MAPPINGS: Record<string, string> = {
  'get_analyst_assigned_leads': 'get_analyst_assigned_leads_v2',
  'check_zone_capacity': 'check_zone_capacity_v2',
  'move_lead_to_pool': 'move_lead_to_pool_v2',
  'reactivate_lead_from_pool': 'reactivate_lead_from_pool_v2'
};

/**
 * Hook que inyecta automáticamente el filtro is_test en queries de Supabase
 * 
 * SEGURIDAD: Garantiza que Sandbox y Producción estén completamente aislados
 * 
 * @example
 * ```typescript
 * const sbx = useSandboxAwareSupabase();
 * 
 * // SELECT - filtra automáticamente por is_test
 * const query = sbx.from('leads').select('*');
 * // En Sandbox: WHERE is_test = TRUE
 * // En Producción: WHERE is_test = FALSE
 * 
 * // INSERT - marca automáticamente con is_test
 * await sbx.insert('leads', { nombre: 'Test', ... })
 * // Automáticamente agrega: is_test: true (si estás en Sandbox)
 * ```
 */
export function useSandboxAwareSupabase() {
  const { isSandboxMode } = useSandbox();
  
  const isSandboxAware = (table: string): table is SandboxAwareTable => {
    return SANDBOX_AWARE_TABLES.includes(table as any);
  };

  return {
    /**
     * Query builder con filtro automático por is_test
     * 
     * IMPORTANTE: Debes encadenar .select() inmediatamente después
     * 
     * @example
     * ```typescript
     * // ✅ CORRECTO
     * const { data } = await sbx.from('leads').select('*')
     * 
     * // ❌ INCORRECTO - no guardes el builder
     * const builder = sbx.from('leads')
     * const { data } = await builder.select('*') // No funciona con filtro
     * ```
     */
    from: (table: string) => {
      const baseQuery = supabase.from(table);
      
      // Si la tabla no tiene is_test, retornar query normal
      if (!isSandboxAware(table)) {
        return baseQuery;
      }
      
      // Retornar proxy con filtro aplicado
      return {
        select: (columns: string = '*', options?: any) => {
          return baseQuery.select(columns, options).eq('is_test', isSandboxMode);
        }
      };
    },
    
    /**
     * INSERT automático que marca is_test según contexto
     * 
     * @example
     * ```typescript
     * await sbx.insert('leads', { nombre: 'Test', ... })
     * // Automáticamente agrega: is_test: true (si estás en Sandbox)
     * ```
     */
    insert: async (table: string, data: any | any[]) => {
      if (!isSandboxAware(table)) {
        return supabase.from(table).insert(data);
      }
      
      // Marcar como test si estamos en Sandbox
      const insertData = Array.isArray(data) 
        ? data.map(d => ({ ...d, is_test: isSandboxMode }))
        : { ...data, is_test: isSandboxMode };
      
      return supabase.from(table).insert(insertData);
    },
    
    /**
     * UPDATE con validación de ambiente
     * Previene actualizar datos de producción desde Sandbox
     * 
     * @example
     * ```typescript
     * await sbx.update('leads', { estado: 'aprobado' }, { id: leadId })
     * // Solo actualiza leads del mismo ambiente (test o producción)
     * ```
     */
    update: async (table: string, updates: any, filter: any) => {
      if (!isSandboxAware(table)) {
        return supabase.from(table).update(updates).match(filter);
      }
      
      // Agregar filtro is_test a la condición
      return supabase
        .from(table)
        .update(updates)
        .match({ ...filter, is_test: isSandboxMode });
    },
    
    /**
     * DELETE con validación de ambiente
     * Previene eliminar datos de producción desde Sandbox
     * 
     * @example
     * ```typescript
     * await sbx.delete('leads', { id: leadId })
     * // Solo elimina leads del mismo ambiente
     * ```
     */
    delete: async (table: string, filter: any) => {
      if (!isSandboxAware(table)) {
        return supabase.from(table).delete().match(filter);
      }
      
      return supabase
        .from(table)
        .delete()
        .match({ ...filter, is_test: isSandboxMode });
    },
    
    /**
     * RPC calls con inyección automática de is_test y mapeo a funciones _v2
     * 
     * SEGURIDAD: En Sandbox, usa automáticamente versiones _v2 que filtran por ambiente
     * 
     * @example
     * ```typescript
     * // En Sandbox:
     * await sbx.rpc('get_analyst_assigned_leads', {})
     * // Automáticamente llama a 'get_analyst_assigned_leads_v2' con p_is_test: true
     * 
     * // En Producción:
     * await sbx.rpc('get_analyst_assigned_leads', {})
     * // Llama a 'get_analyst_assigned_leads_v2' con p_is_test: false
     * ```
     */
    rpc: (functionName: string, params: Record<string, any> = {}) => {
      // Si está en Sandbox y existe mapeo a _v2, usar la versión segura
      const actualFunctionName = SANDBOX_RPC_MAPPINGS[functionName] 
        ? SANDBOX_RPC_MAPPINGS[functionName]
        : functionName;
      
      // Inyectar p_is_test en parámetros
      const enhancedParams = {
        ...params,
        p_is_test: isSandboxMode
      };
      
      console.log(`🔧 RPC Call [${isSandboxMode ? 'SANDBOX' : 'PROD'}]: ${actualFunctionName}`, enhancedParams);
      
      return supabase.rpc(actualFunctionName, enhancedParams);
    },
    
    // Exponer modo actual para validaciones condicionales
    isSandboxMode,
    
    // Cliente Supabase original para casos especiales
    rawClient: supabase
  };
}
