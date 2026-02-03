/**
 * Lógica de proximidad operacional para asignación inteligente de custodios
 */

import { extraerCiudad, calcularDistanciaCiudades, estanEnMismaRegion, mapearZonaPreferidaACiudades } from './geografico';

export interface ServicioHistorico {
  id: string;
  fecha_hora_cita: string;
  origen?: string;
  destino?: string;
  estado: string;
  nombre_custodio?: string;
  tipo_servicio?: string;
  km_recorridos?: number;
}

export interface CustodioConHistorial {
  id: string;
  nombre: string;
  fuente: 'pc_custodios' | 'candidatos_custodios' | 'historico' | 'custodios_operativos';
  disponibilidad: string;
  estado: string;
  rating_promedio?: number;
  numero_servicios?: number;
  certificaciones?: string[];
  tiene_gadgets?: boolean;
  
  // Datos de pc_custodios
  zona_base?: string;
  comentarios?: string;
  
  // Datos de candidatos_custodios
  telefono?: string;
  email?: string;
  zona_preferida_id?: string;
  disponibilidad_horarios?: any;
  vehiculo_propio?: boolean;
  experiencia_seguridad?: boolean;
  expectativa_ingresos?: number;
  estado_proceso?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  
  // Datos calculados
  servicios_historicos?: ServicioHistorico[];
  ciudades_frecuentes?: string[];
  ultima_actividad?: string;
  
  // Scores operativos (cuando vienen de custodios_operativos)
  score_comunicacion?: number;
  score_aceptacion?: number;
  score_confiabilidad?: number;
  score_total?: number;
  tasa_aceptacion?: number;
  tasa_respuesta?: number;
  tasa_confiabilidad?: number;
}

export interface ServicioNuevo {
  origen_texto: string;
  destino_texto: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  requiere_gadgets: boolean;
  es_foraneo?: boolean; // Epic 6: Para rotación local/foráneo
}

// Epic 6: Datos de rotación del custodio
export interface DatosRotacion {
  tipo_ultimo_servicio: 'local' | 'foraneo' | null;
  contador_locales_consecutivos: number;
  contador_foraneos_consecutivos: number;
}

export interface ScoringProximidad {
  score_total: number;
  score_temporal: number;
  score_geografico: number;
  score_operacional: number;
  score_equidad?: number;
  score_oportunidad?: number;
  score_rotacion?: number; // Epic 6: Bonus por rotación local/foráneo
  categoria_disponibilidad?: 'libre' | 'parcialmente_ocupado' | 'ocupado_disponible' | 'no_disponible';
  detalles: {
    distancia_estimada?: number;
    misma_region?: boolean;
    termina_servicio_cercano?: boolean;
    horas_diferencia?: number;
    zona_preferida_match?: boolean;
    bonus_rotacion?: boolean; // Epic 6
    experiencia_tipo_servicio?: boolean;
    vehiculo_propio_ventaja?: boolean;
    servicios_hoy?: number;
    dias_sin_asignar?: number;
    nivel_fatiga?: 'bajo' | 'medio' | 'alto';
    balance_recommendation?: 'ideal' | 'bueno' | 'aceptable' | 'evitar';
    razones: string[];
  };
}

export interface FactorEquidad {
  servicios_hoy: number;
  dias_sin_asignar: number;
  nivel_fatiga: 'bajo' | 'medio' | 'alto';
  score_equidad: number;
  score_oportunidad: number;
  categoria_disponibilidad: 'libre' | 'parcialmente_ocupado' | 'ocupado_disponible' | 'no_disponible';
  balance_recommendation: 'ideal' | 'bueno' | 'aceptable' | 'evitar';
}

/**
 * Calcula el scoring de proximidad operacional para un custodio con algoritmo equitativo
 * Epic 6: Incluye bonus por rotación local/foráneo
 */
