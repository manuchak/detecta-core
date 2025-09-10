// Servicio de mapeo inteligente para columnas CSV
import { toast } from '@/hooks/use-toast';

interface MappingScore {
  csvField: string;
  dbField: string;
  score: number;
  category: string;
}

interface MappingResult {
  mapping: Record<string, string>;
  confidence: number;
  suggestions: MappingScore[];
}

// Todas las opciones de campos de base de datos organizadas por categoría
const DATABASE_FIELDS = {
  'Identificación': [
    'id_servicio', 'gm_transport_id', 'folio_cliente', 'id_custodio', 'id_cotizacion'
  ],
  'Cliente y Servicio': [
    'nombre_cliente', 'tipo_servicio', 'estado', 'local_foraneo', 'ruta'
  ],
  'Ubicaciones': [
    'origen', 'destino'
  ],
  'Fechas y Horarios': [
    'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'duracion_estimada', 'updated_time'
  ],
  'Personal': [
    'custodio_nombre', 'custodio_telefono', 'custodio_email', 'custodio_especialidad', 
    'custodio_certificaciones', 'supervisor_asignado'
  ],
  'Vehículo': [
    'vehiculo_modelo', 'vehiculo_marca', 'vehiculo_año', 'vehiculo_placas', 'vehiculo_color',
    'vehiculo_capacidad', 'vehiculo_tipo'
  ],
  'Monitoreo': [
    'dispositivo_gps_id', 'sim_card_numero', 'plataforma_monitoreo', 'frecuencia_reporte'
  ],
  'Financiero': [
    'monto_servicio', 'monto_total', 'moneda', 'forma_pago', 'status_pago',
    'comision_custodio', 'comision_empresa'
  ],
  'Documentación': [
    'documentos_requeridos', 'documentos_entregados', 'evidencia_fotografica',
    'reporte_inicial', 'reporte_final'
  ],
  'Observaciones': [
    'observaciones', 'requerimientos_especiales', 'restricciones', 'instrucciones_cliente'
  ]
};

// Palabras clave y sinónimos para mejorar el matching
const FIELD_KEYWORDS: Record<string, string[]> = {
  'id_servicio': ['id_servicio', 'servicio_id', 'service_id', 'id', 'servicio', 'service'],
  'gm_transport_id': ['gm_transport_id', 'transport_id', 'gm_id', 'transport', 'gm'],
  'folio_cliente': ['folio_cliente', 'folio', 'cliente_folio', 'client_folio', 'numero_cliente'],
  'id_custodio': ['id_custodio', 'custodio_id', 'custodian_id', 'custodio', 'guardian'],
  'nombre_cliente': ['nombre_cliente', 'cliente_nombre', 'client_name', 'cliente', 'client'],
  'tipo_servicio': ['tipo_servicio', 'service_type', 'tipo', 'servicio_tipo', 'service'],
  'estado': ['estado', 'status', 'state', 'situacion'],
  'origen': ['origen', 'origin', 'pickup', 'desde', 'from', 'salida'],
  'destino': ['destino', 'destination', 'delivery', 'hasta', 'to', 'llegada'],
  'fecha_inicio': ['fecha_inicio', 'start_date', 'inicio', 'fecha_salida', 'departure_date'],
  'fecha_fin': ['fecha_fin', 'end_date', 'fin', 'fecha_llegada', 'arrival_date'],
  'hora_inicio': ['hora_inicio', 'start_time', 'hora_salida', 'departure_time'],
  'hora_fin': ['hora_fin', 'end_time', 'hora_llegada', 'arrival_time'],
  'custodio_nombre': ['custodio_nombre', 'nombre_custodio', 'guardian_name', 'custodian_name'],
  'custodio_telefono': ['custodio_telefono', 'telefono_custodio', 'guardian_phone', 'phone_custodio'],
  'vehiculo_modelo': ['vehiculo_modelo', 'modelo', 'model', 'vehicle_model'],
  'vehiculo_marca': ['vehiculo_marca', 'marca', 'brand', 'vehicle_brand'],
  'vehiculo_placas': ['vehiculo_placas', 'placas', 'license_plate', 'plate'],
  'monto_servicio': ['monto_servicio', 'amount', 'precio', 'price', 'cost', 'costo'],
  'updated_time': ['updated_time', 'fecha_actualizacion', 'last_updated', 'modified', 'actualizado']
};

/**
 * Calcula la similitud entre dos cadenas usando distancia de Levenshtein normalizada
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  return (maxLen - levenshteinDistance(s1, s2)) / maxLen;
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calcula el puntaje de mapeo entre un campo CSV y un campo de base de datos
 */
