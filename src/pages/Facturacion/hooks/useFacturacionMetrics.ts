import { useMemo } from 'react';
import { ServicioFacturacion } from './useServiciosFacturacion';

export interface FacturacionMetrics {
  ingresosBrutos: number;
  costosOperativos: number;
  margenBruto: number;
  porcentajeMargen: number;
  ticketPromedio: number;
  serviciosCompletados: number;
  kmFacturables: number;
  serviciosCancelados: number;
  tasaCancelacion: number;
}

export interface MetricasPorCliente {
  cliente: string;
  ingresos: number;
  servicios: number;
  margen: number;
  porcentajeTotal: number;
}

export function useFacturacionMetrics(servicios: ServicioFacturacion[]) {
  return useMemo(() => {
    if (!servicios || servicios.length === 0) {
      return {
        ingresosBrutos: 0,
        costosOperativos: 0,
        margenBruto: 0,
        porcentajeMargen: 0,
        ticketPromedio: 0,
        serviciosCompletados: 0,
        kmFacturables: 0,
        serviciosCancelados: 0,
        tasaCancelacion: 0,
      } as FacturacionMetrics;
    }

    const serviciosFinalizados = servicios.filter(s => s.estado === 'Finalizado');
    const serviciosCancelados = servicios.filter(s => 
      s.estado === 'Cancelado' || s.estado === 'Cancelado por cliente'
    );

    const ingresosBrutos = serviciosFinalizados.reduce(
      (sum, s) => sum + (s.cobro_cliente || 0), 0
    );
    const costosOperativos = serviciosFinalizados.reduce(
      (sum, s) => sum + (s.costo_custodio || 0), 0
    );
    const margenBruto = ingresosBrutos - costosOperativos;
    const porcentajeMargen = ingresosBrutos > 0 
      ? (margenBruto / ingresosBrutos) * 100 
      : 0;
    const ticketPromedio = serviciosFinalizados.length > 0 
      ? ingresosBrutos / serviciosFinalizados.length 
      : 0;
    const kmFacturables = serviciosFinalizados.reduce(
      (sum, s) => sum + (s.km_recorridos || 0), 0
    );
    const tasaCancelacion = servicios.length > 0 
      ? (serviciosCancelados.length / servicios.length) * 100 
      : 0;

    return {
      ingresosBrutos,
      costosOperativos,
      margenBruto,
      porcentajeMargen,
      ticketPromedio,
      serviciosCompletados: serviciosFinalizados.length,
      kmFacturables,
      serviciosCancelados: serviciosCancelados.length,
      tasaCancelacion,
    } as FacturacionMetrics;
  }, [servicios]);
}

export function useMetricasPorCliente(servicios: ServicioFacturacion[]): MetricasPorCliente[] {
  return useMemo(() => {
    if (!servicios || servicios.length === 0) return [];

    const serviciosFinalizados = servicios.filter(s => s.estado === 'Finalizado');
    const totalIngresos = serviciosFinalizados.reduce(
      (sum, s) => sum + (s.cobro_cliente || 0), 0
    );

    const porCliente = serviciosFinalizados.reduce((acc, s) => {
      const cliente = s.nombre_cliente || 'Sin cliente';
      if (!acc[cliente]) {
        acc[cliente] = { ingresos: 0, servicios: 0, costos: 0 };
      }
      acc[cliente].ingresos += s.cobro_cliente || 0;
      acc[cliente].servicios += 1;
      acc[cliente].costos += s.costo_custodio || 0;
      return acc;
    }, {} as Record<string, { ingresos: number; servicios: number; costos: number }>);

    return Object.entries(porCliente)
      .map(([cliente, data]) => ({
        cliente,
        ingresos: data.ingresos,
        servicios: data.servicios,
        margen: data.ingresos - data.costos,
        porcentajeTotal: totalIngresos > 0 
          ? (data.ingresos / totalIngresos) * 100 
          : 0,
      }))
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 15); // Top 15 clientes
  }, [servicios]);
}
