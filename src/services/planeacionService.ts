import { supabase } from '@/integrations/supabase/client';
import type {
  Cliente,
  Custodio,
  Servicio,
  OfertaCustodio,
  Asignacion,
  EventoMonitoreo,
  Touchpoint,
  CostoIngreso,
  ConfigScoring,
  ServicioForm,
  CustodioForm,
  ClienteForm,
  FiltrosServicios,
  FiltrosCustodios,
  FiltrosClientes,
  CustodioConScore,
  ParametrosScoring
} from '@/types/planeacion';

// =====================================================
// SERVICIOS DE CLIENTES
// =====================================================

export const clientesService = {
  async getAll(filtros?: FiltrosClientes): Promise<Cliente[]> {
    let query = supabase
      .from('pc_clientes')
      .select('*')
      .order('nombre');

    if (filtros?.activo !== undefined) {
      query = query.eq('activo', filtros.activo);
    }

    if (filtros?.busqueda) {
      query = query.or(`nombre.ilike.%${filtros.busqueda}%,rfc.ilike.%${filtros.busqueda}%,contacto_nombre.ilike.%${filtros.busqueda}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('pc_clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(cliente: ClienteForm): Promise<Cliente> {
    const { data, error } = await supabase
      .from('pc_clientes')
      .insert(cliente)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, cliente: Partial<ClienteForm>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('pc_clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pc_clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// =====================================================
// SERVICIOS DE CUSTODIOS
// =====================================================

export const custodiosService = {
  // Nueva función unificada que combina múltiples fuentes
  async getUnifiedCustodios(filtros?: FiltrosCustodios): Promise<Custodio[]> {
    try {
      // 1. Obtener custodios de pc_custodios (fuente principal)
      let pcQuery = supabase
        .from('pc_custodios')
        .select('*');

      const { data: pcCustodios, error: pcError } = await pcQuery;
      if (pcError && pcError.code !== 'PGRST116') throw pcError;

      // 2. Obtener candidatos aprobados como custodios nuevos
      const { data: candidatos, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select('*')
        .in('estado_proceso', ['activo', 'aprobado']);

      if (candidatosError) throw candidatosError;

      // 3. Obtener custodios únicos de servicios como fallback
      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios_custodia')
        .select('nombre_custodio, telefono, telefono_operador')
        .not('nombre_custodio', 'is', null)
        .neq('nombre_custodio', '')
        .neq('nombre_custodio', '#N/A')
        .neq('nombre_custodio', 'Sin Asignar');

      if (serviciosError) throw serviciosError;

      // Combinar y unificar datos
      const unifiedCustodios: Custodio[] = [];
      const seenPhones = new Set<string>();
      const seenNames = new Set<string>();

      // Agregar custodios de pc_custodios (prioridad máxima)
      (pcCustodios || []).forEach(custodio => {
        unifiedCustodios.push({
          ...custodio,
          fuente: 'pc_custodios',
          es_nuevo: false
        });
        if (custodio.tel) seenPhones.add(custodio.tel);
        if (custodio.nombre) seenNames.add(custodio.nombre.toLowerCase());
      });

      // Agregar candidatos aprobados como custodios nuevos
      (candidatos || []).forEach(candidato => {
        const telefono = candidato.telefono || '';
        const nombre = candidato.nombre || '';
        
        if (!seenPhones.has(telefono) && !seenNames.has(nombre.toLowerCase()) && telefono && nombre) {
          unifiedCustodios.push({
            id: candidato.id,
            nombre: candidato.nombre,
            tel: candidato.telefono,
            email: candidato.email,
            estado: 'activo',
            disponibilidad: 'disponible',
            zona_base: 'Por asignar',
            tipo_custodia: 'no_armado',
            tiene_gadgets: false,
            rating_promedio: null,
            numero_servicios: 0,
            dias_sin_actividad: 0,
            ultima_actividad: candidato.updated_at || candidato.created_at,
            cuenta_bancaria: null,
            documentos: [],
            certificaciones: [],
            comentarios: `Custodio nuevo - ${candidato.fuente_reclutamiento || 'Directo'}`,
            created_at: candidato.created_at || new Date().toISOString(),
            updated_at: candidato.updated_at || new Date().toISOString(),
            fuente: 'candidatos_custodios',
            es_nuevo: true,
            expectativa_ingresos: candidato.expectativa_ingresos,
            experiencia_seguridad: candidato.experiencia_seguridad,
            vehiculo_propio: candidato.vehiculo_propio
          });
          seenPhones.add(telefono);
          seenNames.add(nombre.toLowerCase());
        }
      });

      // Agregar custodios únicos de servicios como fallback (solo si hay pocos custodios)
      if (unifiedCustodios.length < 5) {
        const custodiosServicios = new Map<string, any>();
        
        (serviciosData || []).forEach(servicio => {
          const nombre = servicio.nombre_custodio?.trim();
          const telefono = servicio.telefono || servicio.telefono_operador;
          
          if (nombre && !seenNames.has(nombre.toLowerCase())) {
            if (!custodiosServicios.has(nombre) || !custodiosServicios.get(nombre).telefono) {
              custodiosServicios.set(nombre, {
                nombre,
                telefono: telefono || 'No disponible'
              });
            }
          }
        });

        custodiosServicios.forEach((data, nombre) => {
          if (!seenNames.has(nombre.toLowerCase())) {
            unifiedCustodios.push({
              id: `servicio_${Date.now()}_${Math.random()}`,
              nombre,
              tel: data.telefono,
              email: null,
              estado: 'activo',
              disponibilidad: 'disponible',
              zona_base: 'Histórico',
              tipo_custodia: 'no_armado',
              tiene_gadgets: false,
              rating_promedio: null,
              numero_servicios: null,
              dias_sin_actividad: 30,
              ultima_actividad: new Date().toISOString(),
              cuenta_bancaria: null,
              documentos: [],
              certificaciones: [],
              comentarios: 'Custodio con historial de servicios',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              fuente: 'servicios_custodia',
              es_nuevo: false
            });
            seenNames.add(nombre.toLowerCase());
          }
        });
      }

      // Aplicar filtros
      let filteredCustodios = unifiedCustodios;

      if (filtros?.estado?.length) {
        filteredCustodios = filteredCustodios.filter(c => filtros.estado!.includes(c.estado));
      }

      if (filtros?.disponibilidad?.length) {
        filteredCustodios = filteredCustodios.filter(c => filtros.disponibilidad!.includes(c.disponibilidad));
      }

      if (filtros?.tipo_custodia?.length) {
        filteredCustodios = filteredCustodios.filter(c => filtros.tipo_custodia!.includes(c.tipo_custodia));
      }

      if (filtros?.tiene_gadgets !== undefined) {
        filteredCustodios = filteredCustodios.filter(c => c.tiene_gadgets === filtros.tiene_gadgets);
      }

      if (filtros?.zona_base) {
        filteredCustodios = filteredCustodios.filter(c => 
          c.zona_base?.toLowerCase().includes(filtros.zona_base!.toLowerCase())
        );
      }

      if (filtros?.rating_minimo) {
        filteredCustodios = filteredCustodios.filter(c => 
          c.rating_promedio ? c.rating_promedio >= filtros.rating_minimo! : true
        );
      }

      if (filtros?.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        filteredCustodios = filteredCustodios.filter(c =>
          c.nombre?.toLowerCase().includes(busqueda) ||
          c.tel?.toLowerCase().includes(busqueda) ||
          c.email?.toLowerCase().includes(busqueda)
        );
      }

      return filteredCustodios.sort((a, b) => {
        // Priorizar custodios de pc_custodios, luego candidatos, luego históricos
        const prioridadA = a.fuente === 'pc_custodios' ? 0 : a.fuente === 'candidatos_custodios' ? 1 : 2;
        const prioridadB = b.fuente === 'pc_custodios' ? 0 : b.fuente === 'candidatos_custodios' ? 1 : 2;
        
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        return (a.nombre || '').localeCompare(b.nombre || '');
      });

    } catch (error) {
      console.error('Error getting unified custodios:', error);
      throw error;
    }
  },

  async getAll(filtros?: FiltrosCustodios): Promise<Custodio[]> {
    // Usar la función unificada por defecto
    return this.getUnifiedCustodios(filtros);
  },

  async getById(id: string): Promise<Custodio | null> {
    const { data, error } = await supabase
      .from('pc_custodios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getDisponibles(requiere_gadgets?: boolean, tipo_custodia?: string): Promise<Custodio[]> {
    const filtros: FiltrosCustodios = {
      estado: ['activo'],
      disponibilidad: ['disponible']
    };

    if (requiere_gadgets) {
      filtros.tiene_gadgets = true;
    }

    if (tipo_custodia && (tipo_custodia === 'armado' || tipo_custodia === 'no_armado')) {
      filtros.tipo_custodia = [tipo_custodia];
    }

    return this.getUnifiedCustodios(filtros);
  },

  async create(custodio: CustodioForm): Promise<Custodio> {
    const { data, error } = await supabase
      .from('pc_custodios')
      .insert(custodio)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, custodio: Partial<CustodioForm>): Promise<Custodio> {
    const { data, error } = await supabase
      .from('pc_custodios')
      .update(custodio)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDisponibilidad(id: string, disponibilidad: string): Promise<void> {
    const { error } = await supabase
      .from('pc_custodios')
      .update({ 
        disponibilidad: disponibilidad as any,
        ultima_actividad: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }
};

// =====================================================
// SERVICIOS DE SERVICIOS DE CUSTODIA
// =====================================================

export const serviciosService = {
  async getAll(filtros?: FiltrosServicios): Promise<Servicio[]> {
    let query = supabase
      .from('pc_servicios')
      .select(`
        *,
        cliente_rel:pc_clientes(*),
        custodio_asignado:pc_custodios(*),
        asignacion:pc_asignaciones(*),
        costos:pc_costos_ingresos(*)
      `)
      .order('created_at', { ascending: false });

    if (filtros?.estado?.length) {
      query = query.in('estado', filtros.estado);
    }

    if (filtros?.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id);
    }

    if (filtros?.fecha_desde) {
      query = query.gte('fecha_programada', filtros.fecha_desde);
    }

    if (filtros?.fecha_hasta) {
      query = query.lte('fecha_programada', filtros.fecha_hasta);
    }

    if (filtros?.tipo_servicio?.length) {
      query = query.in('tipo_servicio', filtros.tipo_servicio);
    }

    if (filtros?.requiere_gadgets !== undefined) {
      query = query.eq('requiere_gadgets', filtros.requiere_gadgets);
    }

    if (filtros?.custodio_asignado) {
      query = query.eq('custodio_asignado_id', filtros.custodio_asignado);
    }

    if (filtros?.busqueda) {
      query = query.or(`folio.ilike.%${filtros.busqueda}%,origen_texto.ilike.%${filtros.busqueda}%,destino_texto.ilike.%${filtros.busqueda}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any || [];
  },

  async getById(id: string): Promise<Servicio | null> {
    const { data, error } = await supabase
      .from('pc_servicios')
      .select(`
        *,
        cliente:pc_clientes(*),
        custodio_asignado:pc_custodios(*),
        ofertas:pc_ofertas_custodio(*, custodio:pc_custodios(*)),
        asignacion:pc_asignaciones(*, custodio:pc_custodios(*)),
        eventos:pc_eventos_monitoreo(*),
        touchpoints:pc_touchpoints(*),
        costos:pc_costos_ingresos(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Transform costos array to single object (assuming one cost record per service)
    const transformedData = {
      ...data,
      costos: data.costos?.[0] || undefined
    };
    
    return transformedData;
  },

  async create(servicio: ServicioForm): Promise<Servicio> {
    const { data, error } = await supabase
      .from('pc_servicios')
      .insert(servicio as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, servicio: Partial<ServicioForm>): Promise<Servicio> {
    const { data, error } = await supabase
      .from('pc_servicios')
      .update(servicio)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEstado(id: string, estado: string, motivo_cancelacion?: string): Promise<void> {
    const updateData: any = { estado };
    if (motivo_cancelacion) {
      updateData.motivo_cancelacion = motivo_cancelacion;
    }

    const { error } = await supabase
      .from('pc_servicios')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async asignarCustodio(servicio_id: string, custodio_id: string, oferta_id?: string): Promise<void> {
    // Crear asignación
    const { error: asignacionError } = await supabase
      .from('pc_asignaciones')
      .insert({
        servicio_id,
        custodio_id,
        oferta_id
      });

    if (asignacionError) throw asignacionError;

    // Actualizar servicio
    const { error: servicioError } = await supabase
      .from('pc_servicios')
      .update({
        estado: 'asignado',
        custodio_asignado_id: custodio_id
      })
      .eq('id', servicio_id);

    if (servicioError) throw servicioError;

    // Actualizar disponibilidad del custodio
    const { error: custodioError } = await supabase
      .from('pc_custodios')
      .update({
        disponibilidad: 'ocupado',
        ultima_actividad: new Date().toISOString()
      })
      .eq('id', custodio_id);

    if (custodioError) throw custodioError;
  }
};

// =====================================================
// SERVICIOS DE OFERTAS
// =====================================================

export const ofertasService = {
  async crear(servicio_id: string, custodio_id: string, score?: number, ola_numero = 1): Promise<OfertaCustodio> {
    const { data, error } = await supabase
      .from('pc_ofertas_custodio')
      .insert({
        servicio_id,
        custodio_id,
        score_asignacion: score,
        ola_numero
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async responder(id: string, estado: 'aceptada' | 'rechazada', motivo_rechazo?: string): Promise<void> {
    const { error } = await supabase
      .from('pc_ofertas_custodio')
      .update({
        estado,
        motivo_rechazo,
        respondida_en: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getByServicio(servicio_id: string): Promise<OfertaCustodio[]> {
    const { data, error } = await supabase
      .from('pc_ofertas_custodio')
      .select('*, custodio:pc_custodios(*)')
      .eq('servicio_id', servicio_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async expirarPendientes(): Promise<void> {
    const { error } = await supabase
      .from('pc_ofertas_custodio')
      .update({ estado: 'expirada' })
      .eq('estado', 'enviada')
      .lt('expira_en', new Date().toISOString());

    if (error) throw error;
  }
};

// =====================================================
// SERVICIOS DE EVENTOS Y MONITOREO
// =====================================================

export const eventosService = {
  async crear(evento: Omit<EventoMonitoreo, 'id' | 'created_at'>): Promise<EventoMonitoreo> {
    const { data, error } = await supabase
      .from('pc_eventos_monitoreo')
      .insert(evento)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByServicio(servicio_id: string): Promise<EventoMonitoreo[]> {
    const { data, error } = await supabase
      .from('pc_eventos_monitoreo')
      .select('*')
      .eq('servicio_id', servicio_id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async marcarResuelto(id: string, notas_resolucion?: string): Promise<void> {
    const { error } = await supabase
      .from('pc_eventos_monitoreo')
      .update({
        resuelto: true,
        resuelto_en: new Date().toISOString(),
        notas_resolucion
      })
      .eq('id', id);

    if (error) throw error;
  }
};

// =====================================================
// SERVICIOS DE TOUCHPOINTS
// =====================================================

export const touchpointsService = {
  async crear(touchpoint: Omit<Touchpoint, 'id' | 'created_at'>): Promise<Touchpoint> {
    const { data, error } = await supabase
      .from('pc_touchpoints')
      .insert(touchpoint)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByServicio(servicio_id: string): Promise<Touchpoint[]> {
    const { data, error } = await supabase
      .from('pc_touchpoints')
      .select('*')
      .eq('servicio_id', servicio_id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// =====================================================
// SERVICIOS DE COSTOS
// =====================================================

export const costosService = {
  async crear(costos: Omit<CostoIngreso, 'id' | 'created_at' | 'updated_at' | 'margen' | 'porcentaje_margen'>): Promise<CostoIngreso> {
    const { data, error } = await supabase
      .from('pc_costos_ingresos')
      .insert(costos)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(servicio_id: string, costos: Partial<CostoIngreso>): Promise<CostoIngreso> {
    const { data, error } = await supabase
      .from('pc_costos_ingresos')
      .update(costos)
      .eq('servicio_id', servicio_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByServicio(servicio_id: string): Promise<CostoIngreso | null> {
    const { data, error } = await supabase
      .from('pc_costos_ingresos')
      .select('*')
      .eq('servicio_id', servicio_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// =====================================================
// ALGORITMO DE SCORING
// =====================================================

export const scoringService = {
  async getConfigActiva(): Promise<ConfigScoring | null> {
    const { data, error } = await supabase
      .from('pc_config_scoring')
      .select('*')
      .eq('activa', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async calcularScores(parametros: ParametrosScoring): Promise<CustodioConScore[]> {
    const { servicio, config, custodios_disponibles } = parametros;
    
    return custodios_disponibles.map(custodio => {
      const score = this.calcularScoreIndividual(servicio, custodio, config);
      return {
        custodio,
        score: score.total,
        desglose_score: score.desglose,
        distancia_km: score.distancia_km
      };
    }).sort((a, b) => b.score - a.score);
  },

  calcularScoreIndividual(servicio: Servicio, custodio: Custodio, config: ConfigScoring) {
    // Antigüedad sin actividad (normalizado)
    const antiguo_inactivo = Math.min(custodio.dias_sin_actividad / 30, 1);
    
    // Distancia al origen (normalizado)
    let distancia_km = 0;
    let distancia_score = 1; // Por defecto máximo si no hay coordenadas
    
    if (servicio.origen_lat && servicio.origen_lng && custodio.lat && custodio.lng) {
      distancia_km = this.calcularDistancia(
        servicio.origen_lat, servicio.origen_lng,
        custodio.lat, custodio.lng
      );
      distancia_score = 1 - Math.min(distancia_km / 50, 1);
    }
    
    // Rating normalizado
    const rating = custodio.rating_promedio / 5;
    
    // Match de tipo de custodia
    const match_tipo = servicio.tipo_servicio === 'escolta' ? 
      (custodio.tipo_custodia === 'armado' ? 1 : 0) : 1;
    
    // Gadgets requeridos
    const gadgets = servicio.requiere_gadgets ? 
      (custodio.tiene_gadgets ? 1 : 0) : 1;
    
    // Certificaciones (simplificado)
    const certificaciones = custodio.certificaciones.length > 0 ? 1 : 0.5;
    
    // Confirmado disponible (últimas 24h)
    const horasDesdeActividad = (Date.now() - new Date(custodio.ultima_actividad).getTime()) / (1000 * 60 * 60);
    const confirmado_disponible = horasDesdeActividad <= 24 ? 1 : 0.5;
    
    // Calcular score total
    const desglose = {
      antiguo_inactivo: (1 - antiguo_inactivo) * config.peso_antiguo_inactivo,
      distancia_origen: distancia_score * config.peso_distancia_origen,
      rating: rating * config.peso_rating,
      match_tipo: match_tipo * config.peso_match_tipo,
      gadgets: gadgets * config.peso_gadgets,
      certificaciones: certificaciones * config.peso_certificaciones,
      confirmado_disponible: confirmado_disponible * config.peso_confirmado_disponible
    };
    
    const total = Object.values(desglose).reduce((sum, val) => sum + val, 0);
    
    return {
      total,
      desglose,
      distancia_km
    };
  },

  calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
};

// =====================================================
// SERVICIOS DE REPORTES Y KPIS
// =====================================================

export const reportesService = {
  async getKPIDashboard(fecha_desde?: string, fecha_hasta?: string) {
    // Implementar consultas para KPIs del dashboard
    // Esta es una versión simplificada, se puede expandir
    
    const serviciosPromise = supabase
      .from('pc_servicios')
      .select('estado, requiere_gadgets, created_at')
      .gte('created_at', fecha_desde || '2024-01-01')
      .lte('created_at', fecha_hasta || new Date().toISOString());

    const custodiosPromise = supabase
      .from('pc_custodios')
      .select('estado')
      .eq('estado', 'activo');

    const costosPromise = supabase
      .from('pc_costos_ingresos')
      .select('cobro_cliente, margen');

    const [serviciosRes, custodiosRes, costosRes] = await Promise.all([
      serviciosPromise,
      custodiosPromise,
      costosPromise
    ]);

    if (serviciosRes.error) throw serviciosRes.error;
    if (custodiosRes.error) throw custodiosRes.error;
    if (costosRes.error) throw costosRes.error;

    const servicios = serviciosRes.data || [];
    const custodios = custodiosRes.data || [];
    const costos = costosRes.data || [];

    return {
      total_servicios: servicios.length,
      servicios_por_estado: servicios.reduce((acc, s) => {
        acc[s.estado] = (acc[s.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      servicios_con_gadgets: servicios.filter(s => s.requiere_gadgets).length,
      custodios_activos: custodios.length,
      ingresos_totales: costos.reduce((sum, c) => sum + (c.cobro_cliente || 0), 0),
      margen_promedio: costos.length > 0 ? 
        costos.reduce((sum, c) => sum + (c.margen || 0), 0) / costos.length : 0
    };
  }
};