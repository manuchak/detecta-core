import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServicioCustodia {
  id_servicio: string;
  nombre_custodio: string | null;
  fecha_hora_cita: string | null;
  km_recorridos: number | null;
  cobro_cliente: number | null;
  estado: string | null;
}

interface EngagementMetrics {
  custodioId: string;
  nombreCustodio: string;
  totalViajes: number;
  viajesUltimos30Dias: number;
  horasTrabajadasMes: number;
  horasDescansoPromedio: number;
  diasTrabajadosSemana: number;
  frecuenciaUsoApp: number; // viajes por día activo
  scoreEngagement: number;
  nivelRiesgo: 'saludable' | 'moderado' | 'alto' | 'critico';
  tendenciaEngagement: 'creciendo' | 'estable' | 'declinando';
  ultimaActividad: Date;
  ingresoPromedioDiario: number;
  satisfaccionEstimada: number;
}

interface EngagementTrend {
  mes: string;
  año: number;
  custodiosActivos: number;
  engagementPromedio: number;
  horasPromedioTrabajadas: number;
  viajesPromedioPorCustodio: number;
  custodiosEnRiesgo: number;
  rotacionMensual: number;
}

interface EngagementData {
  metricas: EngagementMetrics[];
  tendenciaMensual: EngagementTrend[];
  resumenGeneral: {
    custodiosTotal: number;
    custodiosSaludables: number;
    custodiosEnRiesgo: number;
    engagementPromedio: number;
    horasPromedioPorCustodio: number;
    recomendaciones: string[];
  };
}

