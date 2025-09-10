// Servicio mejorado de mapeo inteligente para columnas CSV
import { toast } from '@/hooks/use-toast';
import { CUSTODIAN_SERVICE_FIELDS, getAllFields, FieldDefinition } from '@/config/custodianServiceFields';

interface MappingScore {
  csvField: string;
  dbField: string;
  score: number;
  category: string;
  reason: string;
}

interface MappingResult {
  mapping: Record<string, string>;
  confidence: number;
  suggestions: MappingScore[];
}

interface ContentAnalysis {
  hasId: boolean;
  hasDate: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasNumeric: boolean;
  hasText: boolean;
  isEmpty: boolean;
  sampleValues: string[];
}

/**
 * Analiza una muestra del contenido de una columna CSV para determinar su tipo
 */
function analyzeColumnContent(csvData: any[], columnName: string): ContentAnalysis {
  const sampleSize = Math.min(10, csvData.length);
  const sample = csvData.slice(0, sampleSize).map(row => String(row[columnName] || '').trim());
  
  const analysis: ContentAnalysis = {
    hasId: false,
    hasDate: false,
    hasPhone: false,
    hasEmail: false,
    hasNumeric: false,
    hasText: false,
    isEmpty: false,
    sampleValues: sample.filter(v => v && v !== 'undefined' && v !== 'null')
  };

  // Si no hay datos válidos
  if (analysis.sampleValues.length === 0) {
    analysis.isEmpty = true;
    return analysis;
  }

  for (const value of analysis.sampleValues) {
    // Detectar IDs (números, alfanuméricos con guiones/puntos)
    if (/^[A-Z0-9\-_.]+$/i.test(value) && value.length > 3) {
      analysis.hasId = true;
    }
    
    // Detectar fechas
    if (/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(value) || /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(value)) {
      analysis.hasDate = true;
    }
    
    // Detectar teléfonos
    if (/^\+?[\d\s\-\(\)]{8,15}$/.test(value.replace(/\s/g, ''))) {
      analysis.hasPhone = true;
    }
    
    // Detectar emails
    if (/@/.test(value) && /\.[a-z]{2,}$/i.test(value)) {
      analysis.hasEmail = true;
    }
    
    // Detectar números
    if (/^\d+\.?\d*$/.test(value) && !analysis.hasPhone) {
      analysis.hasNumeric = true;
    }
    
    // Detectar texto general
    if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(value)) {
      analysis.hasText = true;
    }
  }

  return analysis;
}

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
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calcula el puntaje de mapeo mejorado entre un campo CSV y un campo de base de datos
 */
