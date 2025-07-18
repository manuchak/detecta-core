import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ZonaOperacionReal {
  id: string;
  nombre: string;
  estados_incluidos: string[];
  coordenadas_centro: [number, number];
  custodios_activos: number;
  servicios_activos: number;
  deficit_estimado: number;
  score_urgencia: number;
  ingresos_mensuales: number;
  leads_zona: number;
  candidatos_zona: number;
}

export interface MetricaDemandaReal {
  zona_id: string;
  zona_nombre: string;
  custodios_activos: number;
  servicios_promedio_dia: number;
  custodios_requeridos: number;
  deficit_custodios: number;
  score_urgencia: number;
  gmv_promedio: number;
  tasa_conversion_leads: number;
  costo_adquisicion_promedio: number;
}

export interface AlertaSistemaReal {
  id: string;
  tipo_alerta: 'critica' | 'preventiva' | 'estrategica';
  categoria: string;
  zona_id: string | null;
  zona_nombre?: string;
  titulo: string;
  descripcion: string;
  datos_contexto: any;
  prioridad: number;
  estado: 'activa' | 'en_proceso' | 'resuelta';
  acciones_sugeridas: string[];
  created_at: string;
}

export interface CandidatoReal {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  ubicacion_residencia: [number, number] | null;
  estado_proceso: string;
  fuente_reclutamiento: string | null;
  fecha_creacion: string;
  zona_asignada?: string;
  calificacion_inicial: number | null;
  experiencia_seguridad: boolean;
  vehiculo_propio: boolean;
}