export function calcularProximidadOperacional(
  custodio: CustodioConHistorial & Partial<DatosRotacion>,
  servicioNuevo: ServicioNuevo,
  serviciosProximos: ServicioHistorico[] = [],
  factorEquidad?: FactorEquidad
): ScoringProximidad {
  const scoring: ScoringProximidad = {
    score_total: 0,
    score_temporal: 0,
    score_geografico: 0,
    score_operacional: 0,
    score_equidad: 50,
    score_oportunidad: 50,
    categoria_disponibilidad: 'libre',
    detalles: {
      razones: []
    }
  };

  // 1. SCORING TEMPORAL (30% del peso total - reducido para incluir equidad)
  scoring.score_temporal = calcularScoreTemporal(custodio, servicioNuevo, serviciosProximos);
  
  // 2. SCORING GEOGRÁFICO (30% del peso total - reducido para incluir equidad)  
  const scoringGeo = calcularScoreGeografico(custodio, servicioNuevo);
  scoring.score_geografico = scoringGeo.score;
  scoring.detalles.distancia_estimada = scoringGeo.distancia;
  scoring.detalles.misma_region = scoringGeo.mismaRegion;
  scoring.detalles.zona_preferida_match = scoringGeo.zonaPreferidaMatch;
  
  // 3. SCORING OPERACIONAL (25% del peso total)
  const scoringOp = calcularScoreOperacional(custodio, servicioNuevo);
  scoring.score_operacional = scoringOp.score;
  scoring.detalles.experiencia_tipo_servicio = scoringOp.experienciaTipo;
  scoring.detalles.vehiculo_propio_ventaja = scoringOp.vehiculoVentaja;
  
  // 4. SCORING DE EQUIDAD (15% del peso total - NUEVO)
  if (factorEquidad) {
    scoring.score_equidad = factorEquidad.score_equidad;
    scoring.score_oportunidad = factorEquidad.score_oportunidad;
    scoring.categoria_disponibilidad = factorEquidad.categoria_disponibilidad;
    scoring.detalles.servicios_hoy = factorEquidad.servicios_hoy;
    scoring.detalles.dias_sin_asignar = factorEquidad.dias_sin_asignar;
    scoring.detalles.nivel_fatiga = factorEquidad.nivel_fatiga;
    scoring.detalles.balance_recommendation = factorEquidad.balance_recommendation;
  }

  // 5. EPIC 6: BONUS POR ROTACIÓN LOCAL/FORÁNEO
  scoring.score_rotacion = calcularBonusRotacion(custodio, servicioNuevo);
  if (scoring.score_rotacion > 0) {
    scoring.detalles.bonus_rotacion = true;
  }

  // 6. PENALIZACIÓN POR MISMATCH DE PREFERENCIA
  const preferencia = (custodio as any).preferencia_tipo_servicio;
  let penalizacionPreferencia = 0;

  if (preferencia && preferencia !== 'indistinto') {
    const esServicioForaneo = servicioNuevo.es_foraneo;
    
    if (preferencia === 'local' && esServicioForaneo) {
      // Custodio prefiere local pero servicio es foráneo
      penalizacionPreferencia = -15;
      scoring.detalles.razones.push('⚠️ Prefiere servicios locales');
    } else if (preferencia === 'foraneo' && !esServicioForaneo) {
      // Custodio prefiere foráneo pero servicio es local
      penalizacionPreferencia = -10;
      scoring.detalles.razones.push('ℹ️ Prefiere servicios foráneos');
    }
  }

  // ALGORITMO EQUITATIVO: Combinar scores con nuevos pesos (incluye rotación)
  if (factorEquidad) {
    scoring.score_total = Math.round(
      (scoring.score_temporal * 0.28) +           // Proximidad temporal
      (scoring.score_geografico * 0.28) +        // Proximidad geográfica  
      (scoring.score_operacional * 0.24) +       // Performance operacional
      (scoring.score_equidad * 0.10) +           // Factor de equidad (workload)
      (scoring.score_oportunidad * 0.05) +       // Factor de oportunidad (rotación)
      (scoring.score_rotacion * 0.05)            // Epic 6: Bonus rotación local/foráneo
    );
  } else {
    // Algoritmo original para custodios sin datos de equidad
    scoring.score_total = Math.round(
      (scoring.score_temporal * 0.38) +
      (scoring.score_geografico * 0.33) +
      (scoring.score_operacional * 0.24) +
      (scoring.score_rotacion * 0.05)            // Epic 6: Siempre aplicar rotación
    );
  }
  
  // Aplicar penalización por preferencia al score total
  scoring.score_total = Math.max(0, Math.min(100, scoring.score_total + penalizacionPreferencia));
  
  return scoring;
}

