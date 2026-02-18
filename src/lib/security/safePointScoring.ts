// Sistema de puntuación de puntos seguros tropicalizado para México
// Basado en estándares EU SSTPA adaptados al contexto local

export type SafePointType = 'gasolinera' | 'base_custodia' | 'area_descanso' | 'punto_encuentro' | 'terminal' | 'cedis' | 'otro';
export type CertificationLevel = 'oro' | 'plata' | 'bronce' | 'precaucion';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'legacy';

export interface SafePointCriteria {
  // Categoría 1: Vigilancia y Presencia (40 pts máx)
  has_security_guard: boolean;      // 15 pts
  has_employees_24h: boolean;       // 10 pts
  has_visible_cctv: boolean;        // 8 pts
  has_military_nearby: boolean;     // 7 pts
  
  // Categoría 2: Visibilidad y Disuasión (35 pts máx)
  is_well_lit: boolean;             // 10 pts
  is_recognized_chain: boolean;     // 8 pts
  has_perimeter_barrier: boolean;   // 10 pts
  has_commercial_activity: boolean; // 7 pts
  
  // Categoría 3: Operacional (25 pts máx)
  truck_fits_inside: boolean;       // 8 pts
  has_alternate_exit: boolean;      // 7 pts
  has_restrooms: boolean;           // 5 pts
  has_cell_signal: boolean;         // 5 pts
}

export interface SafePoint extends SafePointCriteria {
  id: string;
  name: string;
  type: SafePointType;
  lng: number;
  lat: number;
  address?: string;
  corridor_id?: string;
  km_marker?: number;
  total_score: number;
  certification_level: CertificationLevel;
  photo_url?: string;
  notes?: string;
  verification_status: VerificationStatus;
  reported_by?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Pesos de cada criterio
export const CRITERIA_WEIGHTS = {
  // Categoría 1: Vigilancia y Presencia (40 pts)
  has_security_guard: 15,
  has_employees_24h: 10,
  has_visible_cctv: 8,
  has_military_nearby: 7,
  
  // Categoría 2: Visibilidad y Disuasión (35 pts)
  is_well_lit: 10,
  is_recognized_chain: 8,
  has_perimeter_barrier: 10,
  has_commercial_activity: 7,
  
  // Categoría 3: Operacional (25 pts)
  truck_fits_inside: 8,
  has_alternate_exit: 7,
  has_restrooms: 5,
  has_cell_signal: 5,
} as const;

// Umbrales de certificación
export const CERTIFICATION_THRESHOLDS = {
  oro: 75,      // 75-100 pts
  plata: 55,    // 55-74 pts
  bronce: 35,   // 35-54 pts
  precaucion: 0 // 0-34 pts
} as const;

// Etiquetas y colores para UI
export const CERTIFICATION_CONFIG: Record<CertificationLevel, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  oro: {
    label: 'ORO',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Punto altamente seguro, recomendado para espera prolongada'
  },
  plata: {
    label: 'PLATA',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    description: 'Punto seguro, adecuado para paradas cortas'
  },
  bronce: {
    label: 'BRONCE',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Seguridad básica, solo para emergencias'
  },
  precaucion: {
    label: 'PRECAUCIÓN',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Seguridad limitada, evitar si es posible'
  }
};

export const SAFE_POINT_TYPES: Record<SafePointType, { label: string; icon: string }> = {
  gasolinera: { label: 'Gasolinera', icon: 'Fuel' },
  base_custodia: { label: 'Base de Custodia', icon: 'Shield' },
  area_descanso: { label: 'Área de Descanso', icon: 'Coffee' },
  punto_encuentro: { label: 'Punto de Encuentro', icon: 'MapPin' },
  terminal: { label: 'Terminal', icon: 'Warehouse' },
  cedis: { label: 'CEDIS', icon: 'Package' },
  otro: { label: 'Otro', icon: 'Circle' }
};

