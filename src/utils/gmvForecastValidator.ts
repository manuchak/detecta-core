// GMV Forecast Validation and Coherence System
import { DynamicAOV, IntraMonthProjection, WeeklyPattern } from './weeklyPatternAnalysis';

export interface ForecastCoherenceReport {
  isCoherent: boolean;
  servicesProjection: number;
  gmvProjectionFromServices: number;
  gmvProjectionDirect: number;
  aovImplied: number;
  aovExpected: number;
  aovDeviation: number;
  alerts: string[];
  recommendations: string[];
  confidence: 'Alta' | 'Media' | 'Baja';
  methodology: string;
}

export interface EnhancedGMVForecast {
  monthlyGMV: number;
  monthlyServices: number;
  annualGMV: number;
  annualServices: number;
  aov: number;
  confidence: number;
  methodology: string[];
  validation: ForecastCoherenceReport;
  components: {
    weeklyPattern: number;
    intraMonth: number;
    servicesAOV: number;
    momentum: number;
  };
}

/**
 * Validates coherence between services and GMV forecasts
 */
export function validateForecastCoherence(
  servicesProjection: number,
  gmvProjection: number,
  dynamicAOV: DynamicAOV,
  intraMonthProjection: IntraMonthProjection
): ForecastCoherenceReport {
  
  console.log('🔍 VALIDACIÓN DE COHERENCIA - Iniciando análisis...');
  
  const alerts: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate AOV implications
  const aovImplied = servicesProjection > 0 ? gmvProjection / servicesProjection : 0;
  const aovExpected = dynamicAOV.currentMonthAOV > 0 ? dynamicAOV.currentMonthAOV : dynamicAOV.historicalAOV;
  const aovDeviation = aovExpected > 0 ? ((aovImplied - aovExpected) / aovExpected) * 100 : 0;
  
  // Calculate GMV from services approach
  const gmvProjectionFromServices = servicesProjection * aovExpected;
  
  // Coherence checks
  let isCoherent = true;
  let confidence: 'Alta' | 'Media' | 'Baja' = 'Alta';
  
  // Check 1: AOV deviation
  if (Math.abs(aovDeviation) > 15) {
    isCoherent = false;
    confidence = 'Baja';
    alerts.push(`🚨 AOV implícito (${aovImplied.toFixed(0)}) difiere ${aovDeviation.toFixed(1)}% del esperado (${aovExpected.toFixed(0)})`);
    recommendations.push('Revisar consistencia entre pronósticos de servicios y GMV');
  }
  
  // Check 2: GMV consistency
  const gmvDeviation = Math.abs(gmvProjection - gmvProjectionFromServices) / gmvProjectionFromServices * 100;
  if (gmvDeviation > 20) {
    isCoherent = false;
    confidence = 'Baja';
    alerts.push(`⚠️ Inconsistencia GMV: Directo ${(gmvProjection/1000000).toFixed(1)}M vs Servicios×AOV ${(gmvProjectionFromServices/1000000).toFixed(1)}M`);
    recommendations.push('Alinear pronósticos usando AOV dinámico como referencia');
  }
  
  // Check 3: Minimum threshold (user's business intuition)
  const firstWeekMinimum = 1600000; // $1.6M first week implies $6.5M+ month
  if (intraMonthProjection.projectedWeekEnd >= firstWeekMinimum && gmvProjection < 6500000) {
    alerts.push(`📈 GMV proyectado (${(gmvProjection/1000000).toFixed(1)}M) parece bajo considerando primera semana fuerte`);
    recommendations.push('Considerar ajuste al alza basado en momentum de primera semana');
    confidence = confidence === 'Alta' ? 'Media' : confidence;
  }
  
  // Check 4: Historical pattern validation
  if (intraMonthProjection.confidence === 'Alta' && Math.abs(gmvProjection - intraMonthProjection.projectedMonthEnd) / intraMonthProjection.projectedMonthEnd > 0.25) {
    alerts.push(`🔄 Divergencia con proyección intra-mes de alta confianza`);
    recommendations.push('Dar mayor peso a la proyección intra-mes por su alta confianza');
    confidence = confidence === 'Alta' ? 'Media' : confidence;
  }
  
  // Positive signals
  if (isCoherent && confidence === 'Alta') {
    recommendations.push('✅ Pronóstico coherente y bien calibrado');
  }
  
  const methodology = `Validación cruzada: Servicios×AOV vs GMV directo vs Intra-mes`;
  
  console.log('🎯 RESULTADO VALIDACIÓN:', {
    isCoherent,
    servicesProjection,
    gmvProjectionFromServices: `$${(gmvProjectionFromServices/1000000).toFixed(1)}M`,
    gmvProjectionDirect: `$${(gmvProjection/1000000).toFixed(1)}M`,
    aovImplied: `$${aovImplied.toFixed(0)}`,
    aovExpected: `$${aovExpected.toFixed(0)}`,
    aovDeviation: `${aovDeviation.toFixed(1)}%`,
    confidence,
    alertsCount: alerts.length
  });
  
  return {
    isCoherent,
    servicesProjection,
    gmvProjectionFromServices,
    gmvProjectionDirect: gmvProjection,
    aovImplied,
    aovExpected,
    aovDeviation,
    alerts,
    recommendations,
    confidence,
    methodology
  };
}

