// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ZonaOperacion {
  id: string;
  nombre: string;
  estados_incluidos: string[] | null;
  coordenadas_centro: [number, number] | null;
  radio_cobertura_km: number | null;
  prioridad_reclutamiento: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MetricaDemandaZona {
  id: string;
  zona_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  servicios_promedio_dia: number | null;
  custodios_activos: number | null;
  custodios_requeridos: number | null;
  deficit_custodios: number | null;
  score_urgencia: number | null;
  gmv_promedio: number | null;
  ingresos_esperados_custodio: number | null;
  created_at: string | null;
  updated_at: string | null;
  zona?: ZonaOperacion;
}

export interface AlertaSistema {
  id: string;
  tipo_alerta: string;
  categoria: string;
  zona_id: string | null;
  titulo: string;
  descripcion: string;
  datos_contexto: any;
  prioridad: number | null;
  estado: string | null;
  asignado_a: string | null;
  fecha_resolucion: string | null;
  acciones_sugeridas: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  zona?: ZonaOperacion;
}

export interface CandidatoCustodio {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  ubicacion_residencia: [number, number] | null;
  zona_preferida_id: string | null;
  fuente_reclutamiento: string | null;
  estado_proceso: string | null;
  fecha_contacto: string | null;
  calificacion_inicial: number | null;
  experiencia_seguridad: boolean | null;
  vehiculo_propio: boolean | null;
  disponibilidad_horarios: any;
  inversion_inicial_disponible: number | null;
  expectativa_ingresos: number | null;
  notas_recruiter: string | null;
  created_at: string | null;
  updated_at: string | null;
  zona?: ZonaOperacion;
}

export interface MetricaReclutamiento {
  id: string;
  zona_id: string | null;
  canal: string;
  periodo_inicio: string;
  periodo_fin: string;
  inversion_marketing: number | null;
  leads_generados: number | null;
  candidatos_calificados: number | null;
  custodios_contratados: number | null;
  costo_por_lead: number | null;
  costo_por_contratacion: number | null;
  tasa_conversion: number | null;
  created_at: string | null;
  zona?: ZonaOperacion;
}

