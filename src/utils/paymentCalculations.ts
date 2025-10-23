// ============================================
// PAYMENT CALCULATIONS ENGINE
// Handles automatic payment calculations for both external providers and internal custodians
// ============================================

export interface PaymentScheme {
  id: string;
  nombre: string;
  tipo_esquema: 'tiempo_fijo' | 'por_kilometraje' | 'mixto';
  configuracion: any;
}

export interface ServiceData {
  km_recorridos?: number;
  duracion_servicio?: string; // PostgreSQL interval type (e.g., "14:30:00")
  tipo_servicio?: string;
}

export interface PaymentCalculationResult {
  monto_calculado: number;
  desglose: any;
  warnings: string[];
  requiere_validacion_manual: boolean;
}

// ===== HELPER: Parse PostgreSQL interval to hours =====
function parseIntervalToHours(interval: string | null | undefined): number {
  if (!interval) return 0;
  
  // Handle formats like "14:30:00", "02:15:00", etc.
  const timeMatch = interval.match(/(\d+):(\d+):(\d+)/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    return hours + (minutes / 60) + (seconds / 3600);
  }
  
  // Handle format like "14 hours" or "14 hours 30 minutes"
  const hoursMatch = interval.match(/(\d+)\s*hours?/i);
  const minutesMatch = interval.match(/(\d+)\s*minutes?/i);
  
  let totalHours = 0;
  if (hoursMatch) totalHours += parseInt(hoursMatch[1], 10);
  if (minutesMatch) totalHours += parseInt(minutesMatch[1], 10) / 60;
  
  return totalHours;
}

// ===== CALCULADORA PARA PROVEEDORES EXTERNOS (TIEMPO FIJO) =====
export function calcularPagoProveedorExterno(
  scheme: PaymentScheme,
  serviceData: ServiceData
): PaymentCalculationResult {
  const config = scheme.configuracion;
  const duracion = parseIntervalToHours(serviceData.duracion_servicio);
  
  let montoBase = config.tarifa_base || 1300;
  let montoHorasExtra = 0;
  let montoViaticos = 0;
  const warnings: string[] = [];
  
  // Calcular horas extra
  const horasIncluidas = config.horas_incluidas || 12;
  if (duracion > horasIncluidas) {
    const horasExtra = duracion - horasIncluidas;
    const tarifaHoraExtra = config.tarifa_hora_extra || 150;
    montoHorasExtra = horasExtra * tarifaHoraExtra;
  }
  
  // Aplicar viáticos si es foráneo y excede tiempo base
  const esForaneo = serviceData.tipo_servicio?.toLowerCase().includes('foraneo') || 
                    serviceData.tipo_servicio?.toLowerCase().includes('foráneo');
  const aplicaViaticos = esForaneo && duracion > horasIncluidas;
  
  if (aplicaViaticos) {
    montoViaticos = config.viaticos_diarios || 300;
  }
  
  // Validaciones
  if (!serviceData.duracion_servicio || duracion === 0) {
    warnings.push('⚠️ Duración del servicio no registrada - usando tarifa base únicamente');
  }
  
  if (esForaneo && (!serviceData.km_recorridos || serviceData.km_recorridos === 0)) {
    warnings.push('⚠️ Servicio foráneo sin km_recorridos registrados');
  }
  
  const total = montoBase + montoHorasExtra + montoViaticos;
  
  return {
    monto_calculado: total,
    desglose: {
      tipo_esquema: 'Proveedor Externo - Tiempo Fijo',
      fuente_datos: 'servicios_custodia.duracion_servicio',
      tarifa_base: montoBase,
      horas_trabajadas: parseFloat(duracion.toFixed(2)),
      horas_incluidas: horasIncluidas,
      horas_extra: parseFloat(Math.max(0, duracion - horasIncluidas).toFixed(2)),
      monto_horas_extra: parseFloat(montoHorasExtra.toFixed(2)),
      viaticos_aplicados: aplicaViaticos,
      monto_viaticos: montoViaticos,
      total_calculado: parseFloat(total.toFixed(2)),
      servicio_foraneo: esForaneo,
      km_recorridos: serviceData.km_recorridos || 0
    },
    warnings,
    requiere_validacion_manual: warnings.length > 0
  };
}