/**
 * Creates enhanced GMV forecast using all methodologies
 */
export function createEnhancedGMVForecast(
  baseServicesProjection: number,
  baseGmvProjection: number,
  weeklyPatterns: WeeklyPattern,
  intraMonthProjection: IntraMonthProjection,
  dynamicAOV: DynamicAOV
): EnhancedGMVForecast {
  
  console.log('🚀 FORECAST GMV MEJORADO - Iniciando síntesis...');
  
  // Component 1: Weekly pattern projection
  const weeklyPatternGMV = intraMonthProjection.projectedMonthEnd;
  
  // Component 2: Intra-month direct projection  
  const intraMonthGMV = intraMonthProjection.projectedMonthEnd;
  
  // Component 3: Services × AOV approach
  const servicesAOVGmv = baseServicesProjection * dynamicAOV.currentMonthAOV;
  
  // Component 4: Momentum adjustment (CRITICAL - user's hypothesis with bounds)
  let momentumGMV = baseGmvProjection;
  if (intraMonthProjection.projectedWeekEnd >= 1600000) { // Strong first week ($1.6M+)
    // User's reasoning: "primera semana floja + $1.6M = mínimo $6.8M" BUT with realistic ceiling
    const targetGMV = Math.max(baseGmvProjection, weeklyPatternGMV, 6800000);
    momentumGMV = Math.min(targetGMV, 11000000); // Cap at $11M for realism
    console.log('🎯 MOMENTUM CRÍTICO APLICADO (CON LÍMITES):', {
      firstWeek: `$${(intraMonthProjection.projectedWeekEnd/1000000).toFixed(1)}M`,
      baseProjection: `$${(baseGmvProjection/1000000).toFixed(1)}M`,
      weeklyPattern: `$${(weeklyPatternGMV/1000000).toFixed(1)}M`,
      targetGMV: `$${(targetGMV/1000000).toFixed(1)}M`,
      momentumFinal: `$${(momentumGMV/1000000).toFixed(1)}M`
    });
  }
  
  console.log('📊 COMPONENTES DEL FORECAST:', {
    weeklyPatternGMV: `$${(weeklyPatternGMV/1000000).toFixed(1)}M`,
    intraMonthGMV: `$${(intraMonthGMV/1000000).toFixed(1)}M`,  
    servicesAOVGmv: `$${(servicesAOVGmv/1000000).toFixed(1)}M`,
    momentumGMV: `$${(momentumGMV/1000000).toFixed(1)}M`,
    baseGmvProjection: `$${(baseGmvProjection/1000000).toFixed(1)}M`
  });
  
  // Dynamic weighting based on confidence levels
  const weights = calculateDynamicWeights(weeklyPatterns, intraMonthProjection, dynamicAOV);
  
  // Final weighted forecast
  const rawGMV = Math.round(
    (weeklyPatternGMV * weights.weeklyPattern) +
    (intraMonthGMV * weights.intraMonth) +
    (servicesAOVGmv * weights.servicesAOV) +
    (momentumGMV * weights.momentum)
  );
  
  // REALISM VALIDATION - Critical bounds check
  const finalGMV = Math.min(rawGMV, 12000000); // Absolute ceiling $12M
  const finalGMV_floored = Math.max(finalGMV, 3500000); // Absolute floor $3.5M
  
  // Recalculate services with safe AOV
  const safeAOV = dynamicAOV.currentMonthAOV > 0 && dynamicAOV.currentMonthAOV < 20000 
    ? dynamicAOV.currentMonthAOV 
    : 6350; // Fallback to known average
  
  const finalServices = Math.round(finalGMV_floored / safeAOV);
  const finalAOV = finalGMV_floored / finalServices;
  
  console.log('🔍 VALIDACIÓN DE REALISMO:', {
    rawGMV: `$${(rawGMV/1000000).toFixed(1)}M`,
    finalGMV: `$${(finalGMV_floored/1000000).toFixed(1)}M`,
    finalServices,
    safeAOV: `$${safeAOV.toFixed(0)}`,
    finalAOV: `$${finalAOV.toFixed(0)}`,
    wasAdjusted: rawGMV !== finalGMV_floored
  });
  
  // Calculate confidence
  const confidence = calculateOverallConfidence(weeklyPatterns, intraMonthProjection, dynamicAOV);
  
  // Validate coherence
  const validation = validateForecastCoherence(finalServices, finalGMV_floored, dynamicAOV, intraMonthProjection);
  
  // Apply final adjustments if validation suggests
  let adjustedGMV = finalGMV_floored;
  let adjustedServices = finalServices;
  
  if (!validation.isCoherent && validation.confidence === 'Baja') {
    // Use services × AOV as more reliable approach
    adjustedGMV = validation.gmvProjectionFromServices;
    adjustedServices = Math.round(adjustedGMV / dynamicAOV.currentMonthAOV);
  }
  
  const methodology = [
    `Ensemble híbrido: ${weights.weeklyPattern > 0.3 ? 'Patrones semanales' : ''}`,
    `${weights.intraMonth > 0.3 ? 'Proyección intra-mes' : ''}`,
    `${weights.servicesAOV > 0.3 ? 'Servicios×AOV' : ''}`,
    `${weights.momentum > 0.3 ? 'Ajuste momentum' : ''}`.trim(),
    validation.isCoherent ? 'Validado coherente' : 'Ajustado por coherencia'
  ].filter(m => m.length > 0);
  
  console.log('🎯 FORECAST FINAL MEJORADO:', {
    finalGMV: `$${(adjustedGMV/1000000).toFixed(1)}M`,
    finalServices: adjustedServices,
    finalAOV: `$${finalAOV.toFixed(0)}`,
    confidence: `${(confidence * 100).toFixed(0)}%`,
    validation: validation.isCoherent ? '✅ Coherente' : '⚠️ Ajustado',
    methodology: methodology.slice(0, 2).join(', ')
  });
  
  return {
    monthlyGMV: adjustedGMV,
    monthlyServices: adjustedServices,
    annualGMV: adjustedGMV * 12, // Simplified annual projection
    annualServices: adjustedServices * 12,
    aov: finalAOV,
    confidence,
    methodology,
    validation,
    components: {
      weeklyPattern: weeklyPatternGMV,
      intraMonth: intraMonthGMV,
      servicesAOV: servicesAOVGmv,
      momentum: momentumGMV
    }
  };
}

