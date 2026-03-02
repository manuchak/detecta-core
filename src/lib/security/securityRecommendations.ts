// Security Recommendations Module - ISO 28000 Aligned
// DETECTA MODEL: Preventive approach - No confrontation, no satellite, no weapons specs

// ============================================================
// OPERATIONAL CONSTANTS - DETECTA MODEL
// ============================================================
export const OPERATIONAL_CONSTANTS = {
  touchpointIntervalMinutes: 25,     // Mandatory check-in every 25 minutes
  avgTruckSpeedKmh: 70,              // Average toll road speed
  kmPerTouchpoint: 29,               // Distance covered per touchpoint (70 km/h × 25/60 h)
  maxAcceptableNoContactMinutes: 35, // Warning threshold
  criticalNoContactMinutes: 50,      // Critical alert threshold
  emergencyNoContactMinutes: 75,     // Emergency protocol activation
};

// ============================================================
// CARGO VALUE THRESHOLDS (MXN) - Based on operational recommendations
// ============================================================
export const CARGO_VALUE_THRESHOLDS = {
  armedCustodyRequired: 5000000,       // >$5M MXN - Enhanced custody required
  armedCustodyRecommended: 2000000,    // $2M-$5M MXN - Enhanced custody recommended
  simpleCustodySufficient: 0,          // <$2M MXN - Standard monitoring sufficient
};

// ============================================================
// TYPE DEFINITIONS
// ============================================================
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertLevel = 'normal' | 'warning' | 'critical' | 'emergency';
export type ProtocolType = 'standard' | 'enhanced' | 'satellite';

export interface RecommendationItem {
  text: string;
  priority: RecommendationPriority;
  icon: string;
  rationale?: string;
}

// Interface with Spanish keys for backward compatibility
export interface ISO28000Recommendations {
  prevencion: RecommendationItem[];
  deteccion: RecommendationItem[];
  respuesta: RecommendationItem[];
  cumplimiento: RecommendationItem[];
}

export interface TouchpointAnalysis {
  transitTimeMinutes: number;
  touchpointsLost: number;
  checkInRequired: boolean;
  satelliteRequired: boolean; // Kept for compatibility, but behavior changed (means enhanced monitoring)
  alertLevel: AlertLevel;
  protocolRequired: ProtocolType;
}

export interface TouchpointGapZone {
  zoneName: string;
  kmLength: number;
  transitMinutes: number;
  touchpointsLost: number;
  requiresCheckIn: boolean;
  requiresSatellite: boolean; // Kept for compatibility, means requires enhanced monitoring
  alertLevel?: AlertLevel;
}

