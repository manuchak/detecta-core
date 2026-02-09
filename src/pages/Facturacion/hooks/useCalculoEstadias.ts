import { useMemo } from 'react';
import { Detencion } from './useDetenciones';

export interface CalculoEstadia {
  totalMinutosDetencion: number;
  totalHorasDetencion: number;
  horasCortesiaCliente: number;
  horasExcedentes: number;
  aplica_cobro: boolean;
  desglose: {
    tipo: string;
    minutos: number;
    cobrable: boolean;
  }[];
}

/**
 * Hook que calcula automáticamente las estadías de un servicio
 * comparando las detenciones registradas contra las horas de cortesía del cliente.
 * 
 * Lógica:
 * - Si el total de detenciones cobrables es menor o igual a las horas de cortesía → no se cobra
 * - Si excede las horas de cortesía → se cobra la diferencia
 * - Las detenciones de tipo 'mecanica' y 'accidente' NO cuentan como cobrables al cliente por defecto
 */
export function useCalculoEstadias(
  detenciones: Detencion[],
  horasCortesiaCliente: number = 0
): CalculoEstadia {
  return useMemo(() => {
    const desglose = detenciones.map((d) => ({
      tipo: d.tipo_detencion,
      minutos: d.duracion_minutos || 0,
      cobrable: d.cobrable_cliente,
    }));

    const totalMinutosDetencion = desglose.reduce((acc, d) => acc + d.minutos, 0);
    const minutosCobrables = desglose
      .filter((d) => d.cobrable)
      .reduce((acc, d) => acc + d.minutos, 0);

    const totalHorasDetencion = totalMinutosDetencion / 60;
    const horasCobrables = minutosCobrables / 60;
    const horasExcedentes = Math.max(0, horasCobrables - horasCortesiaCliente);
    const aplica_cobro = horasExcedentes > 0;

    return {
      totalMinutosDetencion,
      totalHorasDetencion: Math.round(totalHorasDetencion * 100) / 100,
      horasCortesiaCliente,
      horasExcedentes: Math.round(horasExcedentes * 100) / 100,
      aplica_cobro,
      desglose,
    };
  }, [detenciones, horasCortesiaCliente]);
}
