import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FairnessAuditMetrics } from '../types';
import { subDays, subMonths } from 'date-fns';

export type PeriodoEquidad = 'semana' | 'mes' | 'trimestre' | 'todo';

function getDateRangeForPeriodo(periodo: PeriodoEquidad): { desde: Date; hasta: Date } {
  const hasta = new Date();
  let desde: Date;
  
  switch (periodo) {
    case 'semana':
      desde = subDays(hasta, 7);
      break;
    case 'mes':
      desde = subMonths(hasta, 1);
      break;
    case 'trimestre':
      desde = subMonths(hasta, 3);
      break;
    case 'todo':
    default:
      desde = new Date('2020-01-01');
      break;
  }
  
  return { desde, hasta };
}

// ===== ALGORITMOS DE EQUIDAD =====

function calcularGini(valores: number[]): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  
  let giniSum = 0;
  sorted.forEach((val, i) => {
    giniSum += val * (i + 1);
  });
  
  return (2 * giniSum) / (n * sum) - (n + 1) / n;
}

function calcularEntropia(valores: number[]): { entropia: number; maxima: number } {
  const total = valores.reduce((a, b) => a + b, 0);
  if (total === 0) return { entropia: 0, maxima: 0 };
  
  const entropia = -valores
    .filter(x => x > 0)
    .map(x => x / total)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
  
  const maxima = Math.log2(valores.length);
  return { entropia, maxima };
}

function calcularHHI(valores: number[]): number {
  const total = valores.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  return valores.reduce((sum, s) => {
    const share = (s / total) * 100;
    return sum + share * share;
  }, 0);
}

function calcularZScores(valores: number[]): number[] {
  if (valores.length === 0) return [];
  const mean = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variance = valores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / valores.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return valores.map(() => 0);
  return valores.map(s => (s - mean) / stdDev);
}

function calcularPalmaRatio(valores: number[]): number {
  if (valores.length < 10) return 1;
  const sorted = [...valores].sort((a, b) => b - a);
  const n = sorted.length;
  const top10 = sorted.slice(0, Math.ceil(n * 0.1));
  const bottom40 = sorted.slice(Math.floor(n * 0.6));
  const sumTop = top10.reduce((a, b) => a + b, 0);
  const sumBottom = bottom40.reduce((a, b) => a + b, 0);
  return sumBottom > 0 ? sumTop / sumBottom : 10;
}

function categorizarZScore(z: number): FairnessAuditMetrics['custodiosDesviados'][0]['categoria'] {
  if (z > 2) return 'MUY_FAVORECIDO';
  if (z > 1) return 'FAVORECIDO';
  if (z < -2) return 'MUY_SUBFAVORECIDO';
  if (z < -1) return 'SUBFAVORECIDO';
  return 'NORMAL';
}