// Criterios agrupados por categoría para UI
export const CRITERIA_GROUPS = [
  {
    name: 'Vigilancia y Presencia',
    description: 'Presencia de personal de seguridad',
    maxScore: 40,
    criteria: [
      { key: 'has_security_guard', label: '¿Hay vigilante visible?', weight: 15, hint: 'Guardia de seguridad, policía auxiliar' },
      { key: 'has_employees_24h', label: '¿Personal las 24 horas?', weight: 10, hint: 'OXXO, gasolinera, tienda de conveniencia' },
      { key: 'has_visible_cctv', label: '¿Cámaras de seguridad visibles?', weight: 8, hint: 'CCTV funcional y visible' },
      { key: 'has_military_nearby', label: '¿Presencia militar/GN cercana?', weight: 7, hint: 'Guardia Nacional o Ejército a menos de 5km' },
    ]
  },
  {
    name: 'Visibilidad y Disuasión',
    description: 'Características físicas que disuaden delitos',
    maxScore: 35,
    criteria: [
      { key: 'is_well_lit', label: '¿Está bien iluminado de noche?', weight: 10, hint: 'Iluminación en toda el área' },
      { key: 'is_recognized_chain', label: '¿Es cadena comercial reconocida?', weight: 8, hint: 'Pemex, OXXO, 7-Eleven, Walmart' },
      { key: 'has_perimeter_barrier', label: '¿Tiene barda o límite físico?', weight: 10, hint: 'Cerca, muro, reja perimetral' },
      { key: 'has_commercial_activity', label: '¿Actividad comercial constante?', weight: 7, hint: 'Flujo de personas durante el día' },
    ]
  },
  {
    name: 'Operacional',
    description: 'Facilidades para operación de transporte',
    maxScore: 25,
    criteria: [
      { key: 'truck_fits_inside', label: '¿Cabe un tráiler/camión?', weight: 8, hint: 'Espacio suficiente para maniobrar' },
      { key: 'has_alternate_exit', label: '¿Tiene salida alterna?', weight: 7, hint: 'No quedar atrapado, segunda salida' },
      { key: 'has_restrooms', label: '¿Sanitarios disponibles?', weight: 5, hint: 'Baños accesibles' },
      { key: 'has_cell_signal', label: '¿Buena señal celular?', weight: 5, hint: 'Cobertura para comunicación' },
    ]
  }
] as const;

// Calcula el score total basado en los criterios
export function calculateSafePointScore(criteria: SafePointCriteria): number {
  let score = 0;
  
  for (const [key, weight] of Object.entries(CRITERIA_WEIGHTS)) {
    if (criteria[key as keyof SafePointCriteria]) {
      score += weight;
    }
  }
  
  return score;
}

// Determina el nivel de certificación basado en el score
export function getCertificationLevel(score: number): CertificationLevel {
  if (score >= CERTIFICATION_THRESHOLDS.oro) return 'oro';
  if (score >= CERTIFICATION_THRESHOLDS.plata) return 'plata';
  if (score >= CERTIFICATION_THRESHOLDS.bronce) return 'bronce';
  return 'precaucion';
}

// Calcula scores por categoría para visualización
export function calculateCategoryScores(criteria: SafePointCriteria): {
  vigilancia: { score: number; max: number };
  visibilidad: { score: number; max: number };
  operacional: { score: number; max: number };
} {
  return {
    vigilancia: {
      score: (criteria.has_security_guard ? 15 : 0) +
             (criteria.has_employees_24h ? 10 : 0) +
             (criteria.has_visible_cctv ? 8 : 0) +
             (criteria.has_military_nearby ? 7 : 0),
      max: 40
    },
    visibilidad: {
      score: (criteria.is_well_lit ? 10 : 0) +
             (criteria.is_recognized_chain ? 8 : 0) +
             (criteria.has_perimeter_barrier ? 10 : 0) +
             (criteria.has_commercial_activity ? 7 : 0),
      max: 35
    },
    operacional: {
      score: (criteria.truck_fits_inside ? 8 : 0) +
             (criteria.has_alternate_exit ? 7 : 0) +
             (criteria.has_restrooms ? 5 : 0) +
             (criteria.has_cell_signal ? 5 : 0),
      max: 25
    }
  };
}

// Genera recomendaciones basadas en criterios faltantes
export function getImprovementRecommendations(criteria: SafePointCriteria): string[] {
  const recommendations: string[] = [];
  
  // Priorizar criterios de alto peso que faltan
  if (!criteria.has_security_guard) {
    recommendations.push('Agregar vigilante visible (+15 pts)');
  }
  if (!criteria.has_perimeter_barrier) {
    recommendations.push('Instalar barrera perimetral (+10 pts)');
  }
  if (!criteria.is_well_lit) {
    recommendations.push('Mejorar iluminación nocturna (+10 pts)');
  }
  if (!criteria.has_employees_24h) {
    recommendations.push('Asegurar personal 24 horas (+10 pts)');
  }
  
  return recommendations.slice(0, 3); // Top 3 recomendaciones
}

// Calcula distancia entre dos puntos (Haversine)
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Encuentra puntos seguros cercanos a una coordenada
export function findNearbySafePoints(
  safePoints: SafePoint[],
  lat: number,
  lng: number,
  radiusKm: number = 5
): (SafePoint & { distance: number })[] {
  return safePoints
    .map(point => ({
      ...point,
      distance: calculateDistance(lat, lng, point.lat, point.lng)
    }))
    .filter(point => point.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}
