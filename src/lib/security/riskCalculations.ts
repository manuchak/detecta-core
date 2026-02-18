// ============================================================================
// Risk Calculation Engine (ISO 31000 / ISO 28000 / IEC 31010 compliant)
// Adapted from Hermes for Detecta Security Module
// ============================================================================

import type { 
  MatrixConfig, 
  ImpactCalculationMethod,
  RiskLevel 
} from '@/types/security/risk';

export interface ConsequenceScores {
  consequencePeople?: number;
  consequenceOperation?: number;
  consequenceFinancial?: number;
  consequenceReputation?: number;
}

export interface RiskCalculationInput {
  consequencePeople?: number;
  consequenceOperation?: number;
  consequenceFinancial?: number;
  consequenceReputation?: number;
  probability?: number;
  matrixConfig: MatrixConfig;
}

export interface RiskCalculationResult {
  totalImpact: number;
  inherentRiskScore: number;
  inherentRiskLevel: RiskLevel;
  riskColor: string;
  suggestedAcceptability: 'aceptable' | 'tolerable' | 'no_aceptable';
  suggestedPriority: 'baja' | 'media' | 'alta' | 'critica';
  calculationDetail: {
    method: ImpactCalculationMethod;
    impactBreakdown: ConsequenceScores;
    weights?: Record<string, number>;
    formula: string;
  };
}

export function calculateTotalImpact(
  consequences: ConsequenceScores,
  config: MatrixConfig
): number {
  const { consequencePeople = 0, consequenceOperation = 0, consequenceFinancial = 0, consequenceReputation = 0 } = consequences;
  const method = config.impact_calculation_method || 'maximum';
  const weights = config.impact_weights;

  if (method === 'maximum') {
    return Math.max(consequencePeople, consequenceOperation, consequenceFinancial, consequenceReputation);
  } else {
    const weightedSum = 
      (consequencePeople * weights.personas) +
      (consequenceOperation * weights.operacion) +
      (consequenceFinancial * weights.financiero) +
      (consequenceReputation * weights.reputacional);
    return Math.round(weightedSum * 10) / 10;
  }
}

export function getRiskLevel(riskScore: number, config: MatrixConfig): RiskLevel {
  const ranges = config.risk_level_ranges;
  for (const [level, range] of Object.entries(ranges)) {
    if (riskScore >= range.min && riskScore <= range.max) {
      return level as RiskLevel;
    }
  }
  return 'medio';
}

export function getRiskColor(level: RiskLevel, config: MatrixConfig): string {
  return config.risk_level_ranges[level]?.color || '#eab308';
}

export function suggestAcceptability(level: RiskLevel): 'aceptable' | 'tolerable' | 'no_aceptable' {
  switch (level) {
    case 'bajo': return 'aceptable';
    case 'medio': return 'tolerable';
    case 'alto':
    case 'extremo': return 'no_aceptable';
    default: return 'tolerable';
  }
}

export function suggestPriority(level: RiskLevel): 'baja' | 'media' | 'alta' | 'critica' {
  switch (level) {
    case 'bajo': return 'baja';
    case 'medio': return 'media';
    case 'alto': return 'alta';
    case 'extremo': return 'critica';
    default: return 'media';
  }
}

export function calculateRisk(input: RiskCalculationInput): RiskCalculationResult {
  const {
    consequencePeople = 0, consequenceOperation = 0,
    consequenceFinancial = 0, consequenceReputation = 0,
    probability = 0, matrixConfig
  } = input;

  const consequences: ConsequenceScores = { consequencePeople, consequenceOperation, consequenceFinancial, consequenceReputation };
  const totalImpact = calculateTotalImpact(consequences, matrixConfig);
  const inherentRiskScore = probability * totalImpact;
  const inherentRiskLevel = getRiskLevel(inherentRiskScore, matrixConfig);
  const riskColor = getRiskColor(inherentRiskLevel, matrixConfig);
  const method = matrixConfig.impact_calculation_method || 'maximum';
  const formula = method === 'maximum' 
    ? `Impacto Total = MAX(${consequencePeople}, ${consequenceOperation}, ${consequenceFinancial}, ${consequenceReputation}) = ${totalImpact}; Riesgo = ${probability} × ${totalImpact} = ${inherentRiskScore}`
    : `Impacto Total = ponderado = ${totalImpact}; Riesgo = ${probability} × ${totalImpact} = ${inherentRiskScore}`;

  return {
    totalImpact, inherentRiskScore, inherentRiskLevel, riskColor,
    suggestedAcceptability: suggestAcceptability(inherentRiskLevel),
    suggestedPriority: suggestPriority(inherentRiskLevel),
    calculationDetail: { method, impactBreakdown: consequences, weights: method === 'weighted_average' ? matrixConfig.impact_weights : undefined, formula }
  };
}

export function calculateResidualRisk(
  residualProbability: number, residualImpact: number, matrixConfig: MatrixConfig
): Pick<RiskCalculationResult, 'inherentRiskScore' | 'inherentRiskLevel' | 'riskColor' | 'suggestedAcceptability' | 'suggestedPriority'> {
  const residualRiskScore = residualProbability * residualImpact;
  const residualRiskLevel = getRiskLevel(residualRiskScore, matrixConfig);
  const riskColor = getRiskColor(residualRiskLevel, matrixConfig);
  return { inherentRiskScore: residualRiskScore, inherentRiskLevel: residualRiskLevel, riskColor, suggestedAcceptability: suggestAcceptability(residualRiskLevel), suggestedPriority: suggestPriority(residualRiskLevel) };
}

export function validateRiskValuation(input: RiskCalculationInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.probability || input.probability < 1 || input.probability > 5) errors.push('La probabilidad debe estar entre 1 y 5');
  const hasAtLeastOneConsequence = (input.consequencePeople && input.consequencePeople > 0) || (input.consequenceOperation && input.consequenceOperation > 0) || (input.consequenceFinancial && input.consequenceFinancial > 0) || (input.consequenceReputation && input.consequenceReputation > 0);
  if (!hasAtLeastOneConsequence) errors.push('Debe asignar al menos una consecuencia con valor mayor a 0');
  return { valid: errors.length === 0, errors };
}

export function getMatrixCellCoordinates(probability: number, impact: number): { row: number; col: number } {
  return { row: 6 - impact, col: probability - 1 };
}

export function getRiskLevelForCell(row: number, col: number, config: MatrixConfig): RiskLevel {
  const probability = col + 1;
  const impact = 5 - row;
  const riskScore = probability * impact;
  return getRiskLevel(riskScore, config);
}