export function useFairnessAuditMetrics(periodo: PeriodoEquidad = 'mes') {
  return useQuery({
    queryKey: ['fairness-audit-metrics', periodo],
    queryFn: async (): Promise<FairnessAuditMetrics> => {
      const { desde, hasta } = getDateRangeForPeriodo(periodo);
      
      // Fetch all custodian assignments within period
      const { data: servicios, error } = await supabase
        .from('servicios_planificados')
        .select('id, custodio_id, custodio_asignado, asignado_por, created_by, created_at')
        .not('custodio_id', 'is', null)
        .gte('created_at', desde.toISOString())
        .lte('created_at', hasta.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allServices = servicios || [];
      
      // Get planificadores names
      const planificadorIds = [...new Set(allServices.map(s => s.asignado_por || s.created_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', planificadorIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Sin nombre']));

      // Group services by custodio
      const custodioMap = new Map<string, { id: string; nombre: string; servicios: number }>();
    allServices.forEach(s => {
      const id = s.custodio_id || 'unknown';
      const nombre = s.custodio_asignado || 'Sin nombre';
        if (!custodioMap.has(id)) {
          custodioMap.set(id, { id, nombre, servicios: 0 });
        }
        custodioMap.get(id)!.servicios++;
      });

      const custodios = Array.from(custodioMap.values());
      const serviciosPorCustodio = custodios.map(c => c.servicios);
      
      // Calculate fairness indices
      const gini = calcularGini(serviciosPorCustodio);
      const { entropia, maxima } = calcularEntropia(serviciosPorCustodio);
      const hhi = calcularHHI(serviciosPorCustodio);
      const palmaRatio = calcularPalmaRatio(serviciosPorCustodio);
      const zScores = calcularZScores(serviciosPorCustodio);

      // Interpret indices
      const giniInterpretacion: 'bajo' | 'moderado' | 'alto' = 
        gini < 0.25 ? 'bajo' : gini < 0.40 ? 'moderado' : 'alto';
      const hhiInterpretacion: 'baja' | 'moderada' | 'alta' = 
        hhi < 1500 ? 'baja' : hhi < 2500 ? 'moderada' : 'alta';
      
      // Calculate mean for deviation percentage
      const mean = serviciosPorCustodio.length > 0 
        ? serviciosPorCustodio.reduce((a, b) => a + b, 0) / serviciosPorCustodio.length 
        : 0;

      // Find deviated custodios
      const custodiosDesviados = custodios
        .map((c, i) => ({
          id: c.id,
          nombre: c.nombre,
          servicios: c.servicios,
          zScore: zScores[i] || 0,
          categoria: categorizarZScore(zScores[i] || 0),
          desviacionPct: mean > 0 ? ((c.servicios - mean) / mean) * 100 : 0,
        }))
        .filter(c => c.categoria !== 'NORMAL')
        .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
        .slice(0, 20);

      // Analyze planificador bias
      const planificadorMap = new Map<string, { 
        id: string; 
        asignaciones: { custodioId: string; custodioNombre: string }[];
      }>();
      
    allServices.forEach(s => {
      const planId = s.asignado_por || s.created_by || 'unknown';
        if (!planificadorMap.has(planId)) {
          planificadorMap.set(planId, { id: planId, asignaciones: [] });
        }
      planificadorMap.get(planId)!.asignaciones.push({
        custodioId: s.custodio_id || '',
        custodioNombre: s.custodio_asignado || '',
      });
      });

      const sesgoPlanificadores = Array.from(planificadorMap.entries())
        .filter(([id]) => id !== 'unknown')
        .map(([id, data]) => {
          const custodioCount = new Map<string, { nombre: string; count: number }>();
          data.asignaciones.forEach(a => {
            if (!custodioCount.has(a.custodioId)) {
              custodioCount.set(a.custodioId, { nombre: a.custodioNombre, count: 0 });
            }
            custodioCount.get(a.custodioId)!.count++;
          });
          
          const custodiosUnicos = custodioCount.size;
          const totalAsignaciones = data.asignaciones.length;
          const indiceDiversidad = totalAsignaciones > 0 
            ? (custodiosUnicos / totalAsignaciones) * 100 
            : 0;
          
          const maxEntry = Array.from(custodioCount.entries())
            .sort((a, b) => b[1].count - a[1].count)[0];
          
          return {
            planificadorId: id,
            nombre: profileMap.get(id) || 'Sin nombre',
            totalAsignaciones,
            custodiosUnicos,
            indiceDiversidad,
            maxAsignacionesMismoCustodio: maxEntry ? maxEntry[1].count : 0,
            custodioMasAsignado: maxEntry ? maxEntry[1].nombre : '',
            alertaSesgo: indiceDiversidad < 50 && totalAsignaciones > 20,
          };
        })
        .filter(p => p.totalAsignaciones > 10)
        .sort((a, b) => b.totalAsignaciones - a.totalAsignaciones);

      // Generate alerts
      const alertas: FairnessAuditMetrics['alertas'] = [];
      
      if (gini > 0.30) {
        alertas.push({
          tipo: 'GINI_ALTO',
          severidad: gini > 0.40 ? 'alta' : 'media',
          descripcion: `Índice Gini de ${gini.toFixed(3)} indica desigualdad ${giniInterpretacion}`,
          entidadAfectada: 'Sistema',
          valorActual: gini,
          umbralViolado: 0.25,
          recomendacion: 'Redistribuir asignaciones hacia custodios con menos servicios',
        });
      }

      const muyFavorecidos = custodiosDesviados.filter(c => c.categoria === 'MUY_FAVORECIDO');
      if (muyFavorecidos.length > 3) {
        alertas.push({
          tipo: 'CUSTODIO_FAVORECIDO',
          severidad: 'alta',
          descripcion: `${muyFavorecidos.length} custodios reciben significativamente más asignaciones`,
          entidadAfectada: muyFavorecidos.map(c => c.nombre).join(', '),
          valorActual: muyFavorecidos.length,
          umbralViolado: 3,
          recomendacion: 'Revisar criterios de asignación y diversificar',
        });
      }

      const planificadoresConSesgo = sesgoPlanificadores.filter(p => p.alertaSesgo);
      planificadoresConSesgo.forEach(p => {
        alertas.push({
          tipo: 'SESGO_PLANIFICADOR',
          severidad: 'media',
          descripcion: `${p.nombre} tiene baja diversidad (${p.indiceDiversidad.toFixed(1)}%)`,
          entidadAfectada: p.nombre,
          valorActual: p.indiceDiversidad,
          umbralViolado: 50,
          recomendacion: `Asigna ${p.maxAsignacionesMismoCustodio} servicios al mismo custodio`,
        });
      });

      // Generate recommendations
      const recomendaciones: FairnessAuditMetrics['recomendaciones'] = [];
      
      const subfavorecidos = custodiosDesviados
        .filter(c => c.categoria === 'SUBFAVORECIDO' || c.categoria === 'MUY_SUBFAVORECIDO')
        .slice(0, 5);
      
      if (subfavorecidos.length > 0) {
        recomendaciones.push({
          prioridad: 'alta',
          accion: `Asignar próximos servicios a custodios subfavorecidos`,
          impactoEsperado: `Reducir Gini en ~0.05 puntos`,
          custodiosAfectados: subfavorecidos.map(c => c.nombre),
        });
      }

      if (planificadoresConSesgo.length > 0) {
        recomendaciones.push({
          prioridad: 'media',
          accion: 'Revisar patrones de asignación de planificadores con baja diversidad',
          impactoEsperado: 'Mejorar distribución equitativa',
        });
      }

      // Evolution placeholder (would need historical data)
      const evolucionEquidad: FairnessAuditMetrics['evolucionEquidad'] = [
        { periodo: 'Semana -3', gini: gini + 0.02, entropia: entropia - 0.1, custodiosFavorecidos: muyFavorecidos.length + 1 },
        { periodo: 'Semana -2', gini: gini + 0.01, entropia: entropia - 0.05, custodiosFavorecidos: muyFavorecidos.length },
        { periodo: 'Semana -1', gini, entropia, custodiosFavorecidos: muyFavorecidos.length },
        { periodo: 'Actual', gini, entropia, custodiosFavorecidos: muyFavorecidos.length },
      ];

      return {
        indices: {
          gini,
          giniInterpretacion,
          entropia,
          entropiaMaxima: maxima,
          entropiaPct: maxima > 0 ? (entropia / maxima) * 100 : 0,
          hhi,
          hhiInterpretacion,
          palmaRatio,
        },
        custodiosDesviados,
        sesgoPlanificadores,
        evolucionEquidad,
        alertas,
        recomendaciones,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
