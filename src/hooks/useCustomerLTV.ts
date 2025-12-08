// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateDynamicRetention } from '@/utils/dynamicRetentionCalculator';
import { getUTCMonth, getUTCYear } from '@/utils/timezoneUtils';

export interface LTVMetrics {
  overallLTV: number;
  averageRevenuePerService: number;
  averageServicesPerCustodian: number;
  averageRetentionMonths: number;
  ltvByZone: Record<string, number>;
  ltvTrend: Array<{ month: string; ltv: number }>;
  activeCustodians: number;
  totalRevenue: number;
  confidence: number;
}

export const useCustomerLTV = () => {
  const [loading, setLoading] = useState(false);
  const [ltvMetrics, setLtvMetrics] = useState<LTVMetrics>({
    overallLTV: 0,
    averageRevenuePerService: 0,
    averageServicesPerCustodian: 0,
    averageRetentionMonths: 0,
    ltvByZone: {},
    ltvTrend: [],
    activeCustodians: 0,
    totalRevenue: 0,
    confidence: 0
  });
  const { toast } = useToast();

  const calculateLTVMetrics = async () => {
    setLoading(true);
    
    try {
      // Obtener permanencia MEDIANA (custodio típico, no promedio inflado por outliers)
      const dynamicMetrics = await calculateDynamicRetention();
      const permanenciaMediana = dynamicMetrics.tiempoMedianoPermanencia;

      // Obtener servicios finalizados con cobro válido
      const { data: services, error } = await supabase
        .from('servicios_custodia')
        .select(`
          id_servicio,
          nombre_custodio,
          cobro_cliente,
          fecha_hora_cita,
          estado
        `)
        .in('estado', ['finalizado', 'Finalizado', 'completado', 'Completado'])
        .not('cobro_cliente', 'is', null)
        .not('nombre_custodio', 'is', null)
        .neq('nombre_custodio', '')
        .neq('nombre_custodio', '#N/A')
        .gt('cobro_cliente', 0);

      if (error) throw error;

      if (!services || services.length === 0) {
        console.warn('No hay servicios válidos para calcular LTV');
        return;
      }

      // Filtrar y limpiar datos
      const validServices = services.filter(service => {
        const cobro = parseFloat(String(service.cobro_cliente || 0));
        return cobro > 0 && cobro < 1000000; // Filtrar valores extremos
      });

      console.log(`📊 Calculando LTV con ${validServices.length} servicios válidos`);

      // 1. Calcular ingreso promedio por servicio
      const totalRevenue = validServices.reduce((sum, service) => {
        return sum + parseFloat(String(service.cobro_cliente || 0));
      }, 0);

      const averageRevenuePerService = totalRevenue / validServices.length;

      // 2. Agrupar por custodio para calcular servicios promedio
      const custodianStats = validServices.reduce((acc, service) => {
        const custodian = service.nombre_custodio;
        if (!acc[custodian]) {
          acc[custodian] = {
            services: 0,
            revenue: 0,
            firstService: service.fecha_hora_cita,
            lastService: service.fecha_hora_cita,
            zone: 'General'
          };
        }
        acc[custodian].services++;
        acc[custodian].revenue += parseFloat(String(service.cobro_cliente || 0));
        
        // Actualizar fechas para calcular retención
        if (service.fecha_hora_cita < acc[custodian].firstService) {
          acc[custodian].firstService = service.fecha_hora_cita;
        }
        if (service.fecha_hora_cita > acc[custodian].lastService) {
          acc[custodian].lastService = service.fecha_hora_cita;
        }
        
        return acc;
      }, {} as Record<string, any>);

      const custodianList = Object.values(custodianStats);
      const activeCustodians = custodianList.length;

      // 3. Calcular servicios promedio por custodio
      const averageServicesPerCustodian = custodianList.reduce((sum, custodian) => {
        return sum + custodian.services;
      }, 0) / activeCustodians;

      // 4. Calcular retención promedio en meses (mantener para referencia)
      const averageRetentionMonths = custodianList.reduce((sum, custodian) => {
        const startDate = new Date(custodian.firstService);
        const endDate = new Date(custodian.lastService);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffMonths = Math.max(1, diffTime / (1000 * 60 * 60 * 24 * 30));
        return sum + diffMonths;
      }, 0) / activeCustodians;

      // 5. Calcular LTV usando permanencia MEDIANA (corregido)
      // Primero calcular el período de meses analizados
      const fechasServicios = validServices.map(s => new Date(s.fecha_hora_cita));
      const fechaMin = new Date(Math.min(...fechasServicios.map(f => f.getTime())));
      const fechaMax = new Date(Math.max(...fechasServicios.map(f => f.getTime())));
      const mesesAnalizados = Math.max(1, (fechaMax.getTime() - fechaMin.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      
      // LTV = Ingreso Promedio Mensual × Permanencia Mediana
      const ingresoPromedioMensual = totalRevenue / activeCustodians / mesesAnalizados;
      const overallLTV = ingresoPromedioMensual * permanenciaMediana;
      
      console.log('📊 LTV Calculation Details:', {
        totalRevenue: totalRevenue.toFixed(2),
        activeCustodians,
        mesesAnalizados: mesesAnalizados.toFixed(2),
        permanenciaMediana: permanenciaMediana.toFixed(2),
        ingresoPromedioMensual: ingresoPromedioMensual.toFixed(2),
        overallLTV: overallLTV.toFixed(2),
        formula: `(${totalRevenue.toFixed(0)} / ${activeCustodians} / ${mesesAnalizados.toFixed(2)}) * ${permanenciaMediana.toFixed(2)}`
      });

      // 6. LTV por zona (simplificado sin zona específica)
      const ltvByZone = { 'General': overallLTV };
      const ltvByZoneCalculated = ltvByZone;

      // 7. Calcular tendencia mensual (últimos 12 meses)
      const now = new Date();
      const ltvTrend = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        
        const monthServices = validServices.filter(service => {
          // Usar getUTC* para evitar bugs de timezone con datos de DB
          return getUTCMonth(service.fecha_hora_cita) === monthDate.getMonth() && 
                 getUTCYear(service.fecha_hora_cita) === monthDate.getFullYear();
        });

        const monthRevenue = monthServices.reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
        const monthCustodians = new Set(monthServices.map(s => s.nombre_custodio)).size;
        const monthIngresoPromedio = monthCustodians > 0 ? monthRevenue / monthCustodians : 0;
        const monthLTV = monthIngresoPromedio * permanenciaMediana;

        ltvTrend.push({
          month: monthName,
          ltv: monthLTV
        });
      }

      // 8. Calcular confianza basada en cantidad de datos
      const confidence = Math.min(1, Math.max(0.3, activeCustodians / 100)); // 100+ custodios = 100% confianza

      const metrics: LTVMetrics = {
        overallLTV,
        averageRevenuePerService,
        averageServicesPerCustodian,
        averageRetentionMonths,
        ltvByZone: ltvByZoneCalculated,
        ltvTrend,
        activeCustodians,
        totalRevenue,
        confidence
      };

      setLtvMetrics(metrics);

      console.log('✅ LTV Metrics calculadas:', {
        overallLTV: overallLTV.toFixed(2),
        averageRevenuePerService: averageRevenuePerService.toFixed(2),
        averageServicesPerCustodian: averageServicesPerCustodian.toFixed(2),
        averageRetentionMonths: averageRetentionMonths.toFixed(2),
        activeCustodians,
        confidence: (confidence * 100).toFixed(1) + '%'
      });

    } catch (error) {
      console.error('Error calculando LTV:', error);
      toast({
        title: "Error",
        description: "No se pudieron calcular las métricas de LTV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateLTVMetrics();
  }, []);

  // Funciones de utilidad para cálculos específicos
  const calculateROI = useMemo(() => (cpa: number) => {
    if (cpa <= 0 || ltvMetrics.overallLTV <= 0) return 0;
    return ((ltvMetrics.overallLTV - cpa) / cpa) * 100;
  }, [ltvMetrics.overallLTV]);

  const getZoneLTV = useMemo(() => (zone: string) => {
    return ltvMetrics.ltvByZone[zone] || 0;
  }, [ltvMetrics.ltvByZone]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return {
    ltvMetrics,
    loading,
    calculateLTVMetrics,
    calculateROI,
    getZoneLTV,
    formatCurrency
  };
};
