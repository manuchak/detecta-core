import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreatePagoInput {
  cliente_id: string;
  monto: number;
  forma_pago: string;
  referencia_bancaria?: string;
  banco?: string;
  fecha_pago: string;
  fecha_deposito?: string;
  notas?: string;
  // For applying to specific facturas
  aplicaciones?: {
    factura_id: string;
    monto_aplicado: number;
  }[];
}

export interface UpdateFacturaEstadoInput {
  factura_id: string;
  total_pagado: number;
  total_factura: number;
}

export const FORMAS_PAGO = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
  { value: 'deposito', label: 'Depósito Bancario' },
];

export const BANCOS = [
  { value: 'bbva', label: 'BBVA' },
  { value: 'santander', label: 'Santander' },
  { value: 'banorte', label: 'Banorte' },
  { value: 'hsbc', label: 'HSBC' },
  { value: 'scotiabank', label: 'Scotiabank' },
  { value: 'citibanamex', label: 'Citibanamex' },
  { value: 'inbursa', label: 'Inbursa' },
  { value: 'bajio', label: 'Banco del Bajío' },
  { value: 'azteca', label: 'Banco Azteca' },
  { value: 'otro', label: 'Otro' },
];

// Helper to update factura status based on payment
async function updateFacturaEstado(facturaId: string): Promise<void> {
  console.log('[updateFacturaEstado] Updating status for factura:', facturaId);

  // Get factura
  const { data: factura, error: facturaError } = await supabase
    .from('facturas')
    .select('id, total, fecha_vencimiento')
    .eq('id', facturaId)
    .maybeSingle();

  if (facturaError || !factura) {
    console.error('[updateFacturaEstado] Error getting factura:', facturaError);
    return;
  }

  // Get total payments
  const { data: pagos, error: pagosError } = await supabase
    .from('pagos')
    .select('monto')
    .eq('factura_id', facturaId)
    .eq('estado', 'aplicado');

  if (pagosError) {
    console.error('[updateFacturaEstado] Error getting pagos:', pagosError);
    return;
  }

  const totalPagado = (pagos || []).reduce((sum, p) => sum + Number(p.monto), 0);
  const totalFactura = Number(factura.total);
  const fechaVencimiento = new Date(factura.fecha_vencimiento);
  const today = new Date();

  let nuevoEstado = 'pendiente';

  if (totalPagado >= totalFactura) {
    nuevoEstado = 'pagada';
  } else if (totalPagado > 0) {
    nuevoEstado = 'parcial';
  } else if (fechaVencimiento < today) {
    nuevoEstado = 'vencida';
  }

  console.log('[updateFacturaEstado] New status:', nuevoEstado, 'Total paid:', totalPagado, '/', totalFactura);

  const { error: updateError } = await supabase
    .from('facturas')
    .update({ 
      estado: nuevoEstado,
      fecha_pago: nuevoEstado === 'pagada' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', facturaId);

  if (updateError) {
    console.error('[updateFacturaEstado] Error updating factura:', updateError);
  }
}

export function useCreatePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePagoInput) => {
      console.log('[useCreatePago] Creating pago:', input);

      const { aplicaciones, ...pagoData } = input;

      // If there are specific applications
      if (aplicaciones && aplicaciones.length > 0) {
        // Create individual payments for each factura
        const results = await Promise.all(
          aplicaciones.map(async (app) => {
            const { data, error } = await supabase
              .from('pagos')
              .insert({
                factura_id: app.factura_id,
                cliente_id: input.cliente_id,
                monto: app.monto_aplicado,
                moneda: 'MXN',
                forma_pago: input.forma_pago,
                referencia_bancaria: input.referencia_bancaria || null,
                banco: input.banco || null,
                fecha_pago: input.fecha_pago,
                fecha_deposito: input.fecha_deposito || null,
                estado: 'aplicado',
                notas: input.notas || null,
              })
              .select()
              .single();

            if (error) {
              console.error('[useCreatePago] Error creating pago for factura:', app.factura_id, error);
              throw error;
            }

            // Update factura status
            await updateFacturaEstado(app.factura_id);

            return data;
          })
        );

        return results;
      } else {
        // Create a single payment without factura association
        const { data, error } = await supabase
          .from('pagos')
          .insert({
            factura_id: null,
            cliente_id: input.cliente_id,
            monto: input.monto,
            moneda: 'MXN',
            forma_pago: input.forma_pago,
            referencia_bancaria: input.referencia_bancaria || null,
            banco: input.banco || null,
            fecha_pago: input.fecha_pago,
            fecha_deposito: input.fecha_deposito || null,
            estado: 'aplicado',
            notas: input.notas || null,
          })
          .select()
          .single();

        if (error) {
          console.error('[useCreatePago] Error creating pago:', error);
          throw error;
        }

        return [data];
      }
    },
    onSuccess: (_, variables) => {
      toast.success('Pago registrado correctamente');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['facturas-cliente', variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['facturas-pendientes', variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ['aging-cuentas-cobrar'] });
      queryClient.invalidateQueries({ queryKey: ['estado-cuenta', variables.cliente_id] });
    },
    onError: (error) => {
      console.error('[useCreatePago] Mutation error:', error);
      toast.error('Error al registrar el pago');
    },
  });
}

export function useDeletePago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pagoId, facturaId, clienteId }: { pagoId: string; facturaId?: string; clienteId: string }) => {
      console.log('[useDeletePago] Deleting pago:', pagoId);

      const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', pagoId);

      if (error) {
        console.error('[useDeletePago] Error:', error);
        throw error;
      }

      // Update factura status if linked
      if (facturaId) {
        await updateFacturaEstado(facturaId);
      }

      return { pagoId, facturaId, clienteId };
    },
    onSuccess: (data) => {
      toast.success('Pago eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['facturas-cliente', data.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['facturas-pendientes', data.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['aging-cuentas-cobrar'] });
    },
    onError: (error) => {
      console.error('[useDeletePago] Mutation error:', error);
      toast.error('Error al eliminar el pago');
    },
  });
}