export const useNationalRecruitment = () => {
  const [loading, setLoading] = useState(false);
  const [zonas, setZonas] = useState<ZonaOperacion[]>([]);
  const [metricas, setMetricas] = useState<MetricaDemandaZona[]>([]);
  const [alertas, setAlertas] = useState<AlertaSistema[]>([]);
  const [candidatos, setCandidatos] = useState<CandidatoCustodio[]>([]);
  const [metricasReclutamiento, setMetricasReclutamiento] = useState<MetricaReclutamiento[]>([]);
  const { toast } = useToast();

  const parseCoordinates = (pointString: string | null): [number, number] | null => {
    if (!pointString) return null;
    try {
      // Formato esperado: POINT(-99.1332 19.4326) o (-99.1332,19.4326)
      const coords = pointString.replace(/[POINT()]/g, '').split(/[,\s]+/);
      if (coords.length >= 2) {
        return [parseFloat(coords[0]), parseFloat(coords[1])];
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error);
    }
    return null;
  };

  const fetchZonas = async () => {
    try {
      const { data, error } = await supabase
        .from('zonas_operacion_nacional')
        .select('*')
        .order('prioridad_reclutamiento', { ascending: false });

      if (error) throw error;
      
      const zonasFormateadas: ZonaOperacion[] = data?.map(zona => ({
        ...zona,
        coordenadas_centro: parseCoordinates(zona.coordenadas_centro as string)
      })) || [];
      
      setZonas(zonasFormateadas);
    } catch (error) {
      console.error('Error fetching zonas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas operativas",
        variant: "destructive"
      });
    }
  };

  const fetchMetricas = async () => {
    try {
      const { data, error } = await supabase
        .from('metricas_demanda_zona')
        .select(`
          *,
          zona:zonas_operacion_nacional(*)
        `)
        .gte('periodo_fin', new Date().toISOString().split('T')[0])
        .order('score_urgencia', { ascending: false });

      if (error) throw error;
      
      const metricasFormateadas: MetricaDemandaZona[] = data?.map(metrica => ({
        ...metrica,
        zona: metrica.zona ? {
          ...metrica.zona,
          coordenadas_centro: parseCoordinates(metrica.zona.coordenadas_centro as string)
        } : undefined
      })) || [];
      
      setMetricas(metricasFormateadas);
    } catch (error) {
      console.error('Error fetching metricas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas de demanda",
        variant: "destructive"
      });
    }
  };

  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from('alertas_sistema_nacional')
        .select(`
          *,
          zona:zonas_operacion_nacional(*)
        `)
        .in('estado', ['activa', 'en_proceso'])
        .order('prioridad', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const alertasFormateadas: AlertaSistema[] = data?.map(alerta => ({
        ...alerta,
        zona: alerta.zona ? {
          ...alerta.zona,
          coordenadas_centro: parseCoordinates(alerta.zona.coordenadas_centro as string)
        } : undefined
      })) || [];
      
      setAlertas(alertasFormateadas);
    } catch (error) {
      console.error('Error fetching alertas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas",
        variant: "destructive"
      });
    }
  };

  const fetchCandidatos = async () => {
    try {
      const { data, error } = await supabase
        .from('candidatos_custodios')
        .select(`
          *,
          zona:zonas_operacion_nacional(*)
        `)
        .not('estado_proceso', 'in', '(rechazado,inactivo)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const candidatosFormateados: CandidatoCustodio[] = data?.map(candidato => ({
        ...candidato,
        ubicacion_residencia: parseCoordinates(candidato.ubicacion_residencia as string),
        zona: candidato.zona ? {
          ...candidato.zona,
          coordenadas_centro: parseCoordinates(candidato.zona.coordenadas_centro as string)
        } : undefined
      })) || [];
      
      setCandidatos(candidatosFormateados);
    } catch (error) {
      console.error('Error fetching candidatos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los candidatos",
        variant: "destructive"
      });
    }
  };

  const fetchMetricasReclutamiento = async () => {
    try {
      const { data, error } = await supabase
        .from('metricas_reclutamiento')
        .select(`
          *,
          zona:zonas_operacion_nacional(*)
        `)
        .gte('periodo_fin', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const metricasFormateadas: MetricaReclutamiento[] = data?.map(metrica => ({
        ...metrica,
        zona: metrica.zona ? {
          ...metrica.zona,
          coordenadas_centro: parseCoordinates(metrica.zona.coordenadas_centro as string)
        } : undefined
      })) || [];
      
      setMetricasReclutamiento(metricasFormateadas);
    } catch (error) {
      console.error('Error fetching metricas reclutamiento:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas de reclutamiento",
        variant: "destructive"
      });
    }
  };

  const generarAlertasAutomaticas = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('generar_alertas_automaticas');
      
      if (error) throw error;
      
      await fetchAlertas();
      
      toast({
        title: "Éxito",
        description: "Alertas generadas automáticamente",
      });
    } catch (error) {
      console.error('Error generando alertas:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar las alertas automáticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resolverAlerta = async (alertaId: string) => {
    try {
      const { error } = await supabase
        .from('alertas_sistema_nacional')
        .update({
          estado: 'resuelta',
          fecha_resolucion: new Date().toISOString(),
          asignado_a: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertaId);

      if (error) throw error;
      
      await fetchAlertas();
      
      toast({
        title: "Éxito",
        description: "Alerta resuelta correctamente",
      });
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
      toast({
        title: "Error",
        description: "No se pudo resolver la alerta",
        variant: "destructive"
      });
    }
  };

  const crearCandidato = async (candidatoData: {
    nombre: string;
    telefono?: string;
    email?: string;
    ubicacion_residencia?: [number, number];
    zona_preferida_id?: string;
    fuente_reclutamiento?: string;
    estado_proceso?: string;
    calificacion_inicial?: number;
    experiencia_seguridad?: boolean;
    vehiculo_propio?: boolean;
    expectativa_ingresos?: number;
    notas_recruiter?: string;
  }) => {
    try {
      setLoading(true);
      
      const dataToInsert = {
        ...candidatoData,
        ubicacion_residencia: candidatoData.ubicacion_residencia 
          ? `POINT(${candidatoData.ubicacion_residencia[0]} ${candidatoData.ubicacion_residencia[1]})`
          : null
      };
      
      const { error } = await supabase
        .from('candidatos_custodios')
        .insert([dataToInsert]);

      if (error) throw error;
      
      await fetchCandidatos();
      
      toast({
        title: "Éxito",
        description: "Candidato creado correctamente",
      });
    } catch (error) {
      console.error('Error creando candidato:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el candidato",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const actualizarMetricasDemanda = async (zonaId: string, metricas: {
    servicios_promedio_dia?: number;
    custodios_activos?: number;
    custodios_requeridos?: number;
    gmv_promedio?: number;
    ingresos_esperados_custodio?: number;
  }) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('metricas_demanda_zona')
        .upsert({
          zona_id: zonaId,
          periodo_inicio: new Date().toISOString().split('T')[0],
          periodo_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ...metricas
        }, {
          onConflict: 'zona_id,periodo_fin'
        });

      if (error) throw error;
      
      await fetchMetricas();
      
      toast({
        title: "Éxito",
        description: "Métricas actualizadas correctamente",
      });
    } catch (error) {
      console.error('Error actualizando métricas:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las métricas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Ejecutar las consultas de forma paralela pero con manejo de errores individual
      const results = await Promise.allSettled([
        fetchZonas(),
        fetchMetricas(),
        fetchAlertas(),
        fetchCandidatos(),
        fetchMetricasReclutamiento()
      ]);
      
      // Log de errores para debugging sin bloquear la UI
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const funcNames = ['fetchZonas', 'fetchMetricas', 'fetchAlertas', 'fetchCandidatos', 'fetchMetricasReclutamiento'];
          console.error(`Error in ${funcNames[index]}:`, result.reason);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Cálculos derivados
  const alertasCriticas = alertas.filter(a => a.tipo_alerta === 'critica').length;
  const alertasPreventivas = alertas.filter(a => a.tipo_alerta === 'preventiva').length;
  const alertasEstrategicas = alertas.filter(a => a.tipo_alerta === 'estrategica').length;
  
  const totalDeficit = metricas.reduce((sum, m) => sum + (m.deficit_custodios || 0), 0);
  const zonasPrioritarias = metricas.filter(m => (m.score_urgencia || 0) >= 8).length;
  
  const candidatosActivos = candidatos.filter(c => 
    ['lead', 'contactado', 'entrevista', 'documentacion', 'capacitacion'].includes(c.estado_proceso || '')
  ).length;

  return {
    // Data
    zonas,
    metricas,
    alertas,
    candidatos,
    metricasReclutamiento,
    
    // Loading state
    loading,
    
    // Actions
    fetchAll,
    generarAlertasAutomaticas,
    resolverAlerta,
    crearCandidato,
    actualizarMetricasDemanda,
    
    // Computed values
    alertasCriticas,
    alertasPreventivas,
    alertasEstrategicas,
    totalDeficit,
    zonasPrioritarias,
    candidatosActivos
  };
};