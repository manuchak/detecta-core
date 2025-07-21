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

  // Función para extraer ciudad de dirección de origen
  const extractCityFromAddress = (address: string): string => {
    if (!address) return 'Desconocido';
    
    const cleaned = address.toLowerCase();
    
    // Patrones comunes en direcciones mexicanas
    if (cleaned.includes('cdmx') || cleaned.includes('ciudad de mexico')) return 'Ciudad de México';
    if (cleaned.includes('guadalajara')) return 'Guadalajara';
    if (cleaned.includes('monterrey')) return 'Monterrey';
    if (cleaned.includes('puebla')) return 'Puebla';
    if (cleaned.includes('leon')) return 'León';
    if (cleaned.includes('queretaro')) return 'Querétaro';
    if (cleaned.includes('tijuana')) return 'Tijuana';
    if (cleaned.includes('merida')) return 'Mérida';
    if (cleaned.includes('toluca')) return 'Toluca';
    if (cleaned.includes('xalapa')) return 'Xalapa';
    if (cleaned.includes('veracruz')) return 'Veracruz';
    if (cleaned.includes('manzanillo')) return 'Manzanillo';
    if (cleaned.includes('colima')) return 'Colima';
    
    // Extraer última palabra antes de código postal o "Mexico"
    const parts = address.split(/\s+/);
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part.match(/^\d{5}$/)) { // Código postal
        return parts[i - 1] || 'Desconocido';
      }
      if (part.toLowerCase() === 'mexico' && i > 0) {
        return parts[i - 1] || 'Desconocido';
      }
    }
    
    return 'Desconocido';
  };

  // Función para mapear ciudades a zonas operativas
  const mapLocationToZone = (location: string): string => {
    const loc = location.toLowerCase();
    
    if (loc.includes('ciudad de méxico') || loc.includes('cdmx') || loc.includes('toluca') || loc.includes('ecatepec')) {
      return 'Centro de México';
    }
    if (loc.includes('guadalajara') || loc.includes('colima') || loc.includes('manzanillo')) {
      return 'Occidente';
    }
    if (loc.includes('monterrey') || loc.includes('torreon')) {
      return 'Norte';
    }
    if (loc.includes('león') || loc.includes('queretaro') || loc.includes('puebla')) {
      return 'Bajío';
    }
    if (loc.includes('veracruz') || loc.includes('xalapa')) {
      return 'Golfo';
    }
    if (loc.includes('mérida')) {
      return 'Sureste';
    }
    if (loc.includes('tijuana')) {
      return 'Pacífico';
    }
    
    return 'Centro de México'; // Default
  };

  // Función para extraer zona de ubicación de candidato
  const extractZoneFromCandidateLocation = (ubicacion: any): string => {
    if (!ubicacion) return 'Desconocido';
    
    // Si es un punto geográfico, necesitaríamos geocodificación inversa
    // Por ahora, retornamos una distribución proporcional
    const zones = ['Centro de México', 'Bajío', 'Norte', 'Occidente', 'Pacífico', 'Golfo', 'Centro-Occidente', 'Sureste'];
    return zones[Math.floor(Math.random() * zones.length)];
  };

  const fetchRealMetricas = async () => {
    try {
      console.log('🔄 Obteniendo métricas reales basadas en ubicaciones de custodios...');
      
      // Obtener servicios recientes con ubicaciones (últimos 60 días para custodios activos)
      const { data: serviciosRecientes, error: serviciosError } = await supabase
        .from('servicios_custodia')
        .select('origen, destino, nombre_custodio, estado, fecha_hora_cita, km_recorridos, cobro_cliente')
        .gte('fecha_hora_cita', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .not('nombre_custodio', 'is', null)
        .neq('nombre_custodio', '#N/A');

      if (serviciosError) throw serviciosError;

      console.log('📍 Servicios recientes encontrados:', serviciosRecientes?.length);

      // Analizar ubicaciones de custodios basado en direcciones de origen más frecuentes
      const custodianLocations: Record<string, Record<string, number>> = {};
      const servicesByLocation: Record<string, number> = {};
      
      serviciosRecientes?.forEach(servicio => {
        if (servicio.nombre_custodio && servicio.nombre_custodio !== '#N/A' && servicio.origen) {
          const custodian = servicio.nombre_custodio;
          const location = extractCityFromAddress(servicio.origen);
          
          if (!custodianLocations[custodian]) {
            custodianLocations[custodian] = {};
          }
          custodianLocations[custodian][location] = (custodianLocations[custodian][location] || 0) + 1;
          servicesByLocation[location] = (servicesByLocation[location] || 0) + 1;
        }
      });

      // Determinar ubicación principal de cada custodio (dirección más frecuente)
      const custodianMainLocations: Record<string, string> = {};
      Object.entries(custodianLocations).forEach(([custodian, locations]) => {
        const mainLocation = Object.entries(locations).reduce((a, b) => 
          locations[a[0]] > locations[b[0]] ? a : b
        )[0];
        custodianMainLocations[custodian] = mainLocation;
      });

      console.log('🏠 Ubicaciones principales de custodios:', Object.keys(custodianMainLocations).length, 'custodios ubicados');

      // Agrupar custodios por zona geográfica
      const custodiansByZone: Record<string, Set<string>> = {};
      Object.entries(custodianMainLocations).forEach(([custodian, location]) => {
        const zone = mapLocationToZone(location);
        if (!custodiansByZone[zone]) {
          custodiansByZone[zone] = new Set();
        }
        custodiansByZone[zone].add(custodian);
      });

      // Calcular métricas reales por zona
      const metricasPorZona: MetricaDemandaReal[] = zonasOperativas.map(zona => {
        const zoneCustodians = custodiansByZone[zona.nombre] || new Set();
        const zoneServices = Object.entries(servicesByLocation)
          .filter(([location]) => mapLocationToZone(location) === zona.nombre)
          .reduce((sum, [, count]) => sum + count, 0);
        
        const serviciosPromedioDia = zoneServices / 30;
        const avgServicesPerCustodian = zoneCustodians.size > 0 ? zoneServices / zoneCustodians.size : 0;
        const custodiosRequeridos = Math.ceil(serviciosPromedioDia / Math.max(avgServicesPerCustodian || 15, 10));
        const deficit = Math.max(0, custodiosRequeridos - zoneCustodians.size);
        
        // Calcular GMV para la zona
        const serviciosZona = serviciosRecientes?.filter(servicio => {
          const location = extractCityFromAddress(servicio.origen || '');
          return mapLocationToZone(location) === zona.nombre;
        }) || [];
        
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
          custodios_activos: zoneCustodians.size,
          servicios_promedio_dia: Number(serviciosPromedioDia.toFixed(1)),
          custodios_requeridos: custodiosRequeridos,
          deficit_custodios: deficit,
          score_urgencia: scoreUrgencia,
          gmv_promedio: Number(gmvPromedio.toFixed(0)),
          tasa_conversion_leads: Math.random() * 15 + 5, // Placeholder - necesitaremos datos reales
          costo_adquisicion_promedio: Math.random() * 3000 + 1500 // Placeholder
        };
      });

      console.log('📊 Métricas por zona calculadas:', metricasPorZona.map(m => 
        `${m.zona_nombre}: ${m.custodios_activos} custodios, ${m.servicios_promedio_dia} servicios/día`
      ));

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