/**
 * Epic 6: Calcula bonus por rotación local/foráneo
 * Da prioridad a custodios que han tenido muchos servicios consecutivos del mismo tipo
 */
function calcularBonusRotacion(
  custodio: Partial<DatosRotacion>,
  servicioNuevo: ServicioNuevo
): number {
  // Si no hay datos de rotación o el servicio no tiene clasificación, no dar bonus
  if (!custodio.tipo_ultimo_servicio || servicioNuevo.es_foraneo === undefined) {
    return 50; // Score neutral
  }
  
  const esServicioForaneo = servicioNuevo.es_foraneo;
  const ultimoFueLocal = custodio.tipo_ultimo_servicio === 'local';
  const ultimoFueForaneo = custodio.tipo_ultimo_servicio === 'foraneo';
  
  // Bonus por alternar tipo de servicio
  if ((ultimoFueLocal && esServicioForaneo) || (ultimoFueForaneo && !esServicioForaneo)) {
    // Custodia alterna entre local y foráneo - ideal para balance
    const consecutivos = ultimoFueLocal 
      ? (custodio.contador_locales_consecutivos || 0)
      : (custodio.contador_foraneos_consecutivos || 0);
    
    // Mayor bonus si ha tenido muchos consecutivos del mismo tipo
    if (consecutivos >= 5) return 100; // Urgente rotar
    if (consecutivos >= 3) return 85;  // Recomendado rotar
    if (consecutivos >= 2) return 70;  // Buen momento para rotar
    return 60; // Bonus base por rotación
  }
  
  // Penalización por continuar mismo tipo sin rotación
  const mismosConsecutivos = ultimoFueLocal 
    ? (custodio.contador_locales_consecutivos || 0)
    : (custodio.contador_foraneos_consecutivos || 0);
  
  if (mismosConsecutivos >= 5) return 20; // Evitar más del mismo tipo
  if (mismosConsecutivos >= 3) return 35;
  return 50; // Neutral
}

/**
 * Calcula el score temporal basado en disponibilidad horaria y servicios cercanos
 */
function calcularScoreTemporal(
  custodio: CustodioConHistorial,
  servicioNuevo: ServicioNuevo,
  serviciosProximos: ServicioHistorico[]
): number {
  // Score base dinámico basado en disponibilidad declarada del custodio
  let score = calcularScoreTemporalBase(custodio, servicioNuevo);
  
  const fechaServicio = new Date(`${servicioNuevo.fecha_programada}T${servicioNuevo.hora_ventana_inicio}`);
  const diaSemana = fechaServicio.getDay(); // 0 = domingo, 1 = lunes, etc.
  const horaServicio = fechaServicio.getHours();
  
  // Bonificación por disponibilidad horaria (candidatos nuevos)
  if (custodio.disponibilidad_horarios) {
    const disponibilidad = custodio.disponibilidad_horarios;
    
    // Verificar disponibilidad por día
    if (diaSemana >= 1 && diaSemana <= 5 && disponibilidad.lunes_viernes) {
      score += 15;
    } else if (diaSemana === 6 && disponibilidad.sabados) {
      score += 10;
    } else if (diaSemana === 0 && disponibilidad.domingos) {
      score += 5;
    }
  }
  
  // Bonificación por finalización de servicio cercano temporalmente
  if (serviciosProximos.length > 0) {
    const serviciosCustodio = serviciosProximos.filter(s => 
      s.nombre_custodio === custodio.nombre && 
      s.estado === 'finalizado'
    );
    
    for (const servicio of serviciosCustodio) {
      const fechaPrevio = new Date(servicio.fecha_hora_cita);
      const horasDiferencia = (fechaServicio.getTime() - fechaPrevio.getTime()) / (1000 * 60 * 60);
      
      // Bonus si termina un servicio 2-4 horas antes
      if (horasDiferencia >= 2 && horasDiferencia <= 4) {
        score += 30;
        break;
      } else if (horasDiferencia >= 4 && horasDiferencia <= 8) {
        score += 20;
        break;
      } else if (horasDiferencia >= 1 && horasDiferencia < 2) {
        score += 10; // Muy cercano, pero factible
        break;
      }
    }
  }
  
  return Math.min(100, score);
}

