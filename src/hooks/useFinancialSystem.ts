import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CategoriaGasto {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'marketing' | 'personal' | 'tecnologia' | 'operaciones' | 'eventos' | 'otros';
  activo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GastoExterno {
  id: string;
  categoria_id: string | null;
  zona_id: string | null;
  concepto: string;
  descripcion: string | null;
  monto: number;
  moneda: string | null;
  fecha_gasto: string;
  fecha_vencimiento: string | null;
  metodo_pago: string | null;
  proveedor: string | null;
  numero_factura: string | null;
  comprobante_url: string | null;
  canal_reclutamiento: string | null;
  custodios_objetivo: number | null;
  custodios_reales: number | null;
  aprobado_por: string | null;
  estado: 'pendiente' | 'aprobado' | 'pagado' | 'rechazado' | null;
  registrado_por: string;
  notas: string | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  categoria?: CategoriaGasto;
  zona?: any;
}

export interface PresupuestoZona {
  id: string;
  zona_id: string | null;
  categoria_id: string | null;
  periodo_inicio: string;
  periodo_fin: string;
  presupuesto_asignado: number;
  presupuesto_utilizado: number | null;
  custodios_objetivo: number | null;
  roi_esperado: number | null;
  aprobado_por: string | null;
  estado: 'activo' | 'pausado' | 'completado' | 'cancelado' | null;
  notas: string | null;
  created_at: string | null;
  updated_at: string | null;
  zona?: any;
  categoria?: CategoriaGasto;
}

export interface ROICustodio {
  id: string;
  custodio_id: string | null;
  zona_id: string | null;
  periodo_inicio: string;
  periodo_fin: string;
  inversion_total: number | null;
  ingresos_generados: number | null;
  servicios_completados: number | null;
  dias_activo: number | null;
  costo_adquisicion: number | null;
  roi_percentage: number | null;
  ltv_estimado: number | null;
  payback_dias: number | null;
  estado_custodio: string | null;
  created_at: string | null;
  updated_at: string | null;
  zona?: any;
}

export interface MetricaCanal {
  id: string;
  canal: string;
  zona_id: string | null;
  periodo_inicio: string;
  periodo_fin: string;
  inversion: number | null;
  leads_generados: number | null;
  candidatos_calificados: number | null;
  custodios_contratados: number | null;
  custodios_activos: number | null;
  costo_por_lead: number | null;
  costo_por_contratacion: number | null;
  tasa_conversion_lead_candidato: number | null;
  tasa_conversion_candidato_custodio: number | null;
  tasa_retencion: number | null;
  roi_canal: number | null;
  calidad_promedio: number | null;
  created_at: string | null;
  updated_at: string | null;
  zona?: any;
}

export interface ROIZonaResult {
  zona_nombre: string;
  inversion_total: number;
  ingresos_generados: number;
  roi_percentage: number;
  custodios_adquiridos: number;
  costo_promedio_adquisicion: number;
  servicios_totales: number;
}

export const useFinancialSystem = () => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [gastos, setGastos] = useState<GastoExterno[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoZona[]>([]);
  const [roiCustodios, setRoiCustodios] = useState<ROICustodio[]>([]);
  const [metricasCanales, setMetricasCanales] = useState<MetricaCanal[]>([]);
  const { toast } = useToast();

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_gastos')
        .select('*')
        .eq('activo', true)
        .order('tipo', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      setCategorias((data || []) as CategoriaGasto[]);
    } catch (error) {
      console.error('Error fetching categorias:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías de gastos",
        variant: "destructive"
      });
    }
  };

  const fetchGastos = async (filtros?: {
    zona_id?: string;
    categoria_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
  }) => {
    try {
      let query = supabase
        .from('gastos_externos')
        .select(`
          *,
          categoria:categorias_gastos(*),
          zona:zonas_operacion_nacional(*)
        `)
        .order('fecha_gasto', { ascending: false });

      if (filtros?.zona_id) {
        query = query.eq('zona_id', filtros.zona_id);
      }
      if (filtros?.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }
      if (filtros?.fecha_desde) {
        query = query.gte('fecha_gasto', filtros.fecha_desde);
      }
      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_gasto', filtros.fecha_hasta);
      }
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGastos((data || []) as GastoExterno[]);
    } catch (error) {
      console.error('Error fetching gastos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos",
        variant: "destructive"
      });
    }
  };

  const fetchPresupuestos = async (filtros?: {
    zona_id?: string;
    categoria_id?: string;
    estado?: string;
  }) => {
    try {
      let query = supabase
        .from('presupuestos_zona')
        .select(`
          *,
          zona:zonas_operacion_nacional(*),
          categoria:categorias_gastos(*)
        `)
        .order('periodo_inicio', { ascending: false });

      if (filtros?.zona_id) {
        query = query.eq('zona_id', filtros.zona_id);
      }
      if (filtros?.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPresupuestos((data || []) as PresupuestoZona[]);
    } catch (error) {
      console.error('Error fetching presupuestos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los presupuestos",
        variant: "destructive"
      });
    }
  };

  const fetchROICustodios = async (filtros?: {
    zona_id?: string;
    periodo_dias?: number;
  }) => {
    try {
      let query = supabase
        .from('roi_custodios')
        .select(`
          *,
          zona:zonas_operacion_nacional(*)
        `)
        .order('periodo_inicio', { ascending: false });

      if (filtros?.zona_id) {
        query = query.eq('zona_id', filtros.zona_id);
      }

      if (filtros?.periodo_dias) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - filtros.periodo_dias);
        query = query.gte('periodo_inicio', fechaLimite.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRoiCustodios(data || []);
    } catch (error) {
      console.error('Error fetching ROI custodios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas de ROI",
        variant: "destructive"
      });
    }
  };

  const fetchMetricasCanales = async (filtros?: {
    zona_id?: string;
    canal?: string;
    periodo_dias?: number;
  }) => {
    try {
      let query = supabase
        .from('metricas_canales')
        .select(`
          *,
          zona:zonas_operacion_nacional(*)
        `)
        .order('periodo_inicio', { ascending: false });

      if (filtros?.zona_id) {
        query = query.eq('zona_id', filtros.zona_id);
      }
      if (filtros?.canal) {
        query = query.eq('canal', filtros.canal);
      }

      if (filtros?.periodo_dias) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - filtros.periodo_dias);
        query = query.gte('periodo_inicio', fechaLimite.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMetricasCanales(data || []);
    } catch (error) {
      console.error('Error fetching metricas canales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas de canales",
        variant: "destructive"
      });
    }
  };

  const crearGasto = async (gastoData: {
    categoria_id?: string;
    zona_id?: string;
    concepto: string;
    descripcion?: string;
    monto: number;
    moneda?: string;
    fecha_gasto: string;
    fecha_vencimiento?: string;
    metodo_pago?: string;
    proveedor?: string;
    numero_factura?: string;
    comprobante_url?: string;
    canal_reclutamiento?: string;
    custodios_objetivo?: number;
    custodios_reales?: number;
    estado?: string;
    notas?: string;
    tags?: string[];
  }) => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('gastos_externos')
        .insert([{
          ...gastoData,
          registrado_por: userData.user?.id
        }]);

      if (error) throw error;
      
      await fetchGastos();
      
      toast({
        title: "Éxito",
        description: "Gasto registrado correctamente",
      });
    } catch (error) {
      console.error('Error creando gasto:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const crearPresupuesto = async (presupuestoData: {
    zona_id: string;
    categoria_id?: string;
    periodo_inicio: string;
    periodo_fin: string;
    presupuesto_asignado: number;
    custodios_objetivo?: number;
    roi_esperado?: number;
    estado?: string;
    notas?: string;
  }) => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('presupuestos_zona')
        .insert([{
          ...presupuestoData,
          aprobado_por: userData.user?.id
        }]);

      if (error) throw error;
      
      await fetchPresupuestos();
      
      toast({
        title: "Éxito",
        description: "Presupuesto creado correctamente",
      });
    } catch (error) {
      console.error('Error creando presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el presupuesto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularROIZona = async (zonaId: string, periodoDias: number = 90): Promise<ROIZonaResult | null> => {
    try {
      const { data, error } = await supabase.rpc('calcular_roi_zona', {
        p_zona_id: zonaId,
        p_periodo_dias: periodoDias
      });

      if (error) throw error;
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error calculando ROI zona:', error);
      toast({
        title: "Error",
        description: "No se pudo calcular el ROI de la zona",
        variant: "destructive"
      });
      return null;
    }
  };

  const actualizarROICustodios = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.rpc('actualizar_roi_custodios');
      
      if (error) throw error;
      
      await fetchROICustodios();
      
      toast({
        title: "Éxito",
        description: "Métricas de ROI actualizadas",
      });
    } catch (error) {
      console.error('Error actualizando ROI:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las métricas de ROI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const aprobarGasto = async (gastoId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('gastos_externos')
        .update({
          estado: 'aprobado',
          aprobado_por: userData.user?.id
        })
        .eq('id', gastoId);

      if (error) throw error;
      
      await fetchGastos();
      
      toast({
        title: "Éxito",
        description: "Gasto aprobado correctamente",
      });
    } catch (error) {
      console.error('Error aprobando gasto:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el gasto",
        variant: "destructive"
      });
    }
  };

  const marcarGastoPagado = async (gastoId: string) => {
    try {
      const { error } = await supabase
        .from('gastos_externos')
        .update({ estado: 'pagado' })
        .eq('id', gastoId);

      if (error) throw error;
      
      await fetchGastos();
      
      toast({
        title: "Éxito",
        description: "Gasto marcado como pagado",
      });
    } catch (error) {
      console.error('Error marcando gasto pagado:', error);
      toast({
        title: "Error",
        description: "No se pudo marcar el gasto como pagado",
        variant: "destructive"
      });
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategorias(),
        fetchGastos(),
        fetchPresupuestos(),
        fetchROICustodios(),
        fetchMetricasCanales()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Cálculos derivados
  const gastosTotales = gastos.reduce((sum, g) => sum + g.monto, 0);
  const gastosPendientes = gastos.filter(g => g.estado === 'pendiente').length;
  const gastosAprobados = gastos.filter(g => g.estado === 'aprobado').length;
  const gastosPagados = gastos.filter(g => g.estado === 'pagado').length;
  
  const presupuestoTotal = presupuestos.reduce((sum, p) => sum + p.presupuesto_asignado, 0);
  const presupuestoUtilizado = presupuestos.reduce((sum, p) => sum + (p.presupuesto_utilizado || 0), 0);
  const utilizacionPresupuesto = presupuestoTotal > 0 ? (presupuestoUtilizado / presupuestoTotal) * 100 : 0;

  const roiPromedio = roiCustodios.length > 0 
    ? roiCustodios.reduce((sum, r) => sum + (r.roi_percentage || 0), 0) / roiCustodios.length 
    : 0;

  return {
    // Data
    categorias,
    gastos,
    presupuestos,
    roiCustodios,
    metricasCanales,
    
    // Loading state
    loading,
    
    // Actions
    fetchAll,
    fetchGastos,
    fetchPresupuestos,
    fetchROICustodios,
    fetchMetricasCanales,
    crearGasto,
    crearPresupuesto,
    calcularROIZona,
    actualizarROICustodios,
    aprobarGasto,
    marcarGastoPagado,
    
    // Computed values
    gastosTotales,
    gastosPendientes,
    gastosAprobados,
    gastosPagados,
    presupuestoTotal,
    presupuestoUtilizado,
    utilizacionPresupuesto,
    roiPromedio
  };
};