function calculateMappingScore(csvField: string, dbField: string): number {
  const csvLower = csvField.toLowerCase().trim();
  const dbLower = dbField.toLowerCase().trim();
  
  // Coincidencia exacta
  if (csvLower === dbLower) return 1.0;
  
  // Verificar palabras clave conocidas
  const keywords = FIELD_KEYWORDS[dbField] || [];
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (csvLower === keywordLower) return 0.95;
    if (csvLower.includes(keywordLower) || keywordLower.includes(csvLower)) {
      return 0.8 + (calculateSimilarity(csvLower, keywordLower) * 0.15);
    }
  }
  
  // Similitud general mejorada
  const similarity = calculateSimilarity(csvField, dbField);
  
  // Bonus por subcadenas comunes - mejorado
  const csvParts = csvLower.split(/[_\-\s\.]/);
  const dbParts = dbLower.split(/[_\-\s\.]/);
  let commonParts = 0;
  let exactMatches = 0;
  
  for (const csvPart of csvParts) {
    if (csvPart.length > 1) { // Reducir longitud mínima
      for (const dbPart of dbParts) {
        if (dbPart.length > 1) {
          if (csvPart === dbPart) {
            exactMatches++;
            commonParts++;
          } else if (csvPart.includes(dbPart) || dbPart.includes(csvPart)) {
            commonParts += 0.5;
          }
        }
      }
    }
  }
  
  const partsBonus = Math.min(commonParts / Math.max(csvParts.length, dbParts.length), 0.4);
  const exactBonus = exactMatches > 0 ? 0.2 : 0;
  
  // Bonus adicional por patrones comunes
  let patternBonus = 0;
  if (csvLower.includes('id') && dbLower.includes('id')) patternBonus += 0.2;
  if (csvLower.includes('fecha') && dbLower.includes('fecha')) patternBonus += 0.2;
  if (csvLower.includes('nombre') && dbLower.includes('nombre')) patternBonus += 0.2;
  if (csvLower.includes('telefono') && dbLower.includes('telefono')) patternBonus += 0.2;
  if (csvLower.includes('email') && dbLower.includes('email')) patternBonus += 0.2;
  
  return Math.min(similarity + partsBonus + exactBonus + patternBonus, 0.95);
}

/**
 * Genera mapeo inteligente automático basado en similitud de nombres
 */
export function generateIntelligentMapping(csvFields: string[]): MappingResult {
  console.log('🔍 Iniciando mapeo inteligente con campos CSV:', csvFields);
  
  const allDbFields = Object.values(DATABASE_FIELDS).flat();
  const allScores: MappingScore[] = [];
  
  // Calcular puntajes para todas las combinaciones
  for (const csvField of csvFields) {
    for (const [category, fields] of Object.entries(DATABASE_FIELDS)) {
      for (const dbField of fields) {
        const score = calculateMappingScore(csvField, dbField);
        if (score > 0.15) { // Reducir umbral para considerar más opciones
          allScores.push({
            csvField,
            dbField,
            score,
            category
          });
        }
      }
    }
  }
  
  // Ordenar por puntaje descendente
  allScores.sort((a, b) => b.score - a.score);
  
  console.log('📊 Top 10 coincidencias encontradas:', allScores.slice(0, 10));
  
  // Crear mapeo evitando duplicados - reducir umbral de confianza
  const mapping: Record<string, string> = {};
  const usedDbFields = new Set<string>();
  const usedCsvFields = new Set<string>();
  
  for (const scoreEntry of allScores) {
    if (!usedDbFields.has(scoreEntry.dbField) && !usedCsvFields.has(scoreEntry.csvField)) {
      if (scoreEntry.score >= 0.3) { // Reducir umbral de 0.5 a 0.3
        mapping[scoreEntry.csvField] = scoreEntry.dbField;
        usedDbFields.add(scoreEntry.dbField);
        usedCsvFields.add(scoreEntry.csvField);
        console.log(`✅ Mapeo: ${scoreEntry.csvField} -> ${scoreEntry.dbField} (score: ${scoreEntry.score.toFixed(3)})`);
      }
    }
  }
  
  console.log('🎯 Mapeo final generado:', mapping);
  
  // Calcular confianza general
  const totalPossibleMappings = Math.min(csvFields.length, allDbFields.length);
  const actualMappings = Object.keys(mapping).length;
  const avgScore = Object.keys(mapping).length > 0 
    ? allScores
        .filter(s => mapping[s.csvField] === s.dbField)
        .reduce((sum, s) => sum + s.score, 0) / Object.keys(mapping).length
    : 0;
  
  const confidence = actualMappings > 0 ? (actualMappings / Math.min(csvFields.length, 10)) * avgScore : 0;
  
  console.log(`📈 Confianza calculada: ${confidence} (${actualMappings} campos mapeados de ${csvFields.length})`);
  
  return {
    mapping,
    confidence,
    suggestions: allScores.slice(0, 20) // Top 20 sugerencias
  };
}

export function applyIntelligentMapping(
  csvFields: string[],
  onMappingUpdate: (mapping: Record<string, string>) => void
): void {
  try {
    console.log('🚀 Aplicando mapeo inteligente...');
    const result = generateIntelligentMapping(csvFields);
    
    onMappingUpdate(result.mapping);
    
    const mappedCount = Object.keys(result.mapping).length;
    const confidencePercent = Math.round((result.confidence || 0) * 100);
    
    if (mappedCount === 0) {
      // Si no se encontraron mapeos, mostrar sugerencias
      console.log('⚠️ No se encontraron mapeos automáticos');
      console.log('📋 Campos CSV disponibles:', csvFields);
      console.log('💡 Mejores coincidencias encontradas:', result.suggestions.slice(0, 5));
      
      toast({
        title: "⚠️ Sin Mapeos Automáticos",
        description: `No se encontraron coincidencias confiables. Revisa la consola para ver sugerencias o configura manualmente.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✨ Mapeo Automático Aplicado",
        description: `Se mapearon ${mappedCount} campos con ${confidencePercent}% de confianza. Revisa y ajusta según sea necesario.`,
      });
    }
    
  } catch (error) {
    console.error('❌ Error en mapeo inteligente:', error);
    toast({
      title: "Error en Mapeo Automático",
      description: "Ocurrió un error al generar el mapeo automático. Intenta mapear manualmente.",
      variant: "destructive"
    });
  }
}