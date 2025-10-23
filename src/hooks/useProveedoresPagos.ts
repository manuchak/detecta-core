import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProveedorPagoRecord {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  asignacion_id: string;
  servicio_id: string;
  fecha_servicio: string;
  armado_nombre: string;
  tarifa_acordada: number;
  moneda: string;
  estado_pago: 'pendiente' | 'en_proceso' | 'pagado';
  requiere_factura: boolean;
  notas_pago?: string;
  // Payment details if paid
  pago_id?: string;
  fecha_pago?: string;
  metodo_pago?: string;
  numero_factura?: string;
  monto_pagado?: number;
  estado_conciliacion?: string;
  folio_comprobante?: string;
  referencia_bancaria?: string;
}

export interface CreatePagoData {
  asignacion_id: string;
  proveedor_id: string;
  servicio_custodia_id: string;
  monto_pagado: number;
  moneda?: string;
  fecha_pago: string;
  metodo_pago: 'transferencia' | 'cheque' | 'efectivo' | 'deposito';
  numero_factura?: string;
  folio_comprobante?: string;
  referencia_bancaria?: string;
  observaciones?: string;
}

export interface MassivePaymentData {
  fecha_pago: string;
  metodo_pago: 'transferencia' | 'cheque' | 'efectivo' | 'deposito';
  referencia_bancaria?: string;
  observaciones?: string;
}

export interface ResumenFinanciero {
  total_servicios: number;
  monto_total: number;
  monto_pagado: number;
  monto_pendiente: number;
  monto_en_proceso: number;
  servicios_pagados: number;
  servicios_pendientes: number;
  servicios_en_proceso: number;
}

