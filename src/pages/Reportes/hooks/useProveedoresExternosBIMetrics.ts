import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, subQuarters, subYears, format, parseISO, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

export type TimeRange = 'month' | 'quarter' | 'year' | 'custom';
export type ComparisonPeriod = 'previous' | 'same_last_year' | 'none';

interface TimeFilter {
  range: TimeRange;
  year: number;
  month?: number;
  quarter?: number;
  customStart?: Date;
  customEnd?: Date;
  comparison: ComparisonPeriod;
}

interface ProviderMetrics {
  proveedor: string;
  servicios: number;
  horasTotales: number;
  horasContratadas: number;
  aprovechamiento: number;
  costoEstimado: number;
  revenueLoss: number;
  clientesUnicos: number;
  horasPromedio: number;
}

interface PeriodMetrics {
  periodo: string;
  fechaInicio: Date;
  fechaFin: Date;
  serviciosTotales: number;
  horasTotales: number;
  horasContratadas: number;
  aprovechamiento: number;
  costoTotal: number;
  revenueLoss: number;
  porProveedor: ProviderMetrics[];
  porCliente: { cliente: string; servicios: number; horas: number; porcentaje: number }[];
  porDiaSemana: { dia: string; servicios: number }[];
}

interface BIMetrics {
  periodoActual: PeriodMetrics;
  periodoComparacion: PeriodMetrics | null;
  delta: {
    servicios: number;
    aprovechamiento: number;
    costoTotal: number;
    revenueLoss: number;
  } | null;
  evolucionMensual: {
    mes: string;
    servicios: number;
    horasTotales: number;
    aprovechamiento: number;
    revenueLoss: number;
    cusaem: number;
    seicsa: number;
  }[];
  insights: string[];
}

const HORAS_CONTRATADAS = 12;
const COSTO_POR_HORA = 150;

function parseIntervalToHours(interval: string | null | undefined): number {
  if (!interval) return 0;
  const match = interval.match(/(\d+):(\d+):(\d+)/);
  if (!match) return 0;
  return parseInt(match[1]) + parseInt(match[2]) / 60 + parseInt(match[3]) / 3600;
}

function getDuracion(s: any): number {
  if (s.duracion_servicio) return parseIntervalToHours(s.duracion_servicio);
  if (s.duracion_estimada) return s.duracion_estimada;
  if (s.duracion_real) return s.duracion_real;
  if (s.tiempo_estimado) return parseIntervalToHours(s.tiempo_estimado);
  return 2; // Default fallback
}

