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
 * 
 * IMPORTANTE: Solo incluir funciones que REALMENTE aceptan p_is_test en su firma.
 * Las funciones get_analyst_assigned_leads_v2 y count_analyst_assigned_leads_v2
 * ya NO aceptan p_is_test (filtran internamente), así que NO deben estar aquí.
 */
const SANDBOX_RPC_MAPPINGS: Record<string, string> = {
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
     * @example
     * ```typescript
     * const { data } = await sbx.from('leads').select('*')
     * ```
     */
    from: (table: string) => {
      const baseQuery = supabase.from(table);
      
      // Si la tabla no tiene is_test, retornar query normal
      if (!isSandboxAware(table)) {
        return baseQuery;
      }
      
      // Crear proxy que intercepta métodos y agrega filtro is_test
      return new Proxy(baseQuery, {
        get(target, prop) {
          if (prop === 'select') {
            return (columns: string = '*', options?: any) => {
              return target.select(columns, options).eq('is_test', isSandboxMode);
            };
          }
          // Para otros métodos, devolver el método original
          return (target as any)[prop];
        }
      });
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
     * await sbx.update('leads', { estado: 'aprobado' }).eq('id', leadId)
     * // Solo actualiza leads del mismo ambiente (test o producción)
     * ```
     */
    update: (table: string, updates: any) => {
      const baseQuery = supabase.from(table).update(updates);
      
      if (!isSandboxAware(table)) {
        return baseQuery;
      }
      
      // Retornar query builder con filtro is_test pre-aplicado
      return baseQuery.eq('is_test', isSandboxMode);
    },
    
    /**
     * UPSERT con validación de ambiente
     * Crea o actualiza registros según el ambiente
     * 
     * @example
     * ```typescript
     * await sbx.upsert('lead_approval_process', { lead_id: 'x', analyst_id: 'y', ... })
     * // Automáticamente marca como test si estamos en Sandbox
     * ```
     */
    upsert: async (table: string, data: any | any[]) => {
      if (!isSandboxAware(table)) {
        return supabase.from(table).upsert(data);
      }
      
      // Marcar como test si estamos en Sandbox
      const upsertData = Array.isArray(data) 
        ? data.map(d => ({ ...d, is_test: isSandboxMode }))
        : { ...data, is_test: isSandboxMode };
      
      return supabase.from(table).upsert(upsertData);
    },
    
    /**
     * DELETE con validación de ambiente
     * Previene eliminar datos de producción desde Sandbox
     * 
     * @example
     * ```typescript
     * await sbx.delete('leads').eq('id', leadId)
     * // Solo elimina leads del mismo ambiente
     * ```
     */
    delete: (table: string) => {
      const baseQuery = supabase.from(table).delete();
      
      if (!isSandboxAware(table)) {
        return baseQuery;
      }
      
      // Retornar query builder con filtro is_test pre-aplicado
      return baseQuery.eq('is_test', isSandboxMode);
    },
    
    /**
     * RPC calls con mapeo opcional a funciones _v2
     * 
     * IMPORTANTE: Solo inyecta p_is_test para RPCs que explícitamente lo requieren
     * (definidos en SANDBOX_RPC_MAPPINGS). Para el resto, pasa los parámetros sin modificar.
     * 
     * @example
     * ```typescript
     * // RPCs mapeados (con p_is_test):
     * await sbx.rpc('check_zone_capacity', { p_zona_id: '...' })
     * // Llama a 'check_zone_capacity_v2' con p_is_test agregado
     * 
     * // RPCs no mapeados (sin p_is_test):
     * await sbx.rpc('get_analyst_assigned_leads_v2', { p_limit: 10 })
     * // Llama directamente sin modificar parámetros
     * ```
     */
    rpc: (functionName: string, params: Record<string, any> = {}) => {
      // Verificar si esta función tiene mapeo a versión _v2 con p_is_test
      const hasSandboxMapping = SANDBOX_RPC_MAPPINGS[functionName];
      
      if (hasSandboxMapping) {
        // Para RPCs mapeados: usar versión _v2 e inyectar p_is_test
        const actualFunctionName = SANDBOX_RPC_MAPPINGS[functionName];
        const enhancedParams = {
          ...params,
          p_is_test: isSandboxMode
        };
        
        console.log(`🔧 RPC Call [${isSandboxMode ? 'SANDBOX' : 'PROD'}]: ${actualFunctionName}`, {
          originalFunction: functionName,
          mappedFunction: actualFunctionName,
          p_is_test: isSandboxMode
        });
        
        return supabase.rpc(actualFunctionName, enhancedParams);
      }
      
      // Para RPCs no mapeados: pasar directamente sin modificar
      console.log(`🔧 RPC Call [DIRECT]: ${functionName}`, { params });
      return supabase.rpc(functionName, params);
    },
    
    // Exponer modo actual para validaciones condicionales
    isSandboxMode,
    
    // Cliente Supabase original para casos especiales
    rawClient: supabase
  };
}
