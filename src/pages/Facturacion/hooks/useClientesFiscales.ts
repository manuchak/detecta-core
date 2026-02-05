import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClienteFiscal {
  id: string;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
  regimen_fiscal: string | null;
  codigo_postal_fiscal: string | null;
  direccion_fiscal: string | null;
  uso_cfdi_default: string | null;
  dias_credito: number | null;
  limite_credito: number | null;
  dia_corte: number | null;
  dia_pago: number | null;
  contacto_facturacion_nombre: string | null;
  contacto_facturacion_email: string | null;
  contacto_facturacion_tel: string | null;
  prioridad_cobranza: string | null;
  notas_cobranza: string | null;
  activo: boolean | null;
  created_at: string;
}

export interface ClienteFiscalUpdate {
  nombre?: string; // Nombre comercial - cambio sensible, afecta vinculaciones
  razon_social?: string | null;
  rfc?: string | null;
  regimen_fiscal?: string | null;
  codigo_postal_fiscal?: string | null;
  direccion_fiscal?: string | null;
  uso_cfdi_default?: string | null;
  dias_credito?: number | null;
  limite_credito?: number | null;
  dia_corte?: number | null;
  dia_pago?: number | null;
  contacto_facturacion_nombre?: string | null;
  contacto_facturacion_email?: string | null;
  contacto_facturacion_tel?: string | null;
  prioridad_cobranza?: string | null;
  notas_cobranza?: string | null;
}

export function useClientesFiscales() {
  return useQuery({
    queryKey: ['clientes-fiscales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pc_clientes')
        .select(`
          id,
          nombre,
          razon_social,
          rfc,
          regimen_fiscal,
          codigo_postal_fiscal,
          direccion_fiscal,
          uso_cfdi_default,
          dias_credito,
          limite_credito,
          dia_corte,
          dia_pago,
          contacto_facturacion_nombre,
          contacto_facturacion_email,
          contacto_facturacion_tel,
          prioridad_cobranza,
          notas_cobranza,
          activo,
          created_at
        `)
        .order('nombre');

      if (error) throw error;
      return (data || []) as ClienteFiscal[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateClienteFiscal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClienteFiscalUpdate }) => {
      const { data: result, error } = await supabase
        .from('pc_clientes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-fiscales'] });
      queryClient.invalidateQueries({ queryKey: ['aging-cuentas-cobrar'] });
    },
  });
}

// Regímenes fiscales del SAT
export const REGIMENES_FISCALES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '607', label: '607 - Régimen de Enajenación o Adquisición de Bienes' },
  { value: '608', label: '608 - Demás ingresos' },
  { value: '610', label: '610 - Residentes en el Extranjero sin EP' },
  { value: '611', label: '611 - Ingresos por Dividendos' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '614', label: '614 - Ingresos por intereses' },
  { value: '615', label: '615 - Régimen de los ingresos por obtención de premios' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '620', label: '620 - Sociedades Cooperativas de Producción' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '622', label: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 - Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 - Coordinados' },
  { value: '625', label: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza' },
];

// Usos CFDI del SAT
export const USOS_CFDI = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'I04', label: 'I04 - Equipo de cómputo y accesorios' },
  { value: 'I05', label: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
  { value: 'I06', label: 'I06 - Comunicaciones telefónicas' },
  { value: 'I07', label: 'I07 - Comunicaciones satelitales' },
  { value: 'I08', label: 'I08 - Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
  { value: 'D02', label: 'D02 - Gastos médicos por incapacidad o discapacidad' },
  { value: 'D03', label: 'D03 - Gastos funerales' },
  { value: 'D04', label: 'D04 - Donativos' },
  { value: 'D05', label: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios' },
  { value: 'D06', label: 'D06 - Aportaciones voluntarias al SAR' },
  { value: 'D07', label: 'D07 - Primas por seguros de gastos médicos' },
  { value: 'D08', label: 'D08 - Gastos de transportación escolar obligatoria' },
  { value: 'D09', label: 'D09 - Depósitos en cuentas para el ahorro' },
  { value: 'D10', label: 'D10 - Pagos por servicios educativos' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
  { value: 'CP01', label: 'CP01 - Pagos' },
  { value: 'CN01', label: 'CN01 - Nómina' },
];