/**
 * Calcula el score geográfico basado en ubicación y patrones de trabajo
 */
function calcularScoreGeografico(
  custodio: CustodioConHistorial,
  servicioNuevo: ServicioNuevo
): { score: number; distancia?: number; mismaRegion: boolean; zonaPreferidaMatch: boolean } {
  // Score base dinámico basado en familiaridad geográfica del custodio
  let score = calcularScoreGeograficoBase(custodio);
  
  const ciudadOrigen = extraerCiudad(servicioNuevo.origen_texto);
  const ciudadDestino = extraerCiudad(servicioNuevo.destino_texto);
  
  let distancia: number | undefined;
  let mismaRegion = false;
  let zonaPreferidaMatch = false;
  
  // Verificar zona preferida para candidatos nuevos
  if (custodio.zona_preferida_id) {
    const ciudadesPreferidas = mapearZonaPreferidaACiudades(custodio.zona_preferida_id);
    if (ciudadOrigen && ciudadesPreferidas.includes(ciudadOrigen)) {
      score += 25;
      zonaPreferidaMatch = true;
    } else if (ciudadDestino && ciudadesPreferidas.includes(ciudadDestino)) {
      score += 15;
      zonaPreferidaMatch = true;
    }
  }
  
  // Para custodios con historial, verificar ciudades frecuentes
  if (custodio.ciudades_frecuentes && custodio.ciudades_frecuentes.length > 0) {
    if (ciudadOrigen && custodio.ciudades_frecuentes.includes(ciudadOrigen)) {
      score += 35; // Alta bonificación por trabajar frecuentemente en esa ciudad
    } else if (ciudadDestino && custodio.ciudades_frecuentes.includes(ciudadDestino)) {
      score += 25;
    }
    
    // Verificar si está en la misma región que sus ciudades frecuentes
    for (const ciudadFrecuente of custodio.ciudades_frecuentes) {
      if (ciudadOrigen && estanEnMismaRegion(ciudadFrecuente, ciudadOrigen)) {
        score += 15;
        mismaRegion = true;
        break;
      }
    }
  }
  
  // Calcular distancia estimada si tenemos las ciudades
  if (ciudadOrigen && custodio.ciudades_frecuentes && custodio.ciudades_frecuentes.length > 0) {
    const distancias = custodio.ciudades_frecuentes
      .map(ciudad => calcularDistanciaCiudades(ciudad, ciudadOrigen))
      .filter(d => d !== null) as number[];
    
    if (distancias.length > 0) {
      distancia = Math.min(...distancias);
      
      // Bonificación por proximidad
      if (distancia < 30) {
        score += 20;
      } else if (distancia < 100) {
        score += 10;
      } else if (distancia < 200) {
        score += 5;
      } else {
        score -= 5; // Penalización por lejanía
      }
    }
  }
  
  return {
    score: Math.min(100, score),
    distancia,
    mismaRegion,
    zonaPreferidaMatch
  };
}

/**
 * Calcula el score operacional basado en experiencia y capacidades
 */
