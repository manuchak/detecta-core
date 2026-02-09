import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServicioFacturacion } from './useServiciosFacturacion';
import { toast } from 'sonner';

export interface DatosFactura {
  numeroFactura: string;
  clienteNombre: string;
  clienteRfc: string;
  clienteEmail?: string;
  clienteId?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  usoCfdi?: string;
  formaPago?: string;
  metodoPago?: string;
  notas?: string;
  tipoFactura?: 'inmediata' | 'corte';
  ordenCompra?: string;
}

export interface FacturaGenerada {
  id: string;
  numero_factura: string;
  total: number;
  partidas: number;
}

const IVA_RATE = 0.16;

/**
 * Genera el siguiente número de factura basado en el formato PF-YYYYMM-XXXX
 */
async function generarNumeroFactura(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `PF-${yearMonth}-`;

  // Buscar la última factura del mes
  const { data: ultimaFactura } = await supabase
    .from('facturas')
    .select('numero_factura')
    .ilike('numero_factura', `${prefix}%`)
    .order('numero_factura', { ascending: false })
    .limit(1)
    .single();

  let consecutivo = 1;
  if (ultimaFactura?.numero_factura) {
    const match = ultimaFactura.numero_factura.match(/(\d+)$/);
    if (match) {
      consecutivo = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(consecutivo).padStart(4, '0')}`;
}

/**
 * Hook para generar una factura con sus partidas
 */
export function useGenerarFactura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      datosFactura,
      servicios,
    }: {
      datosFactura: DatosFactura;
      servicios: ServicioFacturacion[];
    }): Promise<FacturaGenerada> => {
      if (servicios.length === 0) {
        throw new Error('Debe seleccionar al menos un servicio');
      }

      // Calcular totales
      const subtotal = servicios.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
      const iva = subtotal * IVA_RATE;
      const total = subtotal + iva;

      // Generar número si no se proporcionó
      const numeroFactura = datosFactura.numeroFactura || await generarNumeroFactura();

      // 1. Insertar la factura
      const { data: factura, error: errorFactura } = await supabase
        .from('facturas')
        .insert({
          numero_factura: numeroFactura,
          cliente_id: datosFactura.clienteId || null,
          cliente_nombre: datosFactura.clienteNombre,
          cliente_rfc: datosFactura.clienteRfc,
          cliente_email: datosFactura.clienteEmail || null,
          subtotal,
          iva,
          total,
          moneda: 'MXN',
          fecha_emision: datosFactura.fechaEmision,
          fecha_vencimiento: datosFactura.fechaVencimiento,
          estado: 'emitida',
          cfdi_version: '4.0',
          uso_cfdi: datosFactura.usoCfdi || 'G03',
          forma_pago: datosFactura.formaPago || '99',
          metodo_pago: datosFactura.metodoPago || 'PPD',
          tipo_factura: datosFactura.tipoFactura || 'corte',
          orden_compra: datosFactura.ordenCompra || null,
          notas: datosFactura.notas || null,
        })
        .select()
        .single();

      if (errorFactura) {
        console.error('Error creando factura:', errorFactura);
        throw new Error(`Error al crear factura: ${errorFactura.message}`);
      }

      // 2. Insertar las partidas
      const partidas = servicios.map(servicio => ({
        factura_id: factura.id,
        servicio_id: servicio.id,
        id_servicio: servicio.folio_saphiro || servicio.id_servicio,
        id_interno_cliente: servicio.id_interno_cliente || servicio.folio_cliente,
        descripcion: `Servicio de custodia: ${servicio.ruta}`,
        fecha_servicio: servicio.fecha_hora_cita?.split('T')[0] || null,
        ruta: servicio.ruta,
        cantidad: 1,
        precio_unitario: servicio.cobro_cliente || 0,
        importe: servicio.cobro_cliente || 0,
        clave_prod_serv: '78101802', // Servicios de escolta y seguridad
        clave_unidad: 'E48', // Unidad de servicio
      }));

      const { error: errorPartidas } = await supabase
        .from('factura_partidas')
        .insert(partidas);

      if (errorPartidas) {
        // Rollback: eliminar la factura creada
        await supabase.from('facturas').delete().eq('id', factura.id);
        console.error('Error creando partidas:', errorPartidas);
        throw new Error(`Error al crear partidas: ${errorPartidas.message}`);
      }

      return {
        id: factura.id,
        numero_factura: factura.numero_factura,
        total: factura.total,
        partidas: servicios.length,
      };
    },
    onSuccess: (data) => {
      toast.success(`Factura ${data.numero_factura} creada`, {
        description: `${data.partidas} servicios por $${data.total.toLocaleString('es-MX')}`,
      });
      // Invalidar queries relacionados
      queryClient.invalidateQueries({ queryKey: ['servicios-por-facturar'] });
      queryClient.invalidateQueries({ queryKey: ['facturas-emitidas'] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-por-cobrar'] });
    },
    onError: (error) => {
      toast.error('Error al generar factura', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook para obtener facturas emitidas
 */
export function useFacturasEmitidas(filtros: { cliente?: string; estado?: string } = {}) {
  return useQuery({
    queryKey: ['facturas-emitidas', filtros],
    queryFn: async () => {
      let query = supabase
        .from('facturas')
        .select(`
          *,
          partidas:factura_partidas(count)
        `)
        .order('fecha_emision', { ascending: false });

      if (filtros.cliente) {
        query = query.ilike('cliente_nombre', `%${filtros.cliente}%`);
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook para obtener detalle de una factura
 */
export function useFacturaDetalle(facturaId: string | null) {
  return useQuery({
    queryKey: ['factura-detalle', facturaId],
    queryFn: async () => {
      if (!facturaId) return null;

      const { data: factura, error: errorFactura } = await supabase
        .from('facturas')
        .select('*')
        .eq('id', facturaId)
        .single();

      if (errorFactura) throw errorFactura;

      const { data: partidas, error: errorPartidas } = await supabase
        .from('factura_partidas')
        .select('*')
        .eq('factura_id', facturaId)
        .order('fecha_servicio', { ascending: true });

      if (errorPartidas) throw errorPartidas;

      return {
        ...factura,
        partidas: partidas || [],
      };
    },
    enabled: !!facturaId,
    staleTime: 60 * 1000,
  });
}

// Re-export useQuery for useFacturasEmitidas
import { useQuery } from '@tanstack/react-query';