function calculateMappingScore(
  csvField: string, 
  fieldDef: FieldDefinition, 
  contentAnalysis: ContentAnalysis,
  csvData?: any[]
): MappingScore {
  const csvLower = csvField.toLowerCase().trim();
  const dbLower = fieldDef.name.toLowerCase().trim();
  
  let score = 0;
  let reason = '';

  // 1. Coincidencia exacta (puntaje máximo)
  if (csvLower === dbLower) {
    score = 1.0;
    reason = 'Coincidencia exacta de nombre';
  }
  // 2. Verificar palabras clave conocidas
  else if (fieldDef.keywords.some(keyword => csvLower === keyword.toLowerCase())) {
    score = 0.95;
    reason = 'Coincidencia exacta con palabra clave';
  }
  // 3. Verificar patrones regex
  else if (fieldDef.patterns.some(pattern => pattern.test(csvField))) {
    score = 0.9;
    reason = 'Coincidencia con patrón conocido';
  }
  // 4. Búsqueda de subcadenas en palabras clave
  else {
    let bestKeywordScore = 0;
    let bestKeyword = '';
    
    for (const keyword of fieldDef.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      if (csvLower.includes(keywordLower) || keywordLower.includes(csvLower)) {
        const keywordScore = calculateSimilarity(csvLower, keywordLower);
        if (keywordScore > bestKeywordScore) {
          bestKeywordScore = keywordScore;
          bestKeyword = keyword;
        }
      }
    }
    
    if (bestKeywordScore > 0.6) {
      score = 0.7 + (bestKeywordScore * 0.2);
      reason = `Similitud alta con palabra clave: ${bestKeyword}`;
    }
    // 5. Similitud general del nombre
    else {
      const similarity = calculateSimilarity(csvField, fieldDef.name);
      if (similarity > 0.5) {
        score = similarity * 0.6;
        reason = 'Similitud de nombre';
      }
    }
  }

  // Bonificaciones por análisis de contenido
  if (score > 0.2 && !contentAnalysis.isEmpty) {
    let contentBonus = 0;
    let contentReason = '';
    
    // Bonificación por tipo de contenido correcto
    switch (fieldDef.type) {
      case 'text':
        if (fieldDef.name.includes('id') && contentAnalysis.hasId) {
          contentBonus = 0.2;
          contentReason = ' + ID detectado en contenido';
        } else if (fieldDef.name.includes('telefono') && contentAnalysis.hasPhone) {
          contentBonus = 0.25;
          contentReason = ' + Teléfono detectado en contenido';
        } else if (fieldDef.name.includes('email') && contentAnalysis.hasEmail) {
          contentBonus = 0.25;
          contentReason = ' + Email detectado en contenido';
        } else if (contentAnalysis.hasText) {
          contentBonus = 0.1;
          contentReason = ' + Texto detectado';
        }
        break;
        
      case 'numeric':
        if (contentAnalysis.hasNumeric) {
          contentBonus = 0.2;
          contentReason = ' + Número detectado en contenido';
        }
        break;
        
      case 'timestamp':
      case 'date':
        if (contentAnalysis.hasDate) {
          contentBonus = 0.25;
          contentReason = ' + Fecha detectada en contenido';
        }
        break;
    }
    
    // Bonificación por campo requerido
    if (fieldDef.required && score > 0.6) {
      contentBonus += 0.1;
      contentReason += ' + Campo requerido';
    }
    
    score = Math.min(score + contentBonus, 0.98); // Máximo 0.98 para reservar 1.0 para coincidencias exactas
    reason += contentReason;
  }

  // Penalización por contenido vacío en campos importantes
  if (contentAnalysis.isEmpty && fieldDef.required) {
    score *= 0.5;
    reason += ' - Penalizado por contenido vacío en campo requerido';
  }

  return {
    csvField,
    dbField: fieldDef.name,
    score,
    category: fieldDef.category,
    reason
  };
}

/**
 * Genera mapeo inteligente mejorado basado en similitud de nombres y análisis de contenido
 */