function calcularScoreOperacional(
  custodio: CustodioConHistorial,
  servicioNuevo: ServicioNuevo
): { score: number; experienciaTipo: boolean; vehiculoVentaja: boolean } {
  // Score base dinámico basado en perfil del custodio
  let score = calcularScoreBaseDinamico(custodio);
  let experienciaTipo = false;
  let vehiculoVentaja = false;
  
  // Bonificación por experiencia en seguridad (candidatos nuevos)
  if (custodio.experiencia_seguridad) {
    score += 15;
    if (servicioNuevo.incluye_armado) {
      score += 10;
      experienciaTipo = true;
    }
  }
  
  // Bonificación por vehículo propio
  if (custodio.vehiculo_propio) {
    score += 10;
    vehiculoVentaja = true;
    
    // Extra para servicios que requieren movilidad
    if (servicioNuevo.tipo_servicio.includes('traslado') || servicioNuevo.requiere_gadgets) {
      score += 5;
    }
  }
  
  // Bonificación por rating alto (custodios existentes)
  if (custodio.rating_promedio) {
    if (custodio.rating_promedio >= 4.5) {
      score += 20;
    } else if (custodio.rating_promedio >= 4.0) {
      score += 15;
    } else if (custodio.rating_promedio >= 3.5) {
      score += 10;
    }
  }
  
  // Bonificación por número de servicios completados
  if (custodio.numero_servicios) {
    if (custodio.numero_servicios >= 50) {
      score += 15;
    } else if (custodio.numero_servicios >= 20) {
      score += 10;
    } else if (custodio.numero_servicios >= 10) {
      score += 5;
    }
  }
  
  // Bonificación por certificaciones relevantes
  if (custodio.certificaciones && custodio.certificaciones.length > 0) {
    score += Math.min(10, custodio.certificaciones.length * 2);
    
    // Extra para servicios armados
    if (servicioNuevo.incluye_armado) {
      const certificacionesSeguridad = custodio.certificaciones.filter(cert =>
        cert.toLowerCase().includes('seguridad') ||
        cert.toLowerCase().includes('arma') ||
        cert.toLowerCase().includes('custodia')
      );
      if (certificacionesSeguridad.length > 0) {
        score += 10;
        experienciaTipo = true;
      }
    }
  }
  
  return {
    score: Math.min(100, score),
    experienciaTipo,
    vehiculoVentaja
  };
}

/**
 * Analiza los patrones de trabajo de un custodio y extrae ciudades frecuentes
 */
export function analizarPatronesTrabajoCustomdio(servicios: ServicioHistorico[]): {
  ciudades_frecuentes: string[];
  tipos_servicio_frecuentes: string[];
  zonas_operacion: string[];
} {
  const ciudadesCount: Record<string, number> = {};
  const tiposCount: Record<string, number> = {};
  const zonas: Set<string> = new Set();
  
  for (const servicio of servicios) {
    // Analizar origen y destino
    const ciudadOrigen = extraerCiudad(servicio.origen || '');
    const ciudadDestino = extraerCiudad(servicio.destino || '');
    
    if (ciudadOrigen) {
      ciudadesCount[ciudadOrigen] = (ciudadesCount[ciudadOrigen] || 0) + 1;
    }
    if (ciudadDestino) {
      ciudadesCount[ciudadDestino] = (ciudadesCount[ciudadDestino] || 0) + 1;
    }
    
    // Analizar tipos de servicio
    if (servicio.tipo_servicio) {
      tiposCount[servicio.tipo_servicio] = (tiposCount[servicio.tipo_servicio] || 0) + 1;
    }
  }
  
  // Obtener ciudades más frecuentes (al menos 2 servicios)
  const ciudades_frecuentes = Object.entries(ciudadesCount)
    .filter(([_, count]) => count >= 2)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([ciudad, _]) => ciudad);
  
  // Obtener tipos de servicio más frecuentes
  const tipos_servicio_frecuentes = Object.entries(tiposCount)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([tipo, _]) => tipo);
  
  return {
    ciudades_frecuentes,
    tipos_servicio_frecuentes,
    zonas_operacion: Array.from(zonas)
  };
}

/**
 * Genera razones legibles para mostrar al usuario por qué se recomienda un custodio
 */
