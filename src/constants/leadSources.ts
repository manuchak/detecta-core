/**
 * Catálogo centralizado de medios de captación de leads
 * Usado en: EnhancedLeadForm, LeadsInlineFilters, LeadEditDialog
 */

export interface LeadSource {
  value: string;
  label: string;
  category: 'job_portal' | 'social' | 'referral' | 'direct' | 'other';
}

export const LEAD_SOURCES: LeadSource[] = [
  // Portales de empleo
  { value: 'indeed', label: 'Indeed', category: 'job_portal' },
  { value: 'computrabajo', label: 'Computrabajo', category: 'job_portal' },
  { value: 'occ', label: 'OCC Mundial', category: 'job_portal' },
  { value: 'linkedin', label: 'LinkedIn', category: 'job_portal' },
  
  // Redes sociales
  { value: 'facebook', label: 'Facebook', category: 'social' },
  { value: 'whatsapp', label: 'WhatsApp', category: 'social' },
  
  // Referidos
  { value: 'referido', label: 'Referido por Custodio', category: 'referral' },
  
  // Contacto directo
  { value: 'telefono', label: 'Llamada Telefónica', category: 'direct' },
  { value: 'presencial', label: 'Visita Presencial', category: 'direct' },
  
  // Otros
  { value: 'otro', label: 'Otro', category: 'other' },
];

// Para uso en filtros (incluye opción "todas")
export const LEAD_SOURCES_FOR_FILTER = [
  { value: 'all', label: 'Todas' },
  ...LEAD_SOURCES,
];

// Valores legacy que se mantienen para compatibilidad
export const LEGACY_SOURCES = ['form_robusto', 'manual', 'web'];

// Helper para obtener label de una fuente
export function getSourceLabel(value: string): string {
  const source = LEAD_SOURCES.find(s => s.value === value);
  if (source) return source.label;
  
  // Labels para valores legacy
  if (value === 'form_robusto') return 'Formulario Manual';
  if (value === 'manual') return 'Manual';
  if (value === 'web') return 'Web';
  
  return value;
}
