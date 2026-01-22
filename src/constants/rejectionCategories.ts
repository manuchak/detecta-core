/**
 * Catálogo centralizado de categorías de rechazo
 * Extraído de CustodianContactDialog para reutilización en dashboards y analytics
 */

export interface RejectionCategory {
  label: string;
  reasons: string[];
  requiresUnavailability?: string[];
  icon?: string;
  color?: string;
}

export const REJECTION_CATEGORIES: Record<string, RejectionCategory> = {
  'disponibilidad_personal': {
    label: 'Disponibilidad Personal',
    reasons: [
      'Asuntos familiares',
      'Cita médica',
      'Compromiso familiar',
      'Custodio cansado',
      'Enfermo',
      'Familiar enfermo',
      'Temas personales',
      'Vacaciones'
    ],
    requiresUnavailability: ['Enfermo', 'Familiar enfermo', 'Vacaciones', 'Cita médica'],
    icon: 'User',
    color: 'hsl(262 83% 58%)' // Purple
  },
  'problemas_vehiculo': {
    label: 'Problemas del Vehículo',
    reasons: [
      'Auto en taller',
      'Falla mecánica',
      'No circula',
      'Va a verificar su auto',
      'Vehículo en servicio'
    ],
    requiresUnavailability: ['Auto en taller', 'Falla mecánica', 'Vehículo en servicio'],
    icon: 'Car',
    color: 'hsl(25 95% 53%)' // Orange
  },
  'preferencias_servicio': {
    label: 'Preferencias del Servicio',
    reasons: [
      'Cancela servicio',
      'Dáselo a otro compañero',
      'Me espero a otro servicio mejor',
      'No quiere servicio con armado',
      'Quiere solo que salga de la CDMX',
      'Solo quiere servicio foráneo'
    ],
    icon: 'Settings',
    color: 'hsl(199 89% 48%)' // Blue
  },
  'limitaciones_geograficas': {
    label: 'Limitaciones Geográficas/Operativas',
    reasons: [
      'Distancia del servicio',
      'No se encuentra en la ciudad',
      'No va a Nuevo Laredo',
      'Cita en el SAT'
    ],
    requiresUnavailability: ['No se encuentra en la ciudad', 'Cita en el SAT'],
    icon: 'MapPin',
    color: 'hsl(142 71% 45%)' // Green
  },
  'problemas_economicos': {
    label: 'Problemas Económicos/Documentales',
    reasons: [
      'Costo del servicio',
      'No tengo capital',
      'Documentación incompleta',
      'No tiene su documentación completa'
    ],
    requiresUnavailability: ['Documentación incompleta', 'No tiene su documentación completa'],
    icon: 'DollarSign',
    color: 'hsl(45 93% 47%)' // Amber
  },
  'comunicacion_otros': {
    label: 'Comunicación/Otros',
    reasons: [
      'No disponible',
      'No responde el medio',
      'Otro'
    ],
    icon: 'MessageCircle',
    color: 'hsl(0 0% 45%)' // Gray
  }
};

// Flattened list of all reasons with their category
export const ALL_REJECTION_REASONS = Object.entries(REJECTION_CATEGORIES).flatMap(
  ([categoryId, category]) => 
    category.reasons.map(reason => ({
      categoryId,
      categoryLabel: category.label,
      reason,
      requiresUnavailability: category.requiresUnavailability?.includes(reason) || false
    }))
);

// Get category from reason string (for legacy data parsing)
export function getCategoryFromReason(reasonString: string): { categoryId: string; categoryLabel: string } | null {
  for (const [categoryId, category] of Object.entries(REJECTION_CATEGORIES)) {
    if (category.reasons.some(r => reasonString.includes(r))) {
      return { categoryId, categoryLabel: category.label };
    }
  }
  // Check if the string contains the category label directly
  for (const [categoryId, category] of Object.entries(REJECTION_CATEGORIES)) {
    if (reasonString.includes(category.label)) {
      return { categoryId, categoryLabel: category.label };
    }
  }
  return null;
}

// Category colors for charts
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  'disponibilidad_personal': 'hsl(262, 83%, 58%)',
  'problemas_vehiculo': 'hsl(25, 95%, 53%)',
  'preferencias_servicio': 'hsl(199, 89%, 48%)',
  'limitaciones_geograficas': 'hsl(142, 71%, 45%)',
  'problemas_economicos': 'hsl(45, 93%, 47%)',
  'comunicacion_otros': 'hsl(0, 0%, 45%)'
};