export function generarRazonesRecomendacion(scoring: ScoringProximidad, custodio: CustodioConHistorial): string[] {
  const razones: string[] = [];
  
  // Razones de equidad (PRIORIDAD ALTA - aparecen primero)
  if (scoring.detalles.balance_recommendation === 'ideal') {
    razones.push(`🎯 Ideal: ${scoring.detalles.servicios_hoy || 0} servicios hoy`);
  } else if (scoring.detalles.balance_recommendation === 'bueno') {
    razones.push(`✅ Buen balance: ${scoring.detalles.servicios_hoy || 0} servicios hoy`);
  } else if (scoring.detalles.balance_recommendation === 'aceptable') {
    razones.push(`⚖️ Balance aceptable: ${scoring.detalles.servicios_hoy || 0} servicios hoy`);
  }
  
  // Razones de oportunidad (rotación)
  if (scoring.detalles.dias_sin_asignar && scoring.detalles.dias_sin_asignar >= 3) {
    razones.push(`🔄 ${scoring.detalles.dias_sin_asignar} días sin servicio - merece oportunidad`);
  } else if (scoring.detalles.dias_sin_asignar === 1) {
    razones.push(`📅 Último servicio ayer - rotación balanceada`);
  }
  
  // Razones temporales
  if (scoring.score_temporal > 60) {
    if (scoring.detalles.termina_servicio_cercano) {
      razones.push(`⏰ Termina servicio ${scoring.detalles.horas_diferencia}h antes en zona cercana`);
    } else {
      razones.push('✅ Disponible en horario solicitado');
    }
  }
  
  // Razones geográficas
  if (scoring.detalles.zona_preferida_match) {
    razones.push('🎯 Zona preferida coincide con el servicio');
  }
  if (scoring.detalles.misma_region) {
    razones.push('🗺️ Trabaja frecuentemente en la región');
  }
  if (scoring.detalles.distancia_estimada && scoring.detalles.distancia_estimada < 50) {
    razones.push(`📍 Cercano al origen (~${scoring.detalles.distancia_estimada}km)`);
  }
  
  // Razones operacionales
  if (scoring.detalles.experiencia_tipo_servicio) {
    razones.push('🛡️ Experiencia en este tipo de servicio');
  }
  if (scoring.detalles.vehiculo_propio_ventaja) {
    razones.push('🚗 Cuenta con vehículo propio');
  }
  if (custodio.rating_promedio && custodio.rating_promedio >= 4.5) {
    razones.push(`⭐ Excelente rating (${custodio.rating_promedio}/5)`);
  }
  if (custodio.numero_servicios && custodio.numero_servicios >= 20) {
    razones.push(`📊 Experiencia comprobada (${custodio.numero_servicios} servicios)`);
  }
  
  // Advertencias sobre carga de trabajo
  if (scoring.detalles.nivel_fatiga === 'alto') {
    razones.push('⚠️ Alta carga de trabajo - considerar otros custodios');
  } else if (scoring.detalles.nivel_fatiga === 'medio') {
    razones.push('⚡ Carga media de trabajo');
  }
  
  // Si no hay razones específicas, agregar una general
  if (razones.length === 0) {
    if (scoring.score_total >= 70) {
      razones.push('🔥 Perfil altamente compatible');
    } else if (scoring.score_total >= 50) {
      razones.push('✅ Perfil compatible');
    } else {
      razones.push('📋 Disponible para el servicio');
    }
  }
  
  return razones.slice(0, 4); // Máximo 4 razones para incluir info de equidad
}

/**
 * Calcula score base dinámico para el componente operacional
 */