export function generateIntelligentMapping(csvFields: string[], csvData?: any[]): MappingResult {
  console.log('🔍 Iniciando mapeo inteligente mejorado con campos CSV:', csvFields);
  console.log('📊 Datos disponibles para análisis:', csvData ? `${csvData.length} filas` : 'Sin datos');
  
  const allFields = getAllFields();
  const allScores: MappingScore[] = [];
  
  // Analizar contenido de cada columna CSV si hay datos disponibles
  const contentAnalyses: Record<string, ContentAnalysis> = {};
  if (csvData && csvData.length > 0) {
    for (const csvField of csvFields) {
      contentAnalyses[csvField] = analyzeColumnContent(csvData, csvField);
      console.log(`📝 Análisis de contenido para "${csvField}":`, contentAnalyses[csvField]);
    }
  }
  
  // Calcular puntajes para todas las combinaciones
  for (const csvField of csvFields) {
    const contentAnalysis = contentAnalyses[csvField] || {
      hasId: false, hasDate: false, hasPhone: false, hasEmail: false,
      hasNumeric: false, hasText: false, isEmpty: true, sampleValues: []
    };
    
    for (const fieldDef of allFields) {
      const scoreData = calculateMappingScore(csvField, fieldDef, contentAnalysis, csvData);
      
      if (scoreData.score > 0.2) { // Umbral mínimo para considerar
        allScores.push(scoreData);
      }
    }
  }
  
  // Ordenar por puntaje descendente
  allScores.sort((a, b) => b.score - a.score);
  
  console.log('📊 Top 10 coincidencias encontradas:', 
    allScores.slice(0, 10).map(s => ({
      mapping: `${s.csvField} -> ${s.dbField}`,
      score: s.score.toFixed(3),
      reason: s.reason
    }))
  );
  
  // Crear mapeo evitando duplicados
  const mapping: Record<string, string> = {};
  const usedDbFields = new Set<string>();
  const usedCsvFields = new Set<string>();
  
  // Primero mapear campos requeridos con mayor prioridad
  const requiredFields = allFields.filter(f => f.required).map(f => f.name);
  const scoresForRequired = allScores.filter(s => requiredFields.includes(s.dbField));
  
  for (const scoreEntry of scoresForRequired) {
    if (!usedDbFields.has(scoreEntry.dbField) && 
        !usedCsvFields.has(scoreEntry.csvField) && 
        scoreEntry.score >= 0.4) {
      
      mapping[scoreEntry.csvField] = scoreEntry.dbField;
      usedDbFields.add(scoreEntry.dbField);
      usedCsvFields.add(scoreEntry.csvField);
      console.log(`✅ Mapeo prioritario (requerido): ${scoreEntry.csvField} -> ${scoreEntry.dbField} (score: ${scoreEntry.score.toFixed(3)}) - ${scoreEntry.reason}`);
    }
  }
  
  // Luego mapear el resto de campos
  for (const scoreEntry of allScores) {
    if (!usedDbFields.has(scoreEntry.dbField) && 
        !usedCsvFields.has(scoreEntry.csvField) && 
        scoreEntry.score >= 0.5) { // Umbral más alto para campos no requeridos
      
      mapping[scoreEntry.csvField] = scoreEntry.dbField;
      usedDbFields.add(scoreEntry.dbField);
      usedCsvFields.add(scoreEntry.csvField);
      console.log(`✅ Mapeo: ${scoreEntry.csvField} -> ${scoreEntry.dbField} (score: ${scoreEntry.score.toFixed(3)}) - ${scoreEntry.reason}`);
    }
  }
  
  console.log('🎯 Mapeo final generado:', mapping);
  
  // Calcular confianza general
  const actualMappings = Object.keys(mapping).length;
  const mappedScores = allScores.filter(s => mapping[s.csvField] === s.dbField);
  const avgScore = mappedScores.length > 0 
    ? mappedScores.reduce((sum, s) => sum + s.score, 0) / mappedScores.length
    : 0;
  
  // Factor de confianza basado en cantidad de mapeos y calidad promedio
  const completenessRatio = Math.min(actualMappings / Math.min(csvFields.length, 15), 1);
  const confidence = actualMappings > 0 ? completenessRatio * avgScore * 0.9 : 0;
  
  // Bonificación si se mapeó el campo requerido
  const hasRequiredField = Object.values(mapping).includes('id_servicio');
  const finalConfidence = hasRequiredField ? Math.min(confidence * 1.1, 1) : confidence;
  
  console.log(`📈 Confianza calculada: ${finalConfidence.toFixed(3)} (${actualMappings} campos mapeados de ${csvFields.length})`);
  console.log(`🔑 Campo requerido mapeado: ${hasRequiredField ? 'Sí' : 'No'}`);
  
  return {
    mapping,
    confidence: finalConfidence,
    suggestions: allScores.slice(0, 30) // Top 30 sugerencias para análisis
  };
}

/**
 * Aplica el mapeo inteligente y muestra feedback al usuario
 */
export function applyIntelligentMapping(
  csvFields: string[],
  onMappingUpdate: (mapping: Record<string, string>) => void,
  csvData?: any[]
): void {
  try {
    console.log('🚀 Aplicando mapeo inteligente mejorado...');
    const result = generateIntelligentMapping(csvFields, csvData);
    
    onMappingUpdate(result.mapping);
    
    const mappedCount = Object.keys(result.mapping).length;
    const confidencePercent = Math.round((result.confidence || 0) * 100);
    const hasRequiredField = Object.values(result.mapping).includes('id_servicio');
    
    if (mappedCount === 0) {
      console.log('⚠️ No se encontraron mapeos automáticos');
      console.log('📋 Campos CSV disponibles:', csvFields);
      console.log('💡 Mejores coincidencias encontradas:', result.suggestions.slice(0, 5));
      
      toast({
        title: "⚠️ Sin Mapeos Automáticos",
        description: `No se encontraron coincidencias confiables entre las columnas CSV y los campos de la base de datos. Revisa la consola para más detalles.`,
        variant: "destructive"
      });
    } else {
      const statusIcon = hasRequiredField ? "✅" : "⚠️";
      const statusMsg = hasRequiredField 
        ? "Campo requerido (id_servicio) mapeado correctamente." 
        : "Falta mapear el campo requerido 'id_servicio'.";
      
      toast({
        title: `${statusIcon} Mapeo Automático Completado`,
        description: `Se mapearon ${mappedCount} campos con ${confidencePercent}% de confianza. ${statusMsg}`,
        variant: hasRequiredField ? "default" : "destructive"
      });
    }
    
  } catch (error) {
    console.error('❌ Error en mapeo inteligente:', error);
    toast({
      title: "❌ Error en Mapeo Automático",
      description: "Ocurrió un error al generar el mapeo automático. Intenta mapear manualmente.",
      variant: "destructive"
    });
  }
}