export const useRealNationalRecruitment = () => {
  const [loading, setLoading] = useState(false);
  const [zonasReales, setZonasReales] = useState<ZonaOperacionReal[]>([]);
  const [metricasReales, setMetricasReales] = useState<MetricaDemandaReal[]>([]);
  const [alertasReales, setAlertasReales] = useState<AlertaSistemaReal[]>([]);
  const [candidatosReales, setCandidatosReales] = useState<CandidatoReal[]>([]);
  const { toast } = useToast();

  // Definir zonas principales de México con coordenadas reales
  const zonasOperativas = [
    {
      id: 'centro-mexico',
      nombre: 'Centro de México',
      estados_incluidos: ['Ciudad de México', 'Estado de México', 'Hidalgo', 'Morelos'],
      coordenadas_centro: [-99.1332, 19.4326] as [number, number]
    },
    {
      id: 'bajio',
      nombre: 'Bajío',
      estados_incluidos: ['Guanajuato', 'Querétaro', 'Aguascalientes'],
      coordenadas_centro: [-101.257, 21.019] as [number, number]
    },
    {
      id: 'norte',
      nombre: 'Norte',
      estados_incluidos: ['Nuevo León', 'Coahuila', 'Tamaulipas'],
      coordenadas_centro: [-100.3161, 25.6866] as [number, number]
    },
    {
      id: 'occidente',
      nombre: 'Occidente',
      estados_incluidos: ['Jalisco', 'Michoacán', 'Colima', 'Nayarit'],
      coordenadas_centro: [-103.3496, 20.6597] as [number, number]
    },
    {
      id: 'pacifico',
      nombre: 'Pacífico',
      estados_incluidos: ['Sinaloa', 'Sonora', 'Baja California'],
      coordenadas_centro: [-110.9559, 29.0729] as [number, number]
    },
    {
      id: 'golfo',
      nombre: 'Golfo',
      estados_incluidos: ['Veracruz', 'Tabasco', 'Campeche'],
      coordenadas_centro: [-96.1342, 19.1738] as [number, number]
    },
    {
      id: 'centro-occidente',
      nombre: 'Centro-Occidente',
      estados_incluidos: ['San Luis Potosí', 'Zacatecas', 'Durango'],
      coordenadas_centro: [-102.5528, 22.1565] as [number, number]
    },
    {
      id: 'sureste',
      nombre: 'Sureste',
      estados_incluidos: ['Yucatán', 'Quintana Roo', 'Chiapas', 'Oaxaca'],
      coordenadas_centro: [-89.6567, 20.9674] as [number, number]
    }
  ];

  const fetchRealMetricas = async () => {
    try {
      console.log('Fetching real metrics...');
      
      // Obtener custodios activos por región analizando servicios recientes
      const { data: custodiosActivos } = await supabase.rpc('get_custodian_performance_unified');
      
      // Obtener servicios por región basado en origen/destino
      const { data: serviciosRecientes, error: serviciosError } = await supabase
        .from('servicios_custodia')
        .select('origen, destino, nombre_custodio, estado, fecha_hora_cita, km_recorridos, cobro_cliente')
        .gte('fecha_hora_cita', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('nombre_custodio', 'is', null)
        .neq('nombre_custodio', '#N/A');

      if (serviciosError) throw serviciosError;

      console.log('Servicios recientes:', serviciosRecientes?.length);

      // Analizar por zona geográfica basado en patrones de origen/destino
      const metricasPorZona: MetricaDemandaReal[] = zonasOperativas.map(zona => {
        const serviciosZona = serviciosRecientes?.filter(servicio => {
          const origenLower = servicio.origen?.toLowerCase() || '';
          const destinoLower = servicio.destino?.toLowerCase() || '';
          
          return zona.estados_incluidos.some(estado => {
            const estadoLower = estado.toLowerCase();
            return origenLower.includes(estadoLower) || 
                   destinoLower.includes(estadoLower) ||
                   (estadoLower === 'ciudad de méxico' && (origenLower.includes('cdmx') || destinoLower.includes('cdmx'))) ||
                   (estadoLower === 'estado de méxico' && (origenLower.includes('mex mexico') || destinoLower.includes('mex mexico')));
          });
        }) || [];

        const custodiosUnicosZona = new Set(
          serviciosZona.map(s => s.nombre_custodio).filter(n => n && n !== 'Sin Asignar')
        ).size;

        const serviciosCompletados = serviciosZona.filter(s => s.estado === 'Finalizado').length;
        const serviciosPromedioDia = serviciosZona.length / 30;
        const custodiosRequeridos = Math.ceil(serviciosPromedioDia / 0.8); // Asumiendo 0.8 servicios por custodio por día
        const deficit = Math.max(0, custodiosRequeridos - custodiosUnicosZona);
        
        const ingresosTotales = serviciosZona.reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
        const gmvPromedio = ingresosTotales / Math.max(serviciosZona.length, 1);

        // Score de urgencia basado en déficit y demanda
        let scoreUrgencia = 0;
        if (deficit > 10) scoreUrgencia = 10;
        else if (deficit > 5) scoreUrgencia = 8;
        else if (deficit > 2) scoreUrgencia = 6;
        else if (deficit > 0) scoreUrgencia = 4;
        else scoreUrgencia = 2;

        return {
          zona_id: zona.id,
          zona_nombre: zona.nombre,
          custodios_activos: custodiosUnicosZona,
          servicios_promedio_dia: Number(serviciosPromedioDia.toFixed(1)),
          custodios_requeridos: custodiosRequeridos,
          deficit_custodios: deficit,
          score_urgencia: scoreUrgencia,
          gmv_promedio: Number(gmvPromedio.toFixed(0)),
          tasa_conversion_leads: Math.random() * 15 + 5, // Placeholder - necesitaremos datos reales
          costo_adquisicion_promedio: Math.random() * 3000 + 1500 // Placeholder
        };
      });

      setMetricasReales(metricasPorZona);
      
    } catch (error) {
      console.error('Error fetching real metrics:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las métricas reales",
        variant: "destructive"
      });
    }
  };

  const fetchRealZonas = async () => {
    try {
      // Obtener leads por fuente y estado
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('fuente, estado, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (leadsError) throw leadsError;

      // Obtener candidatos por zona (usando tabla candidatos_custodios)
      const { data: candidatosData, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select('ubicacion_residencia, estado_proceso, created_at');

      if (candidatosError) throw candidatosError;

      const zonasConDatos: ZonaOperacionReal[] = zonasOperativas.map(zona => {
        // Distribuir leads proporcionalmente (necesitaremos geolocalización real después)
        const leadsZona = Math.floor((leadsData?.length || 0) / zonasOperativas.length);
        const candidatosZona = Math.floor((candidatosData?.length || 0) / zonasOperativas.length);
        
        return {
          id: zona.id,
          nombre: zona.nombre,
          estados_incluidos: zona.estados_incluidos,
          coordenadas_centro: zona.coordenadas_centro,
          custodios_activos: 0, // Se calculará en métricas
          servicios_activos: 0, // Se calculará en métricas
          deficit_estimado: 0, // Se calculará en métricas
          score_urgencia: 0, // Se calculará en métricas
          ingresos_mensuales: 0, // Se calculará en métricas
          leads_zona: leadsZona,
          candidatos_zona: candidatosZona
        };
      });

      setZonasReales(zonasConDatos);
      
    } catch (error) {
      console.error('Error fetching real zones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las zonas operativas",
        variant: "destructive"
      });
    }
  };

  const fetchRealCandidatos = async () => {
    try {
      // Integrar datos de leads y candidatos_custodios
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, nombre, email, telefono, fuente, estado, created_at')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      const { data: candidatosData, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select('*')
        .order('created_at', { ascending: false });

      if (candidatosError) throw candidatosError;

      // Convertir leads a formato CandidatoReal
      const leadsCandidatos: CandidatoReal[] = (leadsData || []).map(lead => ({
        id: lead.id,
        nombre: lead.nombre,
        telefono: lead.telefono,
        email: lead.email,
        ubicacion_residencia: null, // Los leads no tienen ubicación por ahora
        estado_proceso: lead.estado === 'nuevo' ? 'lead' : 
                       lead.estado === 'contactado' ? 'contactado' :
                       lead.estado === 'aprobado' ? 'aprobado' : 'rechazado',
        fuente_reclutamiento: lead.fuente,
        fecha_creacion: lead.created_at,
        calificacion_inicial: null,
        experiencia_seguridad: false,
        vehiculo_propio: false
      }));

      // Convertir candidatos_custodios a formato CandidatoReal
      const candidatosCustodios: CandidatoReal[] = (candidatosData || []).map(candidato => {
        // Parsear ubicación si existe
        let ubicacion: [number, number] | null = null;
        if (candidato.ubicacion_residencia) {
          try {
            const coords = candidato.ubicacion_residencia.toString().replace(/[POINT()]/g, '').split(/[,\s]+/);
            if (coords.length >= 2) {
              ubicacion = [parseFloat(coords[0]), parseFloat(coords[1])];
            }
          } catch (error) {
            console.error('Error parsing coordinates:', error);
          }
        }

        return {
          id: candidato.id,
          nombre: candidato.nombre,
          telefono: candidato.telefono,
          email: candidato.email,
          ubicacion_residencia: ubicacion,
          estado_proceso: candidato.estado_proceso || 'lead',
          fuente_reclutamiento: candidato.fuente_reclutamiento,
          fecha_creacion: candidato.created_at || new Date().toISOString(),
          calificacion_inicial: candidato.calificacion_inicial,
          experiencia_seguridad: candidato.experiencia_seguridad || false,
          vehiculo_propio: candidato.vehiculo_propio || false
        };
      });

      // Combinar ambos datasets
      const todosCandidatos = [...leadsCandidatos, ...candidatosCustodios];
      setCandidatosReales(todosCandidatos);
      
    } catch (error) {
      console.error('Error fetching real candidates:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los candidatos reales",
        variant: "destructive"
      });
    }
  };

  const generarAlertasBasadasEnDatos = async () => {
    try {
      setLoading(true);
      
      // Generar alertas basadas en métricas reales
      const alertasGeneradas: AlertaSistemaReal[] = [];
      
      metricasReales.forEach(metrica => {
        // Alerta crítica: déficit alto
        if (metrica.deficit_custodios > 5) {
          alertasGeneradas.push({
            id: `critica-${metrica.zona_id}`,
            tipo_alerta: 'critica',
            categoria: 'deficit_custodios',
            zona_id: metrica.zona_id,
            zona_nombre: metrica.zona_nombre,
            titulo: `Déficit Crítico en ${metrica.zona_nombre}`,
            descripcion: `Se requieren urgentemente ${metrica.deficit_custodios} custodios adicionales. Demanda actual: ${metrica.servicios_promedio_dia} servicios/día.`,
            datos_contexto: {
              deficit: metrica.deficit_custodios,
              servicios_dia: metrica.servicios_promedio_dia,
              custodios_actuales: metrica.custodios_activos
            },
            prioridad: 10,
            estado: 'activa',
            acciones_sugeridas: [
              'Intensificar campaña de reclutamiento',
              'Ofrecer bonos de referidos',
              'Revisar tarifas para atraer más custodios'
            ],
            created_at: new Date().toISOString()
          });
        }

        // Alerta preventiva: déficit moderado
        if (metrica.deficit_custodios > 2 && metrica.deficit_custodios <= 5) {
          alertasGeneradas.push({
            id: `preventiva-${metrica.zona_id}`,
            tipo_alerta: 'preventiva',
            categoria: 'deficit_moderado',
            zona_id: metrica.zona_id,
            zona_nombre: metrica.zona_nombre,
            titulo: `Monitorear Demanda en ${metrica.zona_nombre}`,
            descripcion: `Se observa un déficit moderado de ${metrica.deficit_custodios} custodios. Recomendable tomar acción preventiva.`,
            datos_contexto: {
              deficit: metrica.deficit_custodios,
              score_urgencia: metrica.score_urgencia
            },
            prioridad: 6,
            estado: 'activa',
            acciones_sugeridas: [
              'Activar campaña de reclutamiento dirigida',
              'Contactar custodios inactivos de la zona'
            ],
            created_at: new Date().toISOString()
          });
        }

        // Alerta estratégica: oportunidad de crecimiento
        if (metrica.gmv_promedio > 8000 && metrica.deficit_custodios === 0) {
          alertasGeneradas.push({
            id: `estrategica-${metrica.zona_id}`,
            tipo_alerta: 'estrategica',
            categoria: 'oportunidad_crecimiento',
            zona_id: metrica.zona_id,
            zona_nombre: metrica.zona_nombre,
            titulo: `Oportunidad de Expansión en ${metrica.zona_nombre}`,
            descripcion: `Zona con alto GMV promedio ($${metrica.gmv_promedio.toLocaleString()}) y capacidad operativa estable. Ideal para crecimiento.`,
            datos_contexto: {
              gmv_promedio: metrica.gmv_promedio,
              custodios_activos: metrica.custodios_activos
            },
            prioridad: 4,
            estado: 'activa',
            acciones_sugeridas: [
              'Aumentar presupuesto de marketing en la zona',
              'Expandir red de custodios para capturar más demanda'
            ],
            created_at: new Date().toISOString()
          });
        }
      });

      // Alertas globales basadas en pipeline de candidatos
      const candidatosRecientes = candidatosReales.filter(c => 
        new Date(c.fecha_creacion) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      if (candidatosRecientes.length < 10) {
        alertasGeneradas.push({
          id: 'global-low-pipeline',
          tipo_alerta: 'critica',
          categoria: 'pipeline_bajo',
          zona_id: null,
          titulo: 'Pipeline de Candidatos Bajo',
          descripcion: `Solo ${candidatosRecientes.length} candidatos nuevos en los últimos 7 días. Riesgo de escasez futura.`,
          datos_contexto: {
            candidatos_semana: candidatosRecientes.length,
            objetivo_minimo: 20
          },
          prioridad: 9,
          estado: 'activa',
          acciones_sugeridas: [
            'Revisar y optimizar canales de adquisición',
            'Aumentar presupuesto de marketing digital',
            'Implementar programa de referidos'
          ],
          created_at: new Date().toISOString()
        });
      }

      setAlertasReales(alertasGeneradas);
      
      toast({
        title: "Alertas generadas",
        description: `Se generaron ${alertasGeneradas.length} alertas basadas en datos reales`,
      });
      
    } catch (error) {
      console.error('Error generating alerts:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar las alertas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReal = async () => {
    setLoading(true);
    try {
      console.log('Fetching all real data...');
      
      await Promise.allSettled([
        fetchRealZonas(),
        fetchRealCandidatos(),
        fetchRealMetricas()
      ]);
      
      // Generar alertas después de cargar métricas
      setTimeout(() => {
        generarAlertasBasadasEnDatos();
      }, 1000);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReal();
  }, []);

  // Actualizar zonas con datos de métricas
  useEffect(() => {
    if (metricasReales.length > 0 && zonasReales.length > 0) {
      const zonasActualizadas = zonasReales.map(zona => {
        const metrica = metricasReales.find(m => m.zona_id === zona.id);
        if (metrica) {
          return {
            ...zona,
            custodios_activos: metrica.custodios_activos,
            servicios_activos: Math.round(metrica.servicios_promedio_dia * 30),
            deficit_estimado: metrica.deficit_custodios,
            score_urgencia: metrica.score_urgencia,
            ingresos_mensuales: Math.round(metrica.gmv_promedio * metrica.servicios_promedio_dia * 30)
          };
        }
        return zona;
      });
      setZonasReales(zonasActualizadas);
    }
  }, [metricasReales]);

  // Cálculos derivados basados en datos reales
  const alertasCriticas = alertasReales.filter(a => a.tipo_alerta === 'critica').length;
  const alertasPreventivas = alertasReales.filter(a => a.tipo_alerta === 'preventiva').length;
  const alertasEstrategicas = alertasReales.filter(a => a.tipo_alerta === 'estrategica').length;
  
  const totalDeficit = metricasReales.reduce((sum, m) => sum + m.deficit_custodios, 0);
  const zonasPrioritarias = metricasReales.filter(m => m.score_urgencia >= 8).length;
  
  const candidatosActivos = candidatosReales.filter(c => 
    ['lead', 'contactado', 'entrevista', 'documentacion', 'capacitacion'].includes(c.estado_proceso)
  ).length;

  return {
    // Data real
    zonasReales,
    metricasReales,
    alertasReales,
    candidatosReales,
    
    // Loading state
    loading,
    
    // Actions
    fetchAllReal,
    generarAlertasBasadasEnDatos,
    
    // Computed values basados en datos reales
    alertasCriticas,
    alertasPreventivas,
    alertasEstrategicas,
    totalDeficit,
    zonasPrioritarias,
    candidatosActivos
  };
};