function calcularScoreBaseDinamico(custodio: CustodioConHistorial): number {
  let baseScore = 10; // Base más bajo para mayor diferenciación
  
  // Bonificación mayor por número real de servicios (históricos)
  if (custodio.numero_servicios) {
    if (custodio.numero_servicios >= 200) baseScore += 25;
    else if (custodio.numero_servicios >= 100) baseScore += 22;
    else if (custodio.numero_servicios >= 50) baseScore += 18;
    else if (custodio.numero_servicios >= 20) baseScore += 15;
    else if (custodio.numero_servicios >= 10) baseScore += 12;
    else if (custodio.numero_servicios >= 5) baseScore += 8;
    else baseScore += 5;
  }
  
  // Bonificación por experiencia en seguridad (+0-12 puntos)
  if (custodio.experiencia_seguridad) {
    baseScore += 12;
  } else if (custodio.fuente === 'pc_custodios') {
    // Si es de pc_custodios, asumimos cierta experiencia
    baseScore += 6;
  }
  
  // Bonificación por certificaciones (+0-10 puntos)
  if (custodio.certificaciones && custodio.certificaciones.length > 0) {
    baseScore += Math.min(10, custodio.certificaciones.length * 2.5);
  }
  
  // Bonificación por vehículo propio (+0-8 puntos)
  if (custodio.vehiculo_propio) {
    baseScore += 8;
  }
  
  // Bonificación por rating histórico (+0-15 puntos)
  if (custodio.rating_promedio) {
    if (custodio.rating_promedio >= 4.7) baseScore += 15;
    else if (custodio.rating_promedio >= 4.5) baseScore += 12;
    else if (custodio.rating_promedio >= 4.0) baseScore += 8;
    else if (custodio.rating_promedio >= 3.5) baseScore += 4;
    else baseScore -= 2; // Penalización por rating bajo
  }
  
  return Math.min(65, baseScore); // Máximo 65 puntos base (fue 40)
}

/**
 * Calcula score temporal base basado en disponibilidad del custodio
 */
function calcularScoreTemporalBase(custodio: CustodioConHistorial, servicioNuevo: ServicioNuevo): number {
  let baseScore = 20; // Mínimo base
  
  const fechaServicio = new Date(`${servicioNuevo.fecha_programada}T${servicioNuevo.hora_ventana_inicio}`);
  const horaServicio = fechaServicio.getHours();
  
  // Bonificación por disponibilidad amplia
  if (custodio.disponibilidad_horarios) {
    const disponibilidad = custodio.disponibilidad_horarios;
    let flexibilidad = 0;
    
    if (disponibilidad.lunes_viernes) flexibilidad++;
    if (disponibilidad.sabados) flexibilidad++;
    if (disponibilidad.domingos) flexibilidad++;
    
    baseScore += flexibilidad * 5; // 5 puntos por cada tipo de disponibilidad
  } else if (custodio.fuente === 'pc_custodios') {
    // Asumimos flexibilidad para custodios establecidos
    baseScore += 10;
  }
  
  // Bonificación por horario conveniente (9-18h = más puntos)
  if (horaServicio >= 9 && horaServicio <= 18) {
    baseScore += 5;
  } else if (horaServicio >= 6 && horaServicio <= 22) {
    baseScore += 2;
  }
  
  return Math.min(35, baseScore); // Máximo 35 puntos base
}

/**
 * Calcula score geográfico base basado en conocimiento de zona del custodio
 */
function calcularScoreGeograficoBase(custodio: CustodioConHistorial): number {
  let baseScore = 8; // Base más bajo para mayor diferenciación
  
  // Bonificación por zona base definida
  if (custodio.zona_base) {
    baseScore += 12;
  }
  
  // Mayor bonificación por ciudades frecuentes (experiencia geográfica real)
  if (custodio.ciudades_frecuentes && custodio.ciudades_frecuentes.length > 0) {
    baseScore += Math.min(20, custodio.ciudades_frecuentes.length * 4);
  }
  
  // Bonificación significativa por número de servicios (conocimiento acumulado)
  if (custodio.numero_servicios) {
    if (custodio.numero_servicios >= 100) baseScore += 18;
    else if (custodio.numero_servicios >= 50) baseScore += 15;
    else if (custodio.numero_servicios >= 20) baseScore += 12;
    else if (custodio.numero_servicios >= 10) baseScore += 8;
    else if (custodio.numero_servicios >= 5) baseScore += 5;
    else baseScore += 2;
  }
  
  // Bonificación por tipo de custodio
  if (custodio.fuente === 'historico') {
    baseScore += 8; // Históricos tienen ventaja geográfica
  } else if (custodio.fuente === 'pc_custodios') {
    baseScore += 5;
  }
  
  return Math.min(45, baseScore); // Máximo 45 puntos base (fue 30)
}