export interface OperationalImpact {
  estimatedTransitTimeMinutes: number;
  expectedTouchpoints: number;
  lostTouchpoints: number;
  maxConsecutiveMinutesNoContact: number;
  zonesWithLostTouchpoints: TouchpointGapZone[];
  alertLevel: AlertLevel;
  protocolRequired: ProtocolType;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate touchpoint analysis for a given distance
 */
export function calculateTouchpointAnalysis(kmLength: number): TouchpointAnalysis {
  const { avgTruckSpeedKmh, touchpointIntervalMinutes, maxAcceptableNoContactMinutes, criticalNoContactMinutes, emergencyNoContactMinutes } = OPERATIONAL_CONSTANTS;
  
  const transitTimeMinutes = Math.round((kmLength / avgTruckSpeedKmh) * 60);
  const touchpointsLost = Math.floor(transitTimeMinutes / touchpointIntervalMinutes);
  
  let alertLevel: AlertLevel = 'normal';
  let protocolRequired: ProtocolType = 'standard';
  
  // Changed: "satellite" protocol now means "enhanced monitoring with C4 notification"
  if (transitTimeMinutes >= emergencyNoContactMinutes) {
    alertLevel = 'emergency';
    protocolRequired = 'satellite'; // Actually means: enhanced monitoring + C4 notification
  } else if (transitTimeMinutes >= criticalNoContactMinutes) {
    alertLevel = 'critical';
    protocolRequired = 'enhanced';
  } else if (transitTimeMinutes >= maxAcceptableNoContactMinutes) {
    alertLevel = 'warning';
    protocolRequired = 'enhanced';
  }
  
  return {
    transitTimeMinutes,
    touchpointsLost,
    checkInRequired: touchpointsLost >= 1,
    satelliteRequired: touchpointsLost >= 3, // Now means: requires enhanced monitoring, not actual satellite
    alertLevel,
    protocolRequired,
  };
}

/**
 * Determine custody type based on cargo value
 * Note: "armed" in this context refers to enhanced custody level, not weapon specifications
 */
export function determineCustodyType(cargoValueMXN: number | undefined): {
  type: 'armed_required' | 'armed_recommended' | 'simple';
  label: string;
  rationale: string;
} {
  if (!cargoValueMXN) {
    return {
      type: 'simple',
      label: 'Monitoreo GPS Estándar',
      rationale: 'Valor de carga no especificado',
    };
  }
  
  if (cargoValueMXN >= CARGO_VALUE_THRESHOLDS.armedCustodyRequired) {
    return {
      type: 'armed_required',
      label: 'Custodia Reforzada Requerida',
      rationale: `Carga de alto valor (>$${(CARGO_VALUE_THRESHOLDS.armedCustodyRequired / 1000000).toFixed(0)}M MXN) requiere custodia de seguimiento reforzada`,
    };
  }
  
  if (cargoValueMXN >= CARGO_VALUE_THRESHOLDS.armedCustodyRecommended) {
    return {
      type: 'armed_recommended',
      label: 'Custodia Reforzada Recomendada',
      rationale: `Valor de carga $${(cargoValueMXN / 1000000).toFixed(1)}M MXN - custodia de seguimiento recomendada`,
    };
  }
  
  return {
    type: 'simple',
    label: 'Monitoreo GPS Estándar',
    rationale: `Valor de carga $${(cargoValueMXN / 1000).toFixed(0)}K MXN - monitoreo estándar suficiente`,
  };
}

/**
 * Get alert level color for UI
 */
export function getAlertLevelColor(level: AlertLevel): string {
  switch (level) {
    case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
    case 'critical': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
    default: return 'text-green-600 bg-green-50 border-green-200';
  }
}

/**
 * Get alert level badge variant
 */
export function getAlertLevelBadgeVariant(level: AlertLevel): 'destructive' | 'secondary' | 'outline' | 'default' {
  switch (level) {
    case 'emergency': return 'destructive';
    case 'critical': return 'destructive';
    case 'warning': return 'secondary';
    default: return 'outline';
  }
}

// ============================================================
// ISO 28000 RECOMMENDATIONS GENERATOR - PREVENTIVE MODEL
// DETECTA: Prevention, Detection, Response (via authorities), Compliance
// ============================================================

/**
 * Generate ISO 28000 recommendations based on risk level and operational context
 * DETECTA MODEL: Prevention, Detection, Response (via authorities), Compliance
 */
export function generateISO28000Recommendations(
  riskLevel: 'extremo' | 'alto' | 'medio' | 'bajo',
  touchpointAnalysis: TouchpointAnalysis | null,
  cargoValueMXN?: number
): ISO28000Recommendations {
  const custody = determineCustodyType(cargoValueMXN);
  const recommendations: ISO28000Recommendations = {
    prevencion: [],
    deteccion: [],
    respuesta: [],
    cumplimiento: [],
  };
  
  // ========================================
  // PREVENCIÓN (Detecta preventive actions)
  // ========================================
  
  recommendations.prevencion.push({
    text: 'Verificar alertas de seguridad y condiciones viales antes de partida',
    priority: 'high',
    icon: '✓',
    rationale: 'Planificación previa reduce exposición a riesgos conocidos',
  });
  
  if (riskLevel === 'extremo' || riskLevel === 'alto') {
    recommendations.prevencion.push({
      text: 'NO transitar de noche (22:00-06:00) en segmentos de riesgo extremo/alto',
      priority: 'critical',
      icon: '🌙',
      rationale: 'Horario nocturno concentra >70% de incidentes en corredores críticos',
    });
    recommendations.prevencion.push({
      text: 'Seleccionar ventana de salida óptima según análisis de ruta',
      priority: 'high',
      icon: '⏰',
      rationale: 'Permite atravesar zonas críticas en horario de menor incidencia',
    });
  }
  
  if (riskLevel === 'extremo') {
    recommendations.prevencion.push({
      text: 'Custodia de seguimiento y monitoreo obligatoria para segmentos extremos',
      priority: 'critical',
      icon: '🚗',
      rationale: 'Presencia de unidad de custodia disuade intentos de robo',
    });
    recommendations.prevencion.push({
      text: 'Evaluar ruta alternativa evitando segmentos de riesgo extremo',
      priority: 'high',
      icon: '🛤️',
      rationale: 'Rutas alternativas pueden agregar tiempo pero reducir exposición significativamente',
    });
  }
  
  recommendations.prevencion.push({
    text: 'Cargar combustible únicamente en puntos certificados (ORO/PLATA)',
    priority: 'medium',
    icon: '⛽',
    rationale: 'Puntos certificados cuentan con vigilancia y protocolos de emergencia',
  });
  
  // ========================================
  // DETECCIÓN (Monitoring)
  // ========================================
  
  recommendations.deteccion.push({
    text: `Check-in obligatorio cada ${OPERATIONAL_CONSTANTS.touchpointIntervalMinutes} minutos`,
    priority: 'high',
    icon: '📍',
    rationale: 'Protocolo estándar Detecta para mantener contacto continuo',
  });
  
  // GPS frequency based on risk
  if (riskLevel === 'extremo') {
    recommendations.deteccion.push({
      text: 'Monitoreo GPS cada 5 minutos en segmentos extremos',
      priority: 'critical',
      icon: '📡',
      rationale: 'Frecuencia aumentada permite detección temprana de desviaciones',
    });
    recommendations.deteccion.push({
      text: 'Alerta automática por desviación de ruta (>300m)',
      priority: 'critical',
      icon: '⚠️',
      rationale: 'Desviaciones pueden indicar secuestro o evento en curso',
    });
  } else if (riskLevel === 'alto') {
    recommendations.deteccion.push({
      text: 'Monitoreo GPS cada 10 minutos en segmentos de alto riesgo',
      priority: 'high',
      icon: '📡',
      rationale: 'Frecuencia intermedia balanceando detección y recursos',
    });
  } else {
    recommendations.deteccion.push({
      text: 'Monitoreo GPS cada 15 minutos en segmentos estándar',
      priority: 'medium',
      icon: '📡',
      rationale: 'Frecuencia estándar para rutas de bajo riesgo',
    });
  }
  
  // Dead zone protocol - enhanced monitoring (not satellite)
  if (touchpointAnalysis && touchpointAnalysis.checkInRequired) {
    if (touchpointAnalysis.touchpointsLost >= 3) {
      recommendations.deteccion.push({
        text: `MONITOREO REFORZADO: ${touchpointAnalysis.touchpointsLost} touchpoints perdidos (~${touchpointAnalysis.transitTimeMinutes} min sin contacto)`,
        priority: 'critical',
        icon: '📶',
        rationale: 'Check-in obligatorio ANTES y DESPUÉS de zona. Notificar C4.',
      });
    } else {
      recommendations.deteccion.push({
        text: `Check-in antes/después de zona sin cobertura (${touchpointAnalysis.touchpointsLost} touchpoint${touchpointAnalysis.touchpointsLost > 1 ? 's' : ''} perdido${touchpointAnalysis.touchpointsLost > 1 ? 's' : ''})`,
        priority: 'high',
        icon: '📍',
        rationale: 'Establece último punto conocido y confirma salida de zona ciega',
      });
    }
  }
  
  // ========================================
  // RESPUESTA (Via authorities - NO confrontation)
  // ========================================
  
  recommendations.respuesta.push({
    text: 'Si detecta seguimiento: NO acelerar, NO confrontar, notificar C4 inmediatamente',
    priority: 'critical',
    icon: '🚨',
    rationale: 'MODELO DETECTA: Activación de autoridades, no intervención directa',
  });
  
  recommendations.respuesta.push({
    text: 'Activar botón de pánico con geolocalización instantánea',
    priority: 'critical',
    icon: '🆘',
    rationale: 'Transmite ubicación exacta a C4 para respuesta coordinada',
  });
  
  if (riskLevel === 'extremo' || riskLevel === 'alto') {
    recommendations.respuesta.push({
      text: 'C4 notifica automáticamente a Guardia Nacional y Policía Estatal',
      priority: 'critical',
      icon: '🚔',
      rationale: 'Respuesta la ejecutan autoridades competentes, no Detecta',
    });
    recommendations.respuesta.push({
      text: 'Mantener línea abierta con C4 hasta confirmación de seguridad',
      priority: 'high',
      icon: '📞',
      rationale: 'Comunicación continua permite coordinación de respuesta',
    });
  }
  
  recommendations.respuesta.push({
    text: 'Dirigirse al punto seguro más cercano si es factible y seguro',
    priority: 'high',
    icon: '🏢',
    rationale: 'Puntos certificados ofrecen protección temporal mientras llega apoyo',
  });
  
  recommendations.respuesta.push({
    text: 'En caso de bloqueo: NO intentar evadir, esperar instrucciones de C4',
    priority: 'critical',
    icon: '⛔',
    rationale: 'Evasión puede escalar situación. Autoridades evalúan mejor respuesta',
  });
  
  // ========================================
  // CUMPLIMIENTO (Compliance/Continuity)
  // ========================================
  
  // Custody based on cargo value - no weapon specifications
  if (custody.type === 'armed_required') {
    recommendations.cumplimiento.push({
      text: 'Custodia de seguimiento reforzada obligatoria por valor de carga',
      priority: 'critical',
      icon: '📋',
      rationale: custody.rationale,
    });
  } else if (custody.type === 'armed_recommended') {
    recommendations.cumplimiento.push({
      text: 'Custodia de seguimiento recomendada para cobertura óptima',
      priority: 'high',
      icon: '📋',
      rationale: custody.rationale,
    });
  } else {
    recommendations.cumplimiento.push({
      text: 'Monitoreo GPS estándar suficiente para nivel de carga',
      priority: 'medium',
      icon: '📋',
      rationale: custody.rationale,
    });
  }
  
  recommendations.cumplimiento.push({
    text: 'Verificación de sellos antes de entrar a zona de riesgo',
    priority: 'medium',
    icon: '🔒',
  });
  
  recommendations.cumplimiento.push({
    text: 'Vehículo de respaldo posicionable en máximo 2 horas',
    priority: 'medium',
    icon: '🚛',
    rationale: 'Permite continuidad de entrega en caso de incidente menor',
  });
  
  if (riskLevel === 'extremo' || riskLevel === 'alto') {
    recommendations.cumplimiento.push({
      text: 'Protocolo de transferencia de carga en punto seguro certificado',
      priority: 'high',
      icon: '📦',
      rationale: 'Transferencia controlada minimiza exposición de carga',
    });
  }
  
  recommendations.cumplimiento.push({
    text: 'Documentación completa de incidente para reporte y mejora continua',
    priority: 'low',
    icon: '📝',
    rationale: 'Retroalimentación mejora evaluaciones futuras de ruta',
  });
  
  return recommendations;
}

/**
 * Get overall alert level from multiple zones
 */
export function getOverallAlertLevel(zones: TouchpointGapZone[]): AlertLevel {
  if (zones.some(z => z.requiresSatellite || z.touchpointsLost >= 3)) return 'emergency';
  if (zones.some(z => z.touchpointsLost >= 2)) return 'critical';
  if (zones.some(z => z.touchpointsLost >= 1 || z.requiresCheckIn)) return 'warning';
  return 'normal';
}

/**
 * Format touchpoint loss message
 */
export function formatTouchpointMessage(touchpointsLost: number, transitMinutes: number): string {
  if (touchpointsLost === 0) {
    return `Zona transitada en ~${Math.round(transitMinutes)} min - sin pérdida de touchpoints`;
  }
  if (touchpointsLost === 1) {
    return `1 touchpoint perdido (~${Math.round(transitMinutes)} min sin contacto)`;
  }
  return `${touchpointsLost} touchpoints perdidos (~${Math.round(transitMinutes)} min sin contacto)`;
}

// ============================================================
// CONTACT INFORMATION - OPERATIONAL
// ============================================================
export const EMERGENCY_CONTACTS = {
  detectaC4: {
    name: 'Central de Monitoreo Detecta',
    phone: '800-DETECTA',
    available: '24/7',
  },
  emergencias: {
    name: 'Emergencias',
    phone: '911',
    available: '24/7',
  },
  guardiaNacional: {
    name: 'Guardia Nacional (Carreteras)',
    phone: '088',
    available: '24/7',
  },
  sesnsp: {
    name: 'SESNSP (Denuncia Anónima)',
    phone: '074',
    available: '24/7',
  },
};

// ============================================================
// ANTI-JAMMER PROTOCOL - Based on AMESIS 2025 (71% jammer usage)
// ============================================================
export const ANTI_JAMMER_PROTOCOL = {
  jammerUsageRate: 0.71, // 71% of incidents involve GPS jammers
  thresholdForProtocol: 0.50, // Activate anti-jammer protocol when zone rate > 50%
  recommendations: [
    'Verificar funcionamiento de GPS ANTES de entrar a zona',
    'Activar comunicación satelital de respaldo si disponible',
    'Check-in obligatorio ANTES y DESPUÉS de zona con alta incidencia de jammers',
    'Reportar cualquier pérdida de señal GPS inmediatamente a C4',
    'En caso de pérdida de señal >5 min, C4 activa protocolo de emergencia automáticamente',
  ],
  criticalZones: ['edomex-industrial', 'mexico-texcoco', 'cordoba-puebla', 'mexico-puebla'],
};

// ============================================================
// CRITICAL HOURS INTELLIGENCE - AMIS/CANACAR 2025
// ============================================================
export const CRITICAL_HOURS_INTELLIGENCE = {
  primaryWindow: '19:00-00:00', // 45% de incidentes
  secondaryWindow: '04:00-06:00', // 22% de incidentes
  safestWindow: '08:00-14:00', // <8% de incidentes
  violenceRate: 0.68, // 68% de atracos con violencia (AMIS/ANTP)
  topTargetProducts: [
    { product: 'Abarrotes', percentage: 37 },
    { product: 'Alimentos perecederos', percentage: 15 },
    { product: 'Combustibles', percentage: 12 },
    { product: 'Electrónicos', percentage: 10 },
    { product: 'Autopartes', percentage: 8 },
  ],
};

// ============================================================
// PROFESSIONAL DISCLAIMER
// ============================================================
export const SECURITY_DISCLAIMER = {
  title: 'AVISO IMPORTANTE',
  lines: [
    'Este análisis es orientativo y no constituye garantía de seguridad.',
    'Las condiciones pueden variar. Verificar alertas actualizadas antes de cada viaje.',
    'Detecta opera servicios de monitoreo y seguimiento preventivo.',
    'En caso de emergencia, la respuesta la ejecutan autoridades competentes (GN, PE).',
  ],
  footer: 'Documento confidencial. Uso exclusivo del destinatario.',
  preparedBy: 'Sistema Detecta - Análisis Automatizado',
};
