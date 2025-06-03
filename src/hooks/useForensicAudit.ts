
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ForensicAuditData {
  // Conteos básicos
  total_registros_raw: number;
  registros_con_fecha_valida: number;
  registros_enero_actual: number;
  
  // Análisis de duplicados y calidad
  servicios_unicos_id: number;
  registros_duplicados_id: number;
  registros_sin_id: number;
  
  // Análisis de estados
  estados_distintos: number;
  servicios_finalizado_exact: number;
  servicios_completado: number;
  servicios_pendientes: number;
  servicios_cancelados: number;
  servicios_estado_null: number;
  servicios_estado_vacio: number;
  
  // Análisis financiero
  registros_con_cobro_valido: number;
  registros_con_cobro_zero: number;
  registros_con_cobro_null: number;
  gmv_total_sin_filtros: number;
  gmv_solo_finalizados: number;
  gmv_solo_completados: number;
  
  // Análisis de custodios
  custodios_distintos: number;
  registros_sin_custodio: number;
  custodios_con_hash_na: number;
  
  // Análisis de clientes
  clientes_distintos: number;
  registros_sin_cliente: number;
  
  // Análisis de rutas
  registros_con_origen: number;
  registros_con_destino: number;
  registros_con_ruta_completa: number;
  
  // Metadatos temporales
  fecha_mas_antigua: string;
  fecha_mas_reciente: string;
  registros_fuera_rango: number;
}

interface DashboardComparison {
  metric_name: string;
  dashboard_value: number;
  forensic_value: number;
  discrepancy: number;
  discrepancy_percent: number;
  status: 'OK' | 'MEDIA' | 'CRÍTICA';
}

interface SuspiciousPattern {
  pattern_type: string;
  pattern_description: string;
  count_found: number;
  severity: 'BAJA' | 'MEDIA' | 'ALTA';
  sample_data: string;
}

export const useForensicAudit = () => {
  
  // Auditoría principal
  const { data: forensicData, isLoading: forensicLoading, error: forensicError } = useQuery({
    queryKey: ['forensic-audit'],
    queryFn: async (): Promise<ForensicAuditData> => {
      console.log('🔍 === INICIANDO AUDITORÍA FORENSE ===');
      
      try {
        // Usar RPC para llamar a la función de auditoría forense
        const { data, error } = await supabase.rpc('forensic_audit_servicios_enero_actual');
        
        if (error) {
          console.error('Error en auditoría forense:', error);
          throw error;
        }
        
        // La función devuelve un array con un solo resultado
        const result = Array.isArray(data) ? data[0] : data;
        
        if (!result) {
          throw new Error('No se obtuvieron datos de la auditoría forense');
        }
        
        console.log('📊 RESULTADOS AUDITORÍA FORENSE:');
        console.log(`Total registros raw: ${result.total_registros_raw}`);
        console.log(`Registros enero-actual: ${result.registros_enero_actual}`);
        console.log(`Servicios únicos: ${result.servicios_unicos_id}`);
        console.log(`Duplicados encontrados: ${result.registros_duplicados_id}`);
        console.log(`GMV total sin filtros: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.gmv_total_sin_filtros)}`);
        console.log(`GMV solo finalizados: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(result.gmv_solo_finalizados)}`);
        console.log(`Estados distintos: ${result.estados_distintos}`);
        console.log(`Custodios distintos: ${result.custodios_distintos}`);
        
        return result as ForensicAuditData;
      } catch (error) {
        console.error('Error ejecutando auditoría forense:', error);
        throw new Error('No se pudo ejecutar la auditoría forense');
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  });

  // Comparación con dashboard
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ['dashboard-comparison'],
    queryFn: async (): Promise<DashboardComparison[]> => {
      console.log('⚖️ === COMPARANDO CON DASHBOARD ===');
      
      try {
        const { data, error } = await supabase.rpc('compare_dashboard_vs_forensic');
        
        if (error) {
          console.error('Error en comparación:', error);
          throw error;
        }
        
        const result = Array.isArray(data) ? data : [data];
        
        console.log('📈 DISCREPANCIAS ENCONTRADAS:');
        result?.forEach((item: DashboardComparison) => {
          console.log(`${item.metric_name}: Dashboard=${item.dashboard_value}, Forense=${item.forensic_value}, Diferencia=${item.discrepancy} (${item.discrepancy_percent}%) - ${item.status}`);
        });
        
        return result as DashboardComparison[];
      } catch (error) {
        console.error('Error en comparación dashboard:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    enabled: !!forensicData // Solo ejecutar después de que tengamos datos forenses
  });

  // Patrones sospechosos
  const { data: suspiciousPatterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['suspicious-patterns'],
    queryFn: async (): Promise<SuspiciousPattern[]> => {
      console.log('🚨 === DETECTANDO PATRONES SOSPECHOSOS ===');
      
      try {
        const { data, error } = await supabase.rpc('detect_suspicious_patterns');
        
        if (error) {
          console.error('Error detectando patrones:', error);
          throw error;
        }
        
        const result = Array.isArray(data) ? data : [data];
        
        console.log('⚠️ PATRONES SOSPECHOSOS:');
        result?.forEach((pattern: SuspiciousPattern) => {
          console.log(`${pattern.pattern_type} (${pattern.severity}): ${pattern.count_found} casos - ${pattern.pattern_description}`);
          if (pattern.sample_data) {
            console.log(`  Ejemplos: ${pattern.sample_data}`);
          }
        });
        
        return result as SuspiciousPattern[];
      } catch (error) {
        console.error('Error detectando patrones:', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000,
    retry: 2
  });

  return {
    forensicData,
    comparisonData,
    suspiciousPatterns,
    isLoading: forensicLoading || comparisonLoading || patternsLoading,
    error: forensicError,
    
    // Funciones de análisis
    hasDiscrepancies: comparisonData?.some(item => item.status !== 'OK') || false,
    criticalIssues: comparisonData?.filter(item => item.status === 'CRÍTICA') || [],
    highSeverityPatterns: suspiciousPatterns?.filter(pattern => pattern.severity === 'ALTA') || []
  };
};
