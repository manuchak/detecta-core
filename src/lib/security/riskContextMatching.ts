// Risk Context Matching - Adapted from Hermes for Detecta Security Module
import { Threat, Vulnerability, ExistingControl } from "@/types/security/risk";

// Mapeo de contextos semánticos para filtrado inteligente
export const THREAT_CONTEXT_MAP = {
  transporte_externo: {
    keywords: ['bloqueo', 'carretera', 'asalto', 'robo', 'secuestro', 'manifestación', 'ruta', 'tránsito', 'vial'],
    relevant_vulnerability_types: ['infraestructura', 'procedimental'],
    relevant_control_types: ['preventivo', 'detectivo'],
    vulnerability_keywords: ['ruta', 'validación', 'alternativa', 'comunicación', 'rastreo', 'escolta', 'gps', 'monitoreo', 'trayecto'],
    control_keywords: ['monitoreo', 'gps', 'ruta alternativa', 'protocolo', 'comunicación', 'emergencia', 'rastreo', 'escolta', 'seguimiento']
  },
  recursos_humanos: {
    keywords: ['rotación', 'personal', 'capacitación', 'error humano', 'negligencia', 'empleado', 'operador', 'conductor'],
    relevant_vulnerability_types: ['humano', 'procedimental'],
    relevant_control_types: ['preventivo', 'detectivo'],
    vulnerability_keywords: ['capacitación', 'experiencia', 'supervisión', 'carga', 'estrés', 'entrenamiento', 'conocimiento', 'habilidad'],
    control_keywords: ['entrenamiento', 'supervisión', 'evaluación', 'inducción', 'capacitación', 'certificación', 'formación']
  },
  tecnologia: {
    keywords: ['sistema', 'software', 'hardware', 'ciberseguridad', 'fallo técnico', 'tecnología', 'equipo', 'digital'],
    relevant_vulnerability_types: ['tecnologico', 'infraestructura'],
    relevant_control_types: ['preventivo', 'detectivo', 'correctivo'],
    vulnerability_keywords: ['obsolescencia', 'mantenimiento', 'respaldo', 'acceso', 'actualización', 'backup', 'configuración'],
    control_keywords: ['backup', 'firewall', 'antivirus', 'monitoreo', 'mantenimiento', 'actualización', 'parche', 'redundancia']
  },
  infraestructura_operacional: {
    keywords: ['instalación', 'almacén', 'edificio', 'equipo', 'maquinaria', 'patio', 'cedis', 'bodega', 'instalaciones'],
    relevant_vulnerability_types: ['infraestructura', 'procedimental'],
    relevant_control_types: ['preventivo', 'correctivo'],
    vulnerability_keywords: ['mantenimiento', 'acceso', 'protección', 'obsolescencia', 'capacidad', 'seguridad física', 'deterioro'],
    control_keywords: ['mantenimiento', 'inspección', 'seguridad física', 'redundancia', 'vigilancia', 'control acceso']
  },
  seguridad_robo: {
    keywords: ['robo', 'hurto', 'sustracción', 'intrusión', 'delincuencia', 'asalto', 'saqueo', 'pillaje'],
    relevant_vulnerability_types: ['infraestructura', 'procedimental', 'humano'],
    relevant_control_types: ['preventivo', 'detectivo'],
    vulnerability_keywords: ['acceso', 'vigilancia', 'iluminación', 'perímetro', 'control', 'revisión', 'inventario'],
    control_keywords: ['vigilancia', 'cctv', 'alarma', 'escolta', 'control acceso', 'seguridad', 'inventario', 'revisión']
  },
  cumplimiento_legal: {
    keywords: ['regulación', 'normativa', 'legal', 'cumplimiento', 'sanción', 'multa', 'inspección', 'autoridad'],
    relevant_vulnerability_types: ['procedimental', 'humano'],
    relevant_control_types: ['preventivo', 'detectivo'],
    vulnerability_keywords: ['documentación', 'registro', 'procedimiento', 'actualización', 'conocimiento', 'auditoría'],
    control_keywords: ['auditoría', 'revisión', 'documentación', 'certificación', 'procedimiento', 'registro', 'verificación']
  }
};

export interface RelevanceScore {
  item_id: string;
  score: number;
  matched_keywords: string[];
  reason: string;
}

export function calculateRelevanceScore(
  threat: Threat,
  item: Vulnerability | ExistingControl,
  itemType: 'vulnerability' | 'control'
): RelevanceScore {
  let score = 0;
  const matchedKeywords: string[] = [];
  let contextType: string | null = null;
  
  const threatText = `${threat.name} ${threat.description || ''}`.toLowerCase();
  
  for (const [context, config] of Object.entries(THREAT_CONTEXT_MAP)) {
    const keywordMatches = config.keywords.filter(kw => threatText.includes(kw.toLowerCase()));
    if (keywordMatches.length > 0) {
      contextType = context;
      score += keywordMatches.length * 10;
      matchedKeywords.push(...keywordMatches);
      break;
    }
  }
  
  if (!contextType) {
    return { item_id: item.id, score: 5, matched_keywords: [], reason: 'Sin contexto específico detectado' };
  }
  
  const context = THREAT_CONTEXT_MAP[contextType as keyof typeof THREAT_CONTEXT_MAP];
  
  if (itemType === 'vulnerability' && 'vulnerability_type' in item) {
    if (item.vulnerability_type && context.relevant_vulnerability_types.includes(item.vulnerability_type)) {
      score += 20;
    }
  } else if (itemType === 'control' && 'control_type' in item) {
    if (item.control_type && context.relevant_control_types.includes(item.control_type)) {
      score += 20;
    }
  }
  
  const itemText = itemType === 'vulnerability' 
    ? (item as Vulnerability).description.toLowerCase()
    : (`${(item as ExistingControl).name || ''} ${(item as ExistingControl).description || ''}`).toLowerCase();
  
  const relevantKeywords = itemType === 'vulnerability' ? context.vulnerability_keywords : context.control_keywords;
  
  relevantKeywords.forEach(keyword => {
    if (itemText.includes(keyword.toLowerCase())) {
      score += 15;
      if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
    }
  });
  
  let reason = '';
  if (score >= 40) reason = 'Alta relevancia contextual';
  else if (score >= 20) reason = 'Relevancia moderada';
  else if (score >= 10) reason = 'Baja relevancia';
  else reason = 'Relevancia mínima';
  
  return { item_id: item.id, score, matched_keywords: matchedKeywords, reason };
}

export function filterByRelevance<T extends Vulnerability | ExistingControl>(
  threat: Threat,
  items: T[],
  itemType: 'vulnerability' | 'control',
  maxResults: number = 10,
  minScore: number = 10
): Array<{ item: T; score: RelevanceScore }> {
  const scored = items.map(item => ({ item, score: calculateRelevanceScore(threat, item, itemType) }));
  scored.sort((a, b) => b.score.score - a.score.score);
  const relevant = scored.filter(s => s.score.score >= minScore);
  return relevant.length > 0 ? relevant.slice(0, maxResults) : scored.slice(0, Math.min(5, items.length));
}