// Helper functions
function calculateDynamicWeights(
  weeklyPatterns: WeeklyPattern,
  intraMonthProjection: IntraMonthProjection,
  dynamicAOV: DynamicAOV
): { weeklyPattern: number; intraMonth: number; servicesAOV: number; momentum: number } {
  
  let weights = {
    weeklyPattern: 0.25,
    intraMonth: 0.35,
    servicesAOV: 0.25,
    momentum: 0.15
  };
  
  // Boost intra-month if high confidence
  if (intraMonthProjection.confidence === 'Alta') {
    weights.intraMonth += 0.15;
    weights.weeklyPattern -= 0.10;
    weights.servicesAOV -= 0.05;
  }
  
  // Boost weekly patterns if good confidence
  if (weeklyPatterns.confidence > 0.7) {
    weights.weeklyPattern += 0.10;
    weights.momentum -= 0.10;
  }
  
  // Boost AOV method if AOV is stable
  if (!dynamicAOV.isSignificantChange) {
    weights.servicesAOV += 0.10;
    weights.weeklyPattern -= 0.05;
    weights.momentum -= 0.05;
  }
  
  // Strong first week = boost momentum
  if (intraMonthProjection.projectedWeekEnd >= 1600000) {
    weights.momentum += 0.15;
    weights.weeklyPattern -= 0.10;
    weights.servicesAOV -= 0.05;
  }
  
  // Normalize to ensure sum = 1
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  Object.keys(weights).forEach(key => {
    weights[key as keyof typeof weights] = weights[key as keyof typeof weights] / total;
  });
  
  return weights;
}

function calculateOverallConfidence(
  weeklyPatterns: WeeklyPattern,
  intraMonthProjection: IntraMonthProjection,
  dynamicAOV: DynamicAOV
): number {
  
  let confidence = 0.7; // Base confidence
  
  // Weekly patterns confidence
  confidence += weeklyPatterns.confidence * 0.2;
  
  // Intra-month confidence
  if (intraMonthProjection.confidence === 'Alta') confidence += 0.15;
  else if (intraMonthProjection.confidence === 'Media') confidence += 0.05;
  else confidence -= 0.05;
  
  // AOV stability
  if (!dynamicAOV.isSignificantChange) confidence += 0.1;
  else confidence -= 0.1;
  
  // Strong first week provides confidence
  if (intraMonthProjection.projectedWeekEnd >= 1600000) {
    confidence += 0.1;
  }
  
  return Math.max(0.3, Math.min(0.95, confidence));
}