import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subMonths } from 'date-fns';
import {
  calcularGini,
  calcularEntropia,
  calcularHHI,
  calcularZScores,
  calcularPalmaRatio,
  categorizarZScore,
  calcularMedia,
  interpretarGini,
  interpretarHHI,
  normalizarNombre,
  ZScoreCategoria,
} from '@/utils/fairnessAlgorithms';

export type PeriodoEquidadArmados = 'semana' | 'mes_actual' | 'ultimos_30' | 'trimestre' | 'year';

export interface ArmadoDesviado {
  id: string;
  nombre: string;
  asignaciones: number;
  zScore: number;
  categoria: ZScoreCategoria;
  desviacionPct: number;
  serviciosHistoricos: number;
}

export interface ArmadoSinAsignacion {
  id: string;
  nombre: string;
  serviciosHistoricos: number;
  scoreTotal: number | null;
  zona: string | null;
}

export interface ArmadosFairnessMetrics {
  resumen: {
    poolActivo: number;
    armadosConAsignacion: number;
    coberturaPool: number;
    totalAsignaciones: number;
    gini: number;
    giniInterpretacion: 'bajo' | 'moderado' | 'alto';
    entropia: number;
    entropiaMaxima: number;
    entropiaPct: number;
    hhi: number;
    hhiInterpretacion: 'baja' | 'moderada' | 'alta';
    palmaRatio: number;
  };
  
  desviaciones: ArmadoDesviado[];
  armadosSinAsignacion: ArmadoSinAsignacion[];
  
  alertas: Array<{
    tipo: string;
    severidad: 'alta' | 'media' | 'baja';
    descripcion: string;
    recomendacion: string;
  }>;
  
  datosInsuficientes: boolean;
}

function getDateRangeForPeriodo(periodo: PeriodoEquidadArmados): { desde: Date; hasta: Date } {
  const hasta = new Date();
  let desde: Date;
  
  switch (periodo) {
    case 'semana':
      desde = subDays(hasta, 7);
      break;
    case 'mes_actual':
      desde = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
      break;
    case 'ultimos_30':
      desde = subDays(hasta, 30);
      break;
    case 'trimestre':
      desde = subMonths(hasta, 3);
      break;
    case 'year':
      desde = subMonths(hasta, 12);
      break;
    default:
      desde = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
  }
  
  return { desde, hasta };
}