export function useProveedoresPagos(proveedorId?: string, startDate?: Date, endDate?: Date) {
  const [serviciosConPagos, setServiciosConPagos] = useState<ProveedorPagoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServiciosConPagos = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('asignacion_armados')
        .select(`
          id,
          servicio_custodia_id,
          proveedor_armado_id,
          tarifa_acordada,
          moneda,
          estado_pago,
          requiere_factura,
          notas_pago,
          armado_nombre_verificado,
          hora_encuentro,
          proveedores_armados!inner(
            id,
            nombre_empresa
          ),
          pagos_proveedores_armados(
            id,
            monto_pagado,
            fecha_pago,
            metodo_pago,
            numero_factura,
            folio_comprobante,
            referencia_bancaria,
            estado_conciliacion
          )
        `)
        .eq('tipo_asignacion', 'proveedor')
        .eq('estado_asignacion', 'completado')
        .order('hora_encuentro', { ascending: false });

      if (proveedorId) {
        query = query.eq('proveedor_armado_id', proveedorId);
      }

      if (startDate) {
        query = query.gte('hora_encuentro', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('hora_encuentro', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading servicios con pagos:', error);
        throw error;
      }

      const records: ProveedorPagoRecord[] = (data || []).map((item: any) => {
        const pago = item.pagos_proveedores_armados?.[0];
        return {
          id: item.id,
          proveedor_id: item.proveedor_armado_id,
          proveedor_nombre: item.proveedores_armados?.nombre_empresa || 'N/A',
          asignacion_id: item.id,
          servicio_id: item.servicio_custodia_id,
          fecha_servicio: item.hora_encuentro,
          armado_nombre: item.armado_nombre_verificado || 'N/A',
          tarifa_acordada: Number(item.tarifa_acordada) || 0,
          moneda: item.moneda || 'MXN',
          estado_pago: item.estado_pago || 'pendiente',
          requiere_factura: item.requiere_factura || false,
          notas_pago: item.notas_pago,
          // Payment details
          pago_id: pago?.id,
          fecha_pago: pago?.fecha_pago,
          metodo_pago: pago?.metodo_pago,
          numero_factura: pago?.numero_factura,
          monto_pagado: pago?.monto_pagado ? Number(pago.monto_pagado) : undefined,
          estado_conciliacion: pago?.estado_conciliacion,
          folio_comprobante: pago?.folio_comprobante,
          referencia_bancaria: pago?.referencia_bancaria,
        };
      });

      setServiciosConPagos(records);
    } catch (error: any) {
      console.error('Error in useProveedoresPagos:', error);
      setError(error.message || 'Error al cargar servicios con pagos');
      toast.error('Error al cargar información de pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiciosConPagos();
  }, [proveedorId, startDate, endDate]);

  const registrarPago = async (pagoData: CreatePagoData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      // 1. Create payment record
      const { data: pago, error: pagoError } = await supabase
        .from('pagos_proveedores_armados')
        .insert({
          ...pagoData,
          registrado_por: user.user.id,
        })
        .select()
        .single();

      if (pagoError) {
        console.error('Error creating payment:', pagoError);
        throw pagoError;
      }

      // 2. Update assignment status
      const { error: updateError } = await supabase
        .from('asignacion_armados')
        .update({
          estado_pago: 'pagado',
          fecha_ultima_actualizacion_pago: new Date().toISOString(),
        })
        .eq('id', pagoData.asignacion_id);

      if (updateError) {
        console.error('Error updating assignment:', updateError);
        throw updateError;
      }

      toast.success('Pago registrado exitosamente');
      await loadServiciosConPagos();
      return pago;
    } catch (error: any) {
      console.error('Error in registrarPago:', error);
      toast.error('Error al registrar pago');
      throw error;
    }
  };

  const registrarPagosMasivos = async (asignacionIds: string[], pagoData: MassivePaymentData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      // Get assignment details
      const { data: asignaciones, error: fetchError } = await supabase
        .from('asignacion_armados')
        .select('id, proveedor_armado_id, servicio_custodia_id, tarifa_acordada, moneda')
        .in('id', asignacionIds)
        .eq('estado_pago', 'pendiente');

      if (fetchError) throw fetchError;
      if (!asignaciones || asignaciones.length === 0) {
        throw new Error('No se encontraron asignaciones pendientes');
      }

      // Create payment records
      const pagosToInsert = asignaciones.map((asig: any) => ({
        proveedor_id: asig.proveedor_armado_id,
        asignacion_id: asig.id,
        servicio_custodia_id: asig.servicio_custodia_id,
        monto_pagado: asig.tarifa_acordada,
        moneda: asig.moneda || 'MXN',
        fecha_pago: pagoData.fecha_pago,
        metodo_pago: pagoData.metodo_pago,
        referencia_bancaria: pagoData.referencia_bancaria,
        observaciones: pagoData.observaciones,
        registrado_por: user.user.id,
      }));

      const { error: insertError } = await supabase
        .from('pagos_proveedores_armados')
        .insert(pagosToInsert);

      if (insertError) {
        console.error('Error creating bulk payments:', insertError);
        throw insertError;
      }

      // Update all assignments
      const { error: updateError } = await supabase
        .from('asignacion_armados')
        .update({
          estado_pago: 'pagado',
          fecha_ultima_actualizacion_pago: new Date().toISOString(),
        })
        .in('id', asignacionIds);

      if (updateError) {
        console.error('Error updating assignments:', updateError);
        throw updateError;
      }

      toast.success(`${asignacionIds.length} pagos registrados exitosamente`);
      await loadServiciosConPagos();
    } catch (error: any) {
      console.error('Error in registrarPagosMasivos:', error);
      toast.error('Error al registrar pagos masivos');
      throw error;
    }
  };

  const getResumenFinanciero = (proveedorIdFilter?: string): ResumenFinanciero => {
    const filtered = proveedorIdFilter
      ? serviciosConPagos.filter(s => s.proveedor_id === proveedorIdFilter)
      : serviciosConPagos;

    const total_servicios = filtered.length;
    const monto_total = filtered.reduce((sum, s) => sum + s.tarifa_acordada, 0);
    
    const pagados = filtered.filter(s => s.estado_pago === 'pagado');
    const pendientes = filtered.filter(s => s.estado_pago === 'pendiente');
    const enProceso = filtered.filter(s => s.estado_pago === 'en_proceso');

    return {
      total_servicios,
      monto_total,
      monto_pagado: pagados.reduce((sum, s) => sum + (s.monto_pagado || s.tarifa_acordada), 0),
      monto_pendiente: pendientes.reduce((sum, s) => sum + s.tarifa_acordada, 0),
      monto_en_proceso: enProceso.reduce((sum, s) => sum + s.tarifa_acordada, 0),
      servicios_pagados: pagados.length,
      servicios_pendientes: pendientes.length,
      servicios_en_proceso: enProceso.length,
    };
  };

  return {
    serviciosConPagos,
    loading,
    error,
    registrarPago,
    registrarPagosMasivos,
    getResumenFinanciero,
    refetch: loadServiciosConPagos,
  };
}

export default useProveedoresPagos;