// ===== CALCULADORA PARA CUSTODIOS INTERNOS (POR KM) =====
export function calcularPagoCustodioInterno(
  scheme: PaymentScheme,
  serviceData: ServiceData
): PaymentCalculationResult {
  const config = scheme.configuracion;
  const distancia = serviceData.km_recorridos || 0;
  const warnings: string[] = [];
  
  if (!distancia || distancia === 0) {
    warnings.push('⚠️ km_recorridos no registrado - no se puede calcular pago');
    return {
      monto_calculado: 0,
      desglose: { 
        error: 'km_recorridos requerido',
        fuente_datos: 'servicios_custodia.km_recorridos'
      },
      warnings,
      requiere_validacion_manual: true
    };
  }
  
  const rangos = config.rangos || [];
  let montoTotal = 0;
  const breakdown: any[] = [];
  let kmRestantes = distancia;
  let kmAcumulados = 0;
  
  // Calcular por rangos escalonados
  for (const rango of rangos) {
    if (kmRestantes <= 0) break;
    
    const kmMin = rango.km_min || 0;
    const kmMax = rango.km_max || Infinity;
    const rangoSize = kmMax === Infinity ? Infinity : kmMax - kmMin;
    
    if (distancia > kmMin) {
      const kmEnRango = Math.min(kmRestantes, rangoSize);
      const subtotal = kmEnRango * rango.tarifa_por_km;
      
      montoTotal += subtotal;
      kmRestantes -= kmEnRango;
      kmAcumulados += kmEnRango;
      
      breakdown.push({
        rango: kmMax === Infinity ? `${kmMin}+ km` : `${kmMin}-${kmMax} km`,
        km_aplicados: parseFloat(kmEnRango.toFixed(2)),
        tarifa_por_km: rango.tarifa_por_km,
        subtotal: parseFloat(subtotal.toFixed(2))
      });
    }
  }
  
  return {
    monto_calculado: parseFloat(montoTotal.toFixed(2)),
    desglose: {
      tipo_esquema: 'Custodio Interno - Por Kilometraje',
      fuente_datos: 'servicios_custodia.km_recorridos',
      distancia_km: parseFloat(distancia.toFixed(2)),
      total_calculado: parseFloat(montoTotal.toFixed(2)),
      breakdown,
      tarifa_promedio_km: parseFloat((montoTotal / distancia).toFixed(2))
    },
    warnings,
    requiere_validacion_manual: false
  };
}

// ===== DISPATCHER PRINCIPAL =====
export function calcularPagoSegunEsquema(
  scheme: PaymentScheme,
  serviceData: ServiceData
): PaymentCalculationResult {
  if (!scheme || !scheme.tipo_esquema) {
    return {
      monto_calculado: 0,
      desglose: { error: 'Esquema de pago no definido' },
      warnings: ['⚠️ No se encontró esquema de pago para este servicio'],
      requiere_validacion_manual: true
    };
  }

  switch (scheme.tipo_esquema) {
    case 'tiempo_fijo':
      return calcularPagoProveedorExterno(scheme, serviceData);
    
    case 'por_kilometraje':
      return calcularPagoCustodioInterno(scheme, serviceData);
    
    case 'mixto':
      // Futuro: combinar ambos esquemas
      return {
        monto_calculado: 0,
        desglose: {},
        warnings: ['⚠️ Esquema mixto no implementado aún'],
        requiere_validacion_manual: true
      };
    
    default:
      return {
        monto_calculado: 0,
        desglose: {},
        warnings: ['⚠️ Esquema de pago desconocido'],
        requiere_validacion_manual: true
      };
  }
}

// ===== FORMATTERS =====
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
