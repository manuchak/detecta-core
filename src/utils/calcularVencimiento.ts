/**
 * Cálculo inteligente de fecha de vencimiento real
 * basado en el ciclo fiscal del cliente (día de corte + día de pago).
 *
 * Lógica:
 * 1. A partir de fecha_emision, encontrar el SIGUIENTE día de corte del cliente.
 *    - Si la factura se emite el mismo día de corte, entra en ese corte.
 *    - Si se emite después, el corte es el del mes siguiente.
 * 2. Desde el día de corte, encontrar el SIGUIENTE día de pago.
 *    - Si dia_pago > dia_corte → mismo mes.
 *    - Si dia_pago <= dia_corte → mes siguiente.
 * 3. Fallback: si no hay dia_corte/dia_pago → fecha_emision + dias_credito.
 */

import { addMonths, setDate, format, differenceInCalendarDays } from 'date-fns';

export interface ClienteCicloFiscal {
  dias_credito?: number | null;
  dia_corte?: number | null;
  dia_pago?: number | null;
}

export interface VencimientoResult {
  /** Fecha de vencimiento real calculada */
  fechaVencimiento: Date;
  /** Fecha formateada yyyy-MM-dd */
  fechaVencimientoStr: string;
  /** Días reales de crédito (desde emisión hasta vencimiento) */
  diasReales: number;
  /** Días nominales de crédito configurados */
  diasNominales: number;
  /** Si se usó el cálculo basado en corte/pago (true) o fallback simple (false) */
  usoCicloFiscal: boolean;
  /** Fecha del corte usado (si aplica) */
  fechaCorte?: Date;
  /** Explicación legible del cálculo */
  explicacion: string;
}

/**
 * Ajusta el día del mes al más cercano válido (ej: día 31 en febrero → 28/29).
 */
function setDaySafe(base: Date, day: number): Date {
  const year = base.getFullYear();
  const month = base.getMonth();
  // Último día del mes
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month, safeDay);
}

export function calcularFechaVencimientoReal(
  fechaEmision: Date | string,
  cliente: ClienteCicloFiscal
): VencimientoResult {
  const emision = typeof fechaEmision === 'string' ? new Date(fechaEmision) : new Date(fechaEmision);
  const diasNominales = cliente.dias_credito || 30;
  const diaCorte = cliente.dia_corte;
  const diaPago = cliente.dia_pago;

  // Fallback simple: sin ciclo fiscal configurado
  if (!diaCorte || !diaPago) {
    const vencimiento = new Date(emision);
    vencimiento.setDate(vencimiento.getDate() + diasNominales);
    return {
      fechaVencimiento: vencimiento,
      fechaVencimientoStr: format(vencimiento, 'yyyy-MM-dd'),
      diasReales: diasNominales,
      diasNominales,
      usoCicloFiscal: false,
      explicacion: `${diasNominales} días de crédito desde emisión`,
    };
  }

  // Paso 1: Encontrar el siguiente día de corte
  const emisionDay = emision.getDate();
  let fechaCorte: Date;

  if (emisionDay <= diaCorte) {
    // La factura entra en el corte de este mes
    fechaCorte = setDaySafe(emision, diaCorte);
  } else {
    // Ya pasó el corte, va al siguiente mes
    fechaCorte = setDaySafe(addMonths(emision, 1), diaCorte);
  }

  // Paso 2: Desde el corte, encontrar el siguiente día de pago
  let fechaVencimiento: Date;

  if (diaPago > diaCorte) {
    // El pago es en el mismo mes que el corte
    fechaVencimiento = setDaySafe(fechaCorte, diaPago);
  } else {
    // El pago es el mes siguiente al corte
    fechaVencimiento = setDaySafe(addMonths(fechaCorte, 1), diaPago);
  }

  const diasReales = differenceInCalendarDays(fechaVencimiento, emision);

  return {
    fechaVencimiento,
    fechaVencimientoStr: format(fechaVencimiento, 'yyyy-MM-dd'),
    diasReales,
    diasNominales,
    usoCicloFiscal: true,
    fechaCorte,
    explicacion: `Corte día ${diaCorte} → Pago día ${diaPago} (${diasReales} días reales vs ${diasNominales} nominales)`,
  };
}

/**
 * Genera una explicación visual del ciclo de pago del cliente.
 */
export function explicarCicloPago(cliente: ClienteCicloFiscal): string {
  const { dia_corte, dia_pago, dias_credito } = cliente;

  if (!dia_corte || !dia_pago) {
    return `Crédito simple: ${dias_credito || 30} días desde la fecha de emisión.`;
  }

  const ejemplo = new Date();
  const result = calcularFechaVencimientoReal(ejemplo, cliente);

  return (
    `Facturas emitidas hasta el día ${dia_corte} del mes se pagan el día ${dia_pago}` +
    (dia_pago > dia_corte ? ' del mismo mes.' : ' del mes siguiente.') +
    ` Ejemplo: emitida hoy (${format(ejemplo, 'dd/MM')}) → vence ${format(result.fechaVencimiento, 'dd/MM')} (${result.diasReales} días reales).`
  );
}