function getDateRange(filter: TimeFilter): { start: Date; end: Date } {
  const now = new Date();
  
  switch (filter.range) {
    case 'month':
      const monthDate = new Date(filter.year, (filter.month || 1) - 1, 1);
      return { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
    case 'quarter':
      const quarterStart = new Date(filter.year, ((filter.quarter || 1) - 1) * 3, 1);
      return { start: startOfQuarter(quarterStart), end: endOfQuarter(quarterStart) };
    case 'year':
      const yearDate = new Date(filter.year, 0, 1);
      return { start: startOfYear(yearDate), end: endOfYear(yearDate) };
    case 'custom':
      return { 
        start: filter.customStart || startOfMonth(now), 
        end: filter.customEnd || endOfMonth(now) 
      };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

function getComparisonRange(filter: TimeFilter, currentRange: { start: Date; end: Date }): { start: Date; end: Date } | null {
  if (filter.comparison === 'none') return null;
  
  const duration = currentRange.end.getTime() - currentRange.start.getTime();
  
  if (filter.comparison === 'previous') {
    const newEnd = new Date(currentRange.start.getTime() - 1);
    const newStart = new Date(newEnd.getTime() - duration);
    return { start: newStart, end: newEnd };
  }
  
  if (filter.comparison === 'same_last_year') {
    return {
      start: subYears(currentRange.start, 1),
      end: subYears(currentRange.end, 1)
    };
  }
  
  return null;
}

export function useProveedoresExternosBIMetrics() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [filter, setFilter] = useState<TimeFilter>({
    range: 'month',
    year: currentYear,
    month: currentMonth,
    comparison: 'previous'
  });

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['proveedores-externos-bi', filter.year],
    queryFn: async () => {
      // Get full year of data for evolution chart
      const yearStart = startOfYear(new Date(filter.year, 0, 1));
      const yearEnd = endOfYear(new Date(filter.year, 11, 31));
      
      // Solo servicios_custodia tiene los proveedores externos (Cusaem, SEICSA)
      const custodiaResult = await supabase
        .from('servicios_custodia')
        .select('*')
        .in('proveedor', ['Cusaem', 'SEICSA'])
        .gte('fecha_hora_cita', yearStart.toISOString())
        .lte('fecha_hora_cita', yearEnd.toISOString());

      return {
        custodia: custodiaResult.data || []
      };
    },
    staleTime: 5 * 60 * 1000
  });

  const metrics = useMemo<BIMetrics | null>(() => {
    if (!rawData) return null;

    const allServices = rawData.custodia.map(s => ({
      ...s,
      proveedor: s.proveedor || 'Cusaem',
      fecha: s.fecha_hora_cita,
      cliente: s.nombre_cliente || 'Sin cliente',
      duracion: getDuracion(s)
    }));

    // Remove duplicates (same date, same proveedor, same cliente)
    const seen = new Set<string>();
    const uniqueServices = allServices.filter(s => {
      const key = `${s.fecha}-${s.proveedor}-${s.cliente}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const currentRange = getDateRange(filter);
    const comparisonRange = getComparisonRange(filter, currentRange);

    const calculatePeriodMetrics = (services: typeof uniqueServices, start: Date, end: Date, label: string): PeriodMetrics => {
      const filtered = services.filter(s => {
        const fecha = parseISO(s.fecha);
        return fecha >= start && fecha <= end;
      });

      const porProveedor: ProviderMetrics[] = ['Cusaem', 'SEICSA'].map(prov => {
        const provServices = filtered.filter(s => s.proveedor === prov);
        const horasTotales = provServices.reduce((sum, s) => sum + s.duracion, 0);
        const horasContratadas = provServices.length * HORAS_CONTRATADAS;
        const clientesUnicos = new Set(provServices.map(s => s.cliente)).size;
        
        return {
          proveedor: prov,
          servicios: provServices.length,
          horasTotales,
          horasContratadas,
          aprovechamiento: horasContratadas > 0 ? (horasTotales / horasContratadas) * 100 : 0,
          costoEstimado: horasContratadas * COSTO_POR_HORA,
          revenueLoss: (horasContratadas - horasTotales) * COSTO_POR_HORA,
          clientesUnicos,
          horasPromedio: provServices.length > 0 ? horasTotales / provServices.length : 0
        };
      });

      // Por cliente
      const clienteMap = new Map<string, { servicios: number; horas: number }>();
      filtered.forEach(s => {
        const current = clienteMap.get(s.cliente) || { servicios: 0, horas: 0 };
        clienteMap.set(s.cliente, {
          servicios: current.servicios + 1,
          horas: current.horas + s.duracion
        });
      });
      
      const porCliente = Array.from(clienteMap.entries())
        .map(([cliente, data]) => ({
          cliente,
          ...data,
          porcentaje: (data.servicios / filtered.length) * 100
        }))
        .sort((a, b) => b.servicios - a.servicios)
        .slice(0, 10);

      // Por día de semana
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const porDia = diasSemana.map(dia => ({
        dia,
        servicios: filtered.filter(s => format(parseISO(s.fecha), 'EEEE', { locale: es }) === dia.toLowerCase()).length
      }));

      const horasTotales = porProveedor.reduce((sum, p) => sum + p.horasTotales, 0);
      const horasContratadas = porProveedor.reduce((sum, p) => sum + p.horasContratadas, 0);

      return {
        periodo: label,
        fechaInicio: start,
        fechaFin: end,
        serviciosTotales: filtered.length,
        horasTotales,
        horasContratadas,
        aprovechamiento: horasContratadas > 0 ? (horasTotales / horasContratadas) * 100 : 0,
        costoTotal: horasContratadas * COSTO_POR_HORA,
        revenueLoss: (horasContratadas - horasTotales) * COSTO_POR_HORA,
        porProveedor,
        porCliente,
        porDiaSemana: porDia
      };
    };

    const periodoActual = calculatePeriodMetrics(
      uniqueServices, 
      currentRange.start, 
      currentRange.end,
      format(currentRange.start, 'MMMM yyyy', { locale: es })
    );

    let periodoComparacion: PeriodMetrics | null = null;
    let delta = null;

    if (comparisonRange) {
      periodoComparacion = calculatePeriodMetrics(
        uniqueServices,
        comparisonRange.start,
        comparisonRange.end,
        format(comparisonRange.start, 'MMMM yyyy', { locale: es })
      );

      delta = {
        servicios: periodoActual.serviciosTotales - periodoComparacion.serviciosTotales,
        aprovechamiento: periodoActual.aprovechamiento - periodoComparacion.aprovechamiento,
        costoTotal: periodoActual.costoTotal - periodoComparacion.costoTotal,
        revenueLoss: periodoActual.revenueLoss - periodoComparacion.revenueLoss
      };
    }

    // Evolución mensual (últimos 12 meses)
    const evolucionMensual = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(new Date(filter.year, 11, 1), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthServices = uniqueServices.filter(s => {
        const fecha = parseISO(s.fecha);
        return fecha >= monthStart && fecha <= monthEnd;
      });

      const cusaemServices = monthServices.filter(s => s.proveedor === 'Cusaem');
      const seicsaServices = monthServices.filter(s => s.proveedor === 'SEICSA');
      const horasTotales = monthServices.reduce((sum, s) => sum + s.duracion, 0);
      const horasContratadas = monthServices.length * HORAS_CONTRATADAS;

      evolucionMensual.push({
        mes: format(monthDate, 'MMM', { locale: es }),
        mesCompleto: format(monthDate, 'MMMM yyyy', { locale: es }),
        servicios: monthServices.length,
        horasTotales,
        aprovechamiento: horasContratadas > 0 ? (horasTotales / horasContratadas) * 100 : 0,
        revenueLoss: (horasContratadas - horasTotales) * COSTO_POR_HORA,
        cusaem: cusaemServices.length,
        seicsa: seicsaServices.length
      });
    }

    // Generar insights automáticos
    const insights: string[] = [];
    
    if (periodoActual.aprovechamiento < 20) {
      insights.push(`⚠️ Aprovechamiento crítico: Solo ${periodoActual.aprovechamiento.toFixed(1)}% de las horas contratadas se utilizan efectivamente`);
    }
    
    if (delta && delta.aprovechamiento > 0) {
      insights.push(`📈 Mejora vs período anterior: +${delta.aprovechamiento.toFixed(1)} puntos de aprovechamiento`);
    } else if (delta && delta.aprovechamiento < -2) {
      insights.push(`📉 Retroceso vs período anterior: ${delta.aprovechamiento.toFixed(1)} puntos de aprovechamiento`);
    }

    const clientePrincipal = periodoActual.porCliente[0];
    if (clientePrincipal && clientePrincipal.porcentaje > 50) {
      insights.push(`🎯 Concentración alta: ${clientePrincipal.cliente} representa el ${clientePrincipal.porcentaje.toFixed(0)}% de servicios`);
    }

    const seicsaMetrics = periodoActual.porProveedor.find(p => p.proveedor === 'SEICSA');
    const cusaemMetrics = periodoActual.porProveedor.find(p => p.proveedor === 'Cusaem');
    
    if (seicsaMetrics && cusaemMetrics && seicsaMetrics.aprovechamiento > cusaemMetrics.aprovechamiento + 5) {
      insights.push(`✅ SEICSA muestra mejor aprovechamiento (${seicsaMetrics.aprovechamiento.toFixed(1)}%) vs Cusaem (${cusaemMetrics.aprovechamiento.toFixed(1)}%)`);
    }

    return {
      periodoActual,
      periodoComparacion,
      delta,
      evolucionMensual,
      insights
    };
  }, [rawData, filter]);

  return {
    metrics,
    isLoading,
    filter,
    setFilter,
    availableYears: [2024, 2025],
    availableMonths: Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: format(new Date(2025, i, 1), 'MMMM', { locale: es })
    })),
    availableQuarters: [
      { value: 1, label: 'Q1 (Ene-Mar)' },
      { value: 2, label: 'Q2 (Abr-Jun)' },
      { value: 3, label: 'Q3 (Jul-Sep)' },
      { value: 4, label: 'Q4 (Oct-Dic)' }
    ]
  };
}