export function useArmadosFairnessMetrics(periodo: PeriodoEquidadArmados = 'mes_actual') {
  return useQuery({
    queryKey: ['armados-fairness-metrics', periodo],
    queryFn: async (): Promise<ArmadosFairnessMetrics> => {
      const { desde, hasta } = getDateRangeForPeriodo(periodo);
      
      // 1. Get the active internal armed elements pool
      const { data: poolArmados, error: poolError } = await supabase
        .from('armados_operativos')
        .select('id, nombre, numero_servicios, score_total, zona_base')
        .eq('tipo_armado', 'interno')
        .eq('estado', 'activo');
      
      if (poolError) throw poolError;
      
      const pool = poolArmados || [];
      const poolActivo = pool.length;
      
      // 2. Get services with armed assignments in the period
      // Using servicios_custodia as it has more data (2500+ vs 8 in asignacion_armados)
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios_custodia')
        .select('id, nombre_armado, fecha_hora_cita, proveedor')
        .not('nombre_armado', 'is', null)
        .neq('nombre_armado', '')
        .gte('fecha_hora_cita', desde.toISOString())
        .lte('fecha_hora_cita', hasta.toISOString());
      
      if (serviciosError) throw serviciosError;
      
      // 3. Filter out external providers (CUSAEM, SEICSA)
      const serviciosInternos = (servicios || []).filter(s => {
        const proveedor = (s.proveedor || '').toLowerCase();
        return !proveedor.includes('cusaem') && !proveedor.includes('seicsa');
      });
      
      const totalAsignaciones = serviciosInternos.length;
      
      // Check for insufficient data
      if (totalAsignaciones < 5) {
        return {
          resumen: {
            poolActivo,
            armadosConAsignacion: 0,
            coberturaPool: 0,
            totalAsignaciones,
            gini: 0,
            giniInterpretacion: 'bajo',
            entropia: 0,
            entropiaMaxima: 0,
            entropiaPct: 0,
            hhi: 0,
            hhiInterpretacion: 'baja',
            palmaRatio: 1,
          },
          desviaciones: [],
          armadosSinAsignacion: pool.map(a => ({
            id: a.id,
            nombre: a.nombre,
            serviciosHistoricos: a.numero_servicios || 0,
            scoreTotal: a.score_total,
            zona: a.zona_base,
          })),
          alertas: [{
            tipo: 'DATOS_INSUFICIENTES',
            severidad: 'baja',
            descripcion: `Solo ${totalAsignaciones} asignaciones en el período. Se requieren al menos 5 para análisis significativo.`,
            recomendacion: 'Ampliar el rango de fechas o esperar más asignaciones',
          }],
          datosInsuficientes: true,
        };
      }
      
      // 4. Build pool lookup map with normalized names
      const poolByNormalizedName = new Map<string, typeof pool[0]>();
      pool.forEach(a => {
        poolByNormalizedName.set(normalizarNombre(a.nombre), a);
      });
      
      // 5. Count assignments per armed element (normalized)
      const asignacionesPorNombre = new Map<string, { 
        nombre: string; 
        count: number;
        poolRecord?: typeof pool[0];
      }>();
      
      serviciosInternos.forEach(s => {
        const nombreOriginal = s.nombre_armado || '';
        const nombreNormalizado = normalizarNombre(nombreOriginal);
        
        if (!asignacionesPorNombre.has(nombreNormalizado)) {
          asignacionesPorNombre.set(nombreNormalizado, { 
            nombre: nombreOriginal,
            count: 0,
            poolRecord: poolByNormalizedName.get(nombreNormalizado),
          });
        }
        asignacionesPorNombre.get(nombreNormalizado)!.count++;
      });
      
      // 6. Calculate fairness metrics
      const asignacionesArray = Array.from(asignacionesPorNombre.values());
      const valores = asignacionesArray.map(a => a.count);
      
      const gini = calcularGini(valores);
      const { entropia, maxima } = calcularEntropia(valores);
      const hhi = calcularHHI(valores);
      const palmaRatio = calcularPalmaRatio(valores);
      const zScores = calcularZScores(valores);
      const mean = calcularMedia(valores);
      
      // 7. Pool coverage
      const armadosConAsignacion = asignacionesPorNombre.size;
      const coberturaPool = poolActivo > 0 ? (armadosConAsignacion / poolActivo) * 100 : 0;
      
      // 8. Identify deviations
      const desviaciones: ArmadoDesviado[] = asignacionesArray
        .map((a, i) => ({
          id: a.poolRecord?.id || `temp-${i}`,
          nombre: a.nombre,
          asignaciones: a.count,
          zScore: zScores[i] || 0,
          categoria: categorizarZScore(zScores[i] || 0),
          desviacionPct: mean > 0 ? ((a.count - mean) / mean) * 100 : 0,
          serviciosHistoricos: a.poolRecord?.numero_servicios || 0,
        }))
        .filter(a => a.categoria !== 'NORMAL')
        .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
        .slice(0, 15);
      
      // 9. Identify pool members without assignments
      const nombresAsignados = new Set(
        Array.from(asignacionesPorNombre.keys())
      );
      
      const armadosSinAsignacion: ArmadoSinAsignacion[] = pool
        .filter(a => !nombresAsignados.has(normalizarNombre(a.nombre)))
        .map(a => ({
          id: a.id,
          nombre: a.nombre,
          serviciosHistoricos: a.numero_servicios || 0,
          scoreTotal: a.score_total,
          zona: a.zona_base,
        }))
        .sort((a, b) => b.serviciosHistoricos - a.serviciosHistoricos);
      
      // 10. Generate alerts
      const alertas: ArmadosFairnessMetrics['alertas'] = [];
      
      if (coberturaPool < 30 && poolActivo > 10) {
        alertas.push({
          tipo: 'COBERTURA_BAJA',
          severidad: 'alta',
          descripcion: `Solo ${coberturaPool.toFixed(1)}% del pool recibió asignaciones (${armadosConAsignacion} de ${poolActivo})`,
          recomendacion: 'Rotar asignaciones para incluir más elementos del pool',
        });
      }
      
      if (gini > 0.30) {
        alertas.push({
          tipo: 'GINI_ALTO',
          severidad: gini > 0.40 ? 'alta' : 'media',
          descripcion: `Índice Gini de ${gini.toFixed(3)} indica distribución ${interpretarGini(gini)}`,
          recomendacion: 'Redistribuir asignaciones hacia elementos con menos servicios',
        });
      }
      
      const muyFavorecidos = desviaciones.filter(d => d.categoria === 'MUY_FAVORECIDO');
      if (muyFavorecidos.length >= 2) {
        alertas.push({
          tipo: 'CONCENTRACION',
          severidad: 'media',
          descripcion: `${muyFavorecidos.length} elementos reciben significativamente más asignaciones`,
          recomendacion: 'Diversificar distribución entre más elementos',
        });
      }
      
      if (armadosSinAsignacion.length > poolActivo * 0.5) {
        alertas.push({
          tipo: 'POOL_SUBUTILIZADO',
          severidad: 'media',
          descripcion: `${armadosSinAsignacion.length} elementos activos sin asignaciones`,
          recomendacion: 'Considerar estos elementos para próximas asignaciones',
        });
      }
      
      return {
        resumen: {
          poolActivo,
          armadosConAsignacion,
          coberturaPool,
          totalAsignaciones,
          gini,
          giniInterpretacion: interpretarGini(gini),
          entropia,
          entropiaMaxima: maxima,
          entropiaPct: maxima > 0 ? (entropia / maxima) * 100 : 0,
          hhi,
          hhiInterpretacion: interpretarHHI(hhi),
          palmaRatio,
        },
        desviaciones,
        armadosSinAsignacion,
        alertas,
        datosInsuficientes: false,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