export function useCustodianEngagement() {
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);

  // Obtener datos de servicios de custodia
  const { data: serviciosData } = useQuery({
    queryKey: ['custodian-engagement-services'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .rpc('bypass_rls_get_servicios', { max_records: 10000 }); // Aumentar límite
        
        if (error) throw error;
        return data as ServicioCustodia[];
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Error al cargar datos de servicios');
        throw error;
      }
    }
  });

  // Calcular métricas de engagement
  const processedData = useMemo(() => {
    if (!serviciosData || !Array.isArray(serviciosData)) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 meses atrás

    // Filtrar servicios con fecha válida y custodio asignado - extender rango a 6 meses
    const serviciosValidos = serviciosData.filter(s => 
      s.fecha_hora_cita && 
      s.nombre_custodio && 
      s.nombre_custodio !== 'Sin asignar' &&
      new Date(s.fecha_hora_cita) >= sixMonthsAgo // Cambiar a 6 meses
    );

    // Agrupar por custodio
    const custodioGroups = serviciosValidos.reduce((acc, servicio) => {
      const custodio = servicio.nombre_custodio!;
      if (!acc[custodio]) acc[custodio] = [];
      acc[custodio].push(servicio);
      return acc;
    }, {} as Record<string, ServicioCustodia[]>);

    const metricas: EngagementMetrics[] = Object.entries(custodioGroups).map(([nombreCustodio, servicios]) => {
      // Filtrar servicios por períodos
      const serviciosUltimos30 = servicios.filter(s => 
        new Date(s.fecha_hora_cita!) >= thirtyDaysAgo
      );
      const servicios30a60 = servicios.filter(s => 
        new Date(s.fecha_hora_cita!) >= sixtyDaysAgo && 
        new Date(s.fecha_hora_cita!) < thirtyDaysAgo
      );

      // Calcular métricas básicas
      const totalViajes = servicios.length;
      const viajesUltimos30Dias = serviciosUltimos30.length;
      const viajesAnterior30Dias = servicios30a60.length;

      // Calcular horas trabajadas (estimado basado en duración de servicios)
      const horasTrabajadasMes = serviciosUltimos30.reduce((total, servicio) => {
        // Estimamos 2-8 horas por servicio dependiendo de los km
        const kmRecorridos = servicio.km_recorridos || 0;
        const horasEstimadas = Math.max(2, Math.min(8, kmRecorridos / 60)); // 60 km/h promedio
        return total + horasEstimadas;
      }, 0);

      // Calcular días únicos trabajados
      const diasTrabajados = new Set(
        serviciosUltimos30.map(s => 
          new Date(s.fecha_hora_cita!).toDateString()
        )
      ).size;

      // Calcular frecuencia de uso de app (viajes por día activo)
      const frecuenciaUsoApp = diasTrabajados > 0 ? viajesUltimos30Dias / diasTrabajados : 0;

      // Calcular promedio de descanso entre servicios
      const fechasServicios = serviciosUltimos30
        .map(s => new Date(s.fecha_hora_cita!))
        .sort((a, b) => a.getTime() - b.getTime());
      
      let horasDescansoTotal = 0;
      let intervalosDescanso = 0;
      
      for (let i = 1; i < fechasServicios.length; i++) {
        const diferencia = fechasServicios[i].getTime() - fechasServicios[i-1].getTime();
        const horasDiferencia = diferencia / (1000 * 60 * 60);
        if (horasDiferencia > 4 && horasDiferencia < 168) { // Entre 4 horas y 1 semana
          horasDescansoTotal += horasDiferencia;
          intervalosDescanso++;
        }
      }
      
      const horasDescansoPromedio = intervalosDescanso > 0 ? horasDescansoTotal / intervalosDescanso : 24;

      // Calcular tendencia
      let tendenciaEngagement: 'creciendo' | 'estable' | 'declinando' = 'estable';
      if (viajesUltimos30Dias > viajesAnterior30Dias * 1.1) {
        tendenciaEngagement = 'creciendo';
      } else if (viajesUltimos30Dias < viajesAnterior30Dias * 0.9) {
        tendenciaEngagement = 'declinando';
      }

      // Calcular ingresos promedio diario
      const ingresoTotal = serviciosUltimos30.reduce((total, servicio) => {
        return total + (servicio.cobro_cliente || 0);
      }, 0);
      const ingresoPromedioDiario = diasTrabajados > 0 ? ingresoTotal / diasTrabajados : 0;

      // Calcular score de engagement (0-100) con validaciones contra NaN
      let scoreEngagement = 0;
      
      // Componente 1: Actividad (40% del score)
      const actividadScore = Math.min(40, (viajesUltimos30Dias / 20) * 40); // Max 20 viajes por mes
      
      // Componente 2: Balance trabajo-descanso (30% del score)
      const horasSemanales = (horasTrabajadasMes / 4.33); // Promedio semanal
      let balanceScore = 0;
      if (!isNaN(horasSemanales) && horasSemanales >= 20 && horasSemanales <= 48) { // Rango saludable
        balanceScore = 30;
      } else if (!isNaN(horasSemanales) && horasSemanales > 48 && horasSemanales <= 60) {
        balanceScore = 20;
      } else if (!isNaN(horasSemanales) && horasSemanales > 60) {
        balanceScore = 10; // Sobreexplotación
      } else if (!isNaN(horasSemanales)) {
        balanceScore = Math.max(10, (horasSemanales / 20) * 30);
      } else {
        balanceScore = 20; // Valor default si no hay datos
      }
      
      // Componente 3: Descanso adecuado (20% del score)
      let descansoScore = 0;
      if (!isNaN(horasDescansoPromedio) && horasDescansoPromedio >= 12 && horasDescansoPromedio <= 48) {
        descansoScore = 20;
      } else if (!isNaN(horasDescansoPromedio) && horasDescansoPromedio < 12) {
        descansoScore = Math.max(5, (horasDescansoPromedio / 12) * 20);
      } else if (!isNaN(horasDescansoPromedio)) {
        descansoScore = 15;
      } else {
        descansoScore = 15; // Valor default
      }
      
      // Componente 4: Consistencia (10% del score)
      const consistenciaScore = Math.min(10, (diasTrabajados / 20) * 10); // Max 20 días por mes
      
      scoreEngagement = Math.round(actividadScore + balanceScore + descansoScore + consistenciaScore);

      // Determinar nivel de riesgo
      let nivelRiesgo: 'saludable' | 'moderado' | 'alto' | 'critico' = 'saludable';
      if (scoreEngagement < 40) {
        nivelRiesgo = 'critico';
      } else if (scoreEngagement < 60) {
        nivelRiesgo = 'alto';
      } else if (scoreEngagement < 75) {
        nivelRiesgo = 'moderado';
      }

      // Si trabaja más de 60 horas semanales, automáticamente es alto riesgo
      if (horasSemanales > 60) {
        nivelRiesgo = horasSemanales > 80 ? 'critico' : 'alto';
      }

      // Calcular satisfacción estimada basada en ingresos y balance
      const satisfaccionEstimada = Math.min(100, 
        (ingresoPromedioDiario / 1500) * 50 + // 50% basado en ingresos (meta: $1500/día)
        (scoreEngagement / 100) * 50 // 50% basado en engagement
      );

      // Obtener última actividad
      const ultimaActividad = serviciosUltimos30.length > 0 
        ? new Date(Math.max(...serviciosUltimos30.map(s => new Date(s.fecha_hora_cita!).getTime())))
        : new Date(Math.max(...servicios.map(s => new Date(s.fecha_hora_cita!).getTime())));

      return {
        custodioId: nombreCustodio,
        nombreCustodio,
        totalViajes,
        viajesUltimos30Dias,
        horasTrabajadasMes: Math.round(horasTrabajadasMes),
        horasDescansoPromedio: Math.round(horasDescansoPromedio),
        diasTrabajadosSemana: Math.round(diasTrabajados / 4.33),
        frecuenciaUsoApp: Math.round(frecuenciaUsoApp * 10) / 10,
        scoreEngagement: Math.round(scoreEngagement),
        nivelRiesgo,
        tendenciaEngagement,
        ultimaActividad,
        ingresoPromedioDiario: Math.round(ingresoPromedioDiario),
        satisfaccionEstimada: Math.round(satisfaccionEstimada)
      };
    });

    // Calcular tendencia mensual
    const tendenciaMensual: EngagementTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const mesInicio = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesFin = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const serviciosMes = serviciosValidos.filter(s => {
        const fecha = new Date(s.fecha_hora_cita!);
        return fecha >= mesInicio && fecha <= mesFin;
      });

      const custodiosActivosMes = new Set(serviciosMes.map(s => s.nombre_custodio)).size;
      const viajesPromedio = custodiosActivosMes > 0 ? serviciosMes.length / custodiosActivosMes : 0;
      
      // Calcular engagement promedio del mes con validaciones
      const custodiosMes = Array.from(new Set(serviciosMes.map(s => s.nombre_custodio)));
      const engagementPromedio = custodiosMes.length > 0 
        ? custodiosMes.reduce((sum, custodio) => {
            const metrica = metricas.find(m => m.nombreCustodio === custodio);
            const score = metrica?.scoreEngagement;
            // Validar que el score no sea NaN antes de sumarlo
            return sum + (typeof score === 'number' && !isNaN(score) ? score : 0);
          }, 0) / custodiosMes.length
        : 0;

      const custodiosEnRiesgoMes = custodiosMes.filter(c => {
        const metrica = metricas.find(m => m.nombreCustodio === c);
        return metrica && ['alto', 'critico'].includes(metrica.nivelRiesgo);
      }).length;

      tendenciaMensual.push({
        mes: mesInicio.toLocaleDateString('es-ES', { month: 'short' }),
        año: mesInicio.getFullYear(),
        custodiosActivos: custodiosActivosMes,
        engagementPromedio: Math.round(engagementPromedio),
        horasPromedioTrabajadas: 0, // Se calculará después
        viajesPromedioPorCustodio: Math.round(viajesPromedio),
        custodiosEnRiesgo: custodiosEnRiesgoMes,
        rotacionMensual: 0 // Simplificado por ahora
      });
    }

    // Calcular resumen general
    const custodiosTotal = metricas.length;
    const custodiosSaludables = metricas.filter(m => m.nivelRiesgo === 'saludable').length;
    const custodiosEnRiesgo = metricas.filter(m => ['alto', 'critico'].includes(m.nivelRiesgo)).length;
    
    // Calcular engagement promedio con validación contra NaN
    const sumaEngagement = metricas.reduce((sum, m) => {
      const score = typeof m.scoreEngagement === 'number' && !isNaN(m.scoreEngagement) ? m.scoreEngagement : 0;
      return sum + score;
    }, 0);
    const engagementPromedio = metricas.length > 0 ? Math.round(sumaEngagement / metricas.length) : 0;
    
    const horasPromedioPorCustodio = metricas.length > 0
      ? Math.round(metricas.reduce((sum, m) => {
          const horas = typeof m.horasTrabajadasMes === 'number' && !isNaN(m.horasTrabajadasMes) ? m.horasTrabajadasMes : 0;
          return sum + horas;
        }, 0) / metricas.length)
      : 0;

    // Generar recomendaciones
    const recomendaciones: string[] = [];
    
    if (custodiosTotal > 0 && custodiosEnRiesgo / custodiosTotal > 0.3) {
      recomendaciones.push('Alto porcentaje de custodios en riesgo: Revisar cargas de trabajo');
    }
    
    if (engagementPromedio < 60) {
      recomendaciones.push('Engagement general bajo: Implementar programas de motivación');
    }

    if (horasPromedioPorCustodio > 200) {
      recomendaciones.push('Horas excesivas: Contratar más custodios para distribuir carga');
    }

    const custodiosDeclinando = metricas.filter(m => m.tendenciaEngagement === 'declinando').length;
    if (custodiosTotal > 0 && custodiosDeclinando / custodiosTotal > 0.2) {
      recomendaciones.push('Tendencia negativa detectada: Revisar satisfacción laboral');
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push('Engagement general saludable: Mantener estrategias actuales');
    }

    return {
      metricas,
      tendenciaMensual,
      resumenGeneral: {
        custodiosTotal,
        custodiosSaludables,
        custodiosEnRiesgo,
        engagementPromedio,
        horasPromedioPorCustodio,
        recomendaciones
      }
    };
  }, [serviciosData]);

  useEffect(() => {
    if (processedData) {
      setEngagementData(processedData);
      setLoading(false);
    }
  }, [processedData]);

  return {
    engagementData,
    loading,
    refreshData: () => {
      setLoading(true);
      // La query se refrescará automáticamente
    }
  };
}