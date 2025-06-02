
import { useMemo } from 'react';
import { parseCobroCliente, isValidCobro } from '@/utils/cobroUtils';

interface ServiceData {
  id_servicio?: string;
  fecha_hora_cita?: string;
  estado?: string;
  cobro_cliente?: unknown;
}

export const useGmvAnalysis = (allServices: ServiceData[] | null | undefined) => {
  return useMemo(() => {
    if (!allServices) return null;

    console.log('🔍 === ANÁLISIS DETALLADO GMV ENERO-MAYO ===');
    
    // PASO 1: Filtrar por rango Enero-Mayo 2025
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-05-31T23:59:59');
    
    const serviciosEnRango = allServices.filter(service => {
      if (!service.fecha_hora_cita) return false;
      const serviceDate = new Date(service.fecha_hora_cita);
      return serviceDate >= startDate && serviceDate <= endDate;
    });
    
    console.log(`📅 Servicios en rango Enero-Mayo: ${serviciosEnRango.length}`);
    
    // PASO 2: Análisis de cobro_cliente usando utilidades
    const serviciosCobroValido = serviciosEnRango.filter(service => 
      isValidCobro(service.cobro_cliente)
    );
    
    // Calcular GMV
    let gmv = 0;
    const uniqueIds = new Set<string>();
    
    serviciosCobroValido.forEach(service => {
      if (service.id_servicio && !uniqueIds.has(service.id_servicio)) {
        uniqueIds.add(service.id_servicio);
        const cobro = parseCobroCliente(service.cobro_cliente);
        if (cobro !== null) {
          gmv += cobro;
        }
      }
    });
    
    // Análisis por estados
    const estadosCount: Record<string, number> = {};
    const estadosGmv: Record<string, number> = {};
    
    serviciosEnRango.forEach(service => {
      const estado = (service.estado || 'Sin estado').toString().trim();
      const cobro = parseCobroCliente(service.cobro_cliente);
      
      estadosCount[estado] = (estadosCount[estado] || 0) + 1;
      if (cobro !== null && cobro > 0) {
        estadosGmv[estado] = (estadosGmv[estado] || 0) + cobro;
      }
    });
    
    return {
      totalServicios: serviciosEnRango.length,
      serviciosConCobro: serviciosCobroValido.length,
      serviciosUnicos: uniqueIds.size,
      gmv,
      estadosCount,
      estadosGmv
    };
  }, [allServices]);
};
