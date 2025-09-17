// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  ComodatoGPS, 
  ComodatoGPSExtendido, 
  ComodatoGPSForm, 
  DevolucionForm,
  MovimientoComodato,
  FiltrosComodatos,
  KPIsComodatos,
  CustodioOperativoActivo,
  ProductoGPS,
  EstadoComodato
} from '@/types/comodatos';

export const useComodatosGPS = (filtros?: FiltrosComodatos) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener comodatos con filtros
  const {
    data: comodatos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comodatos-gps', filtros],
    queryFn: async () => {
      let query = supabase
        .from('comodatos_gps')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros?.estado && filtros.estado.length > 0) {
        query = query.in('estado', filtros.estado);
      }

      if (filtros?.custodio_nombre) {
        query = query.or(
          `custodio_operativo_nombre.ilike.%${filtros.custodio_nombre}%`
        );
      }

      if (filtros?.fecha_desde) {
        query = query.gte('fecha_asignacion', filtros.fecha_desde);
      }

      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_asignacion', filtros.fecha_hasta);
      }

      if (filtros?.vencidos_proximos) {
        const hoy = new Date().toISOString().split('T')[0];
        const enTresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        query = query.or(
          `fecha_devolucion_programada.lt.${hoy},fecha_devolucion_programada.lte.${enTresDias}`
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Procesar datos para agregar campos calculados
      const comodatosExtendidos: ComodatoGPSExtendido[] = (data || []).map(comodato => {
        const fechaAsignacion = new Date(comodato.fecha_asignacion);
        const fechaDevolucionProgramada = new Date(comodato.fecha_devolucion_programada);
        const hoy = new Date();
        
        const diasAsignado = Math.floor((hoy.getTime() - fechaAsignacion.getTime()) / (1000 * 60 * 60 * 24));
        const diasRestantes = Math.floor((fechaDevolucionProgramada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...comodato,
          estado: comodato.estado as EstadoComodato,
          dias_asignado: diasAsignado,
          dias_restantes: diasRestantes,
          esta_vencido: diasRestantes < 0 && comodato.estado !== 'devuelto',
          esta_por_vencer: diasRestantes <= 3 && diasRestantes >= 0 && comodato.estado !== 'devuelto'
        };
      });

      return comodatosExtendidos;
    },
    enabled: true
  });

  // Mutation para crear nuevo comodato
  const createComodato = useMutation({
    mutationFn: async (formData: ComodatoGPSForm) => {
      // Verificar disponibilidad del GPS
      const { data: stock, error: stockError } = await supabase
        .from('stock_productos')
        .select('cantidad_disponible')
        .eq('producto_id', formData.producto_gps_id)
        .single();

      if (stockError || !stock || stock.cantidad_disponible <= 0) {
        throw new Error('GPS no disponible en stock');
      }

      // Crear el comodato
      const { data: comodato, error: comodatoError } = await supabase
        .from('comodatos_gps')
        .insert({
          producto_gps_id: formData.producto_gps_id,
          numero_serie_gps: formData.numero_serie_gps,
          pc_custodio_id: formData.custodio_tipo === 'planeacion' ? formData.pc_custodio_id : null,
          custodio_operativo_nombre: formData.custodio_tipo === 'operativo' ? formData.custodio_operativo_nombre : null,
          custodio_operativo_telefono: formData.custodio_tipo === 'operativo' ? formData.custodio_operativo_telefono : null,
          fecha_devolucion_programada: formData.fecha_devolucion_programada,
          observaciones: formData.observaciones,
          condiciones_asignacion: formData.condiciones_asignacion,
          asignado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (comodatoError) throw comodatoError;

      // Reducir stock
      const { error: updateStockError } = await supabase
        .from('stock_productos')
        .update({ cantidad_disponible: stock.cantidad_disponible - 1 })
        .eq('producto_id', formData.producto_gps_id);

      if (updateStockError) throw updateStockError;

      // Crear movimiento
      await supabase
        .from('movimientos_comodato')
        .insert({
          comodato_id: comodato.id,
          tipo_movimiento: 'asignacion',
          observaciones: `GPS asignado: ${formData.numero_serie_gps}`,
          datos_adicionales: {
            custodio_tipo: formData.custodio_tipo,
            condiciones: formData.condiciones_asignacion
          },
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        });

      return comodato;
    },
    onSuccess: () => {
      toast({
        title: "GPS asignado exitosamente",
        description: "El GPS ha sido asignado al custodio y el stock ha sido actualizado."
      });
      queryClient.invalidateQueries({ queryKey: ['comodatos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['productos-gps-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-comodatos'] });
    },
    onError: (error) => {
      toast({
        title: "Error al asignar GPS",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para procesar devolución
  const procesarDevolucion = useMutation({
    mutationFn: async ({ comodatoId, formData }: { comodatoId: string, formData: DevolucionForm }) => {
      // Obtener el comodato actual
      const { data: comodato, error: comodatoError } = await supabase
        .from('comodatos_gps')
        .select('*')
        .eq('id', comodatoId)
        .single();

      if (comodatoError || !comodato) throw new Error('Comodato no encontrado');

      // Actualizar el comodato
      const { error: updateError } = await supabase
        .from('comodatos_gps')
        .update({
          estado: 'devuelto',
          fecha_devolucion_real: formData.fecha_devolucion_real,
          condiciones_devolucion: formData.condiciones_devolucion,
          observaciones: formData.observaciones,
          devuelto_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', comodatoId);

      if (updateError) throw updateError;

      // Incrementar stock
      const { data: stock, error: stockError } = await supabase
        .from('stock_productos')
        .select('cantidad_disponible')
        .eq('producto_id', comodato.producto_gps_id)
        .single();

      if (stockError) throw stockError;

      await supabase
        .from('stock_productos')
        .update({ cantidad_disponible: stock.cantidad_disponible + 1 })
        .eq('producto_id', comodato.producto_gps_id);

      // Crear movimiento
      await supabase
        .from('movimientos_comodato')
        .insert({
          comodato_id: comodatoId,
          tipo_movimiento: 'devolucion',
          observaciones: formData.observaciones,
          datos_adicionales: {
            condiciones_devolucion: formData.condiciones_devolucion
          },
          usuario_id: (await supabase.auth.getUser()).data.user?.id
        });

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Devolución procesada exitosamente",
        description: "El GPS ha sido devuelto y el stock ha sido actualizado."
      });
      queryClient.invalidateQueries({ queryKey: ['comodatos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['productos-gps-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['kpis-comodatos'] });
    },
    onError: (error) => {
      toast({
        title: "Error al procesar devolución",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    comodatos,
    isLoading,
    error,
    refetch,
    createComodato,
    procesarDevolucion
  };
};

// Hook para obtener KPIs del dashboard
export const useKPIsComodatos = () => {
  return useQuery({
    queryKey: ['kpis-comodatos'],
    queryFn: async (): Promise<KPIsComodatos> => {
      // Obtener todos los comodatos activos
      const { data: comodatos, error: comodatosError } = await supabase
        .from('comodatos_gps')
        .select('*');

      if (comodatosError) throw comodatosError;

      // Obtener GPS disponibles en WMS
      const { data: gpsDisponibles, error: gpsError } = await supabase
        .from('stock_productos')
        .select(`
          cantidad_disponible,
          productos_inventario!inner(*)
        `)
        .gt('cantidad_disponible', 0);

      if (gpsError) throw gpsError;

      const hoy = new Date();
      const enTresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      const totalActivos = comodatos?.filter(c => c.estado !== 'devuelto').length || 0;
      const porVencer = comodatos?.filter(c => {
        const fechaDevolucion = new Date(c.fecha_devolucion_programada);
        return fechaDevolucion <= enTresDias && fechaDevolucion >= hoy && c.estado !== 'devuelto';
      }).length || 0;
      
      const vencidos = comodatos?.filter(c => {
        const fechaDevolucion = new Date(c.fecha_devolucion_programada);
        return fechaDevolucion < hoy && c.estado !== 'devuelto';
      }).length || 0;

      const enUso = comodatos?.filter(c => c.estado === 'en_uso').length || 0;
      const disponiblesWms = gpsDisponibles?.reduce((sum, item) => sum + item.cantidad_disponible, 0) || 0;
      
      const custodiosConGps = new Set([
        ...comodatos?.filter(c => c.estado !== 'devuelto' && c.pc_custodio_id).map(c => c.pc_custodio_id) || [],
        ...comodatos?.filter(c => c.estado !== 'devuelto' && c.custodio_operativo_nombre).map(c => c.custodio_operativo_nombre) || []
      ]).size;

      const comodatosDevueltos = comodatos?.filter(c => c.estado === 'devuelto') || [];
      const promedioDiasUso = comodatosDevueltos.length > 0 
        ? comodatosDevueltos.reduce((sum, c) => {
          const fechaAsignacion = new Date(c.fecha_asignacion);
          const fechaDevolucion = new Date(c.fecha_devolucion_real || c.fecha_devolucion_programada);
          return sum + Math.floor((fechaDevolucion.getTime() - fechaAsignacion.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / comodatosDevueltos.length
        : 0;

      const totalComodatos = comodatos?.length || 0;
      const tasaDevolucion = totalComodatos > 0 
        ? (comodatosDevueltos.length / totalComodatos) * 100 
        : 0;

      return {
        total_activos: totalActivos,
        por_vencer: porVencer,
        vencidos: vencidos,
        en_uso: enUso,
        disponibles_wms: disponiblesWms,
        custodios_con_gps: custodiosConGps,
        promedio_dias_uso: Math.round(promedioDiasUso),
        tasa_devolucion: Math.round(tasaDevolucion * 100) / 100
      };
    }
  });
};

// Hook para obtener custodios operativos activos
export const useCustodiosOperativosActivos = () => {
  return useQuery({
    queryKey: ['custodios-operativos-activos'],
    queryFn: async (): Promise<CustodioOperativoActivo[]> => {
      const { data, error } = await supabase.rpc('get_custodios_operativos_activos');
      
      if (error) throw error;
      return data || [];
    }
  });
};

// Hook para obtener productos GPS disponibles
export const useProductosGPSDisponibles = () => {
  return useQuery({
    queryKey: ['productos-gps-disponibles'],
    queryFn: async (): Promise<ProductoGPS[]> => {
      const { data, error } = await supabase
        .from('productos_inventario')
        .select(`
          id,
          nombre,
          marca,
          modelo,
          precio_venta_sugerido,
          stock_productos!inner(cantidad_disponible)
        `)
        .gt('stock_productos.cantidad_disponible', 0);

      if (error) throw error;

      // Mapear los datos
      const productosGps = (data || []).map(item => ({
        id: item.id,
        nombre: item.nombre,
        marca: item.marca,
        modelo: item.modelo,
        cantidad_disponible: item.stock_productos?.[0]?.cantidad_disponible || 0,
        precio_venta_sugerido: item.precio_venta_sugerido
      }));

      return productosGps;
    }
  });
};