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
  fuente: 'pc_custodios' | 'candidatos_custodios' | 'historico';
  disponibilidad: string;
  estado: string;
  rating_promedio?: number;
  numero_servicios?: number;
  certificaciones?: string[];
  tiene_gadgets?: boolean;
  
  // Datos de candidatos_custodios
  zona_preferida_id?: string;
  disponibilidad_horarios?: any;
  vehiculo_propio?: boolean;
  experiencia_seguridad?: boolean;
  expectativa_ingresos?: number;
  
  // Datos calculados
  servicios_historicos?: ServicioHistorico[];
  ciudades_frecuentes?: string[];
  ultima_actividad?: string;
}

export interface ServicioNuevo {
  origen_texto: string;
  destino_texto: string;
  fecha_programada: string;
  hora_ventana_inicio: string;
  tipo_servicio: string;
  incluye_armado: boolean;
  requiere_gadgets: boolean;
}

export interface ScoringProximidad {
  score_total: number;
  score_temporal: number;
  score_geografico: number;
  score_operacional: number;
  detalles: {
    distancia_estimada?: number;
    misma_region?: boolean;
    termina_servicio_cercano?: boolean;
    horas_diferencia?: number;
    zona_preferida_match?: boolean;
    experiencia_tipo_servicio?: boolean;
    vehiculo_propio_ventaja?: boolean;
    razones: string[];
  };
}

/**
 * Calcula el scoring de proximidad operacional para un custodio
 */
export function calcularProximidadOperacional(
  custodio: CustodioConHistorial,
  servicioNuevo: ServicioNuevo,
  serviciosProximos: ServicioHistorico[] = []
): ScoringProximidad {
  const scoring: ScoringProximidad = {
    score_total: 0,
    score_temporal: 0,
    score_geografico: 0,
    score_operacional: 0,
    detalles: {
      razones: []
    }
  };

  // 1. SCORING TEMPORAL (40% del peso total)
  scoring.score_temporal = calcularScoreTemporal(custodio, servicioNuevo, serviciosProximos);
  
  // 2. SCORING GEOGRÁFICO (35% del peso total)
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
  
  // Combinar scores con pesos
  scoring.score_total = Math.round(
    (scoring.score_temporal * 0.4) +
    (scoring.score_geografico * 0.35) +
    (scoring.score_operacional * 0.25)
  );
  
  // Asegurar que esté en rango 0-100
  scoring.score_total = Math.max(0, Math.min(100, scoring.score_total));
  
  return scoring;
}

/**
 * Calcula el score temporal basado en disponibilidad horaria y servicios cercanos
 */
function calcularScoreTemporal(
  custodio: CustodioConHistorial,
  servicioNuevo: ServicioNuevo,
  serviciosProximos: ServicioHistorico[]
): number {
  let score = 30; // Score base para disponibilidad general
  
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
  let score = 20; // Score base
  
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
  let score = 25; // Score base
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
  
  // Razones temporales
  if (scoring.score_temporal > 60) {
    if (scoring.detalles.termina_servicio_cercano) {
      razones.push(`Termina servicio ${scoring.detalles.horas_diferencia}h antes en zona cercana`);
    } else {
      razones.push('Disponible en horario solicitado');
    }
  }
  
  // Razones geográficas
  if (scoring.detalles.zona_preferida_match) {
    razones.push('Zona preferida coincide con el servicio');
  }
  if (scoring.detalles.misma_region) {
    razones.push('Trabaja frecuentemente en la región');
  }
  if (scoring.detalles.distancia_estimada && scoring.detalles.distancia_estimada < 50) {
    razones.push(`Cercano al origen (~${scoring.detalles.distancia_estimada}km)`);
  }
  
  // Razones operacionales
  if (scoring.detalles.experiencia_tipo_servicio) {
    razones.push('Experiencia en este tipo de servicio');
  }
  if (scoring.detalles.vehiculo_propio_ventaja) {
    razones.push('Cuenta con vehículo propio');
  }
  if (custodio.rating_promedio && custodio.rating_promedio >= 4.5) {
    razones.push(`Excelente rating (${custodio.rating_promedio}/5)`);
  }
  if (custodio.numero_servicios && custodio.numero_servicios >= 20) {
    razones.push(`Experiencia comprobada (${custodio.numero_servicios} servicios)`);
  }
  
  // Si no hay razones específicas, agregar una general
  if (razones.length === 0) {
    if (scoring.score_total >= 70) {
      razones.push('Perfil altamente compatible');
    } else if (scoring.score_total >= 50) {
      razones.push('Perfil compatible');
    } else {
      razones.push('Disponible para el servicio');
    }
  }
  
  return razones.slice(0, 3); // Máximo 3 razones para no saturar la UI
}