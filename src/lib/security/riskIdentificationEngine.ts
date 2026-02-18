// Motor de Identificación de Riesgos ISO 31010
// Adapted from Hermes for Detecta Security Module

import { IdentifiedRisk, Threat, RiskCategory, Vulnerability, ExistingControl } from "@/types/security/risk";

export interface CategoryGap {
  categoryId: string;
  categoryName: string;
  identifiedCount: number;
  suggestedCount: number;
  coveragePercentage: number;
  priority: 'low' | 'medium' | 'high';
}

export interface RiskSuggestion {
  threatId: string;
  threatName: string;
  categoryId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ProcessContext {
  processType?: string;
  industry?: string;
  sector?: string;
  organizationId?: string;
}

export class RiskIdentificationEngine {
  generateRiskTitle(threat: Threat, vulnerabilities: Vulnerability[], consequences?: string[]): string {
    const threatName = threat.name;
    if (vulnerabilities.length === 0) return threatName;
    const vulnText = vulnerabilities.slice(0, 2).map(v => v.description.toLowerCase()).join(' y ');
    let title = `${threatName} debido a ${vulnText}`;
    if (consequences && consequences.length > 0) {
      title += `, resultando en ${consequences.slice(0, 2).join(' y ')}`;
    }
    return title;
  }

  generateDetailedDescription(threat: Threat, vulnerabilities: Vulnerability[], controls: ExistingControl[]): string {
    const parts: string[] = [];
    parts.push(`Amenaza: ${threat.description || threat.name}.`);
    if (vulnerabilities.length > 0) {
      parts.push(`\n\nVulnerabilidades identificadas:\n${vulnerabilities.map((v, i) => `${i + 1}. ${v.description}`).join('\n')}`);
    }
    if (controls.length > 0) {
      parts.push(`\n\nControles existentes:\n${controls.map((c, i) => `${i + 1}. ${c.name}${c.description ? ': ' + c.description : ''}`).join('\n')}`);
    }
    return parts.join('');
  }

  analyzeCoverageGaps(identifiedRisks: IdentifiedRisk[], categories: RiskCategory[], context: ProcessContext): CategoryGap[] {
    const categoryCounts = new Map<string, number>();
    identifiedRisks.forEach(risk => {
      const count = categoryCounts.get(risk.category_id) || 0;
      categoryCounts.set(risk.category_id, count + 1);
    });
    const suggestedCounts = this.getSuggestedRiskCounts(context);
    return categories.map(category => {
      const identifiedCount = categoryCounts.get(category.id) || 0;
      const suggestedCount = suggestedCounts[category.name] || 3;
      const coveragePercentage = Math.round((identifiedCount / suggestedCount) * 100);
      let priority: 'low' | 'medium' | 'high' = 'low';
      if (coveragePercentage < 30) priority = 'high';
      else if (coveragePercentage < 70) priority = 'medium';
      return { categoryId: category.id, categoryName: category.name, identifiedCount, suggestedCount, coveragePercentage: Math.min(coveragePercentage, 100), priority };
    });
  }

  private getSuggestedRiskCounts(context: ProcessContext): Record<string, number> {
    const baseCounts: Record<string, number> = {
      "Seguridad Física": 3, "Operacional": 4, "Tecnológico": 3, "Financiero": 2,
      "Reputacional": 2, "Cumplimiento Regulatorio": 2, "Recursos Humanos": 2, "Ambiental": 2
    };
    if (context.industry === "Logística" || context.sector === "Transporte") {
      baseCounts["Seguridad Física"] = 5; baseCounts["Operacional"] = 5; baseCounts["Tecnológico"] = 2;
    }
    return baseCounts;
  }

  suggestNextRisks(context: ProcessContext, identifiedRisks: IdentifiedRisk[], allThreats: Threat[]): RiskSuggestion[] {
    const identifiedThreatIds = new Set(identifiedRisks.map(r => r.threat_id).filter(Boolean));
    const suggestions: RiskSuggestion[] = [];
    const unidentifiedThreats = allThreats.filter(t => t.is_active && !identifiedThreatIds.has(t.id));
    unidentifiedThreats.forEach(threat => {
      const priority = this.assessThreatPriority(threat, context);
      const reason = this.getThreatRelevanceReason(threat, context);
      if (priority !== 'low') {
        suggestions.push({ threatId: threat.id, threatName: threat.name, categoryId: threat.category_id || '', reason, priority });
      }
    });
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private assessThreatPriority(threat: Threat, context: ProcessContext): 'low' | 'medium' | 'high' {
    const threatName = threat.name.toLowerCase();
    const industry = context.industry?.toLowerCase() || '';
    if (industry.includes('logística') || industry.includes('transporte')) {
      if (threatName.includes('robo') || threatName.includes('accidente') || threatName.includes('retraso')) return 'high';
    }
    return 'medium';
  }

  private getThreatRelevanceReason(threat: Threat, context: ProcessContext): string {
    const reasons: string[] = [];
    if (context.industry) reasons.push(`Común en industria ${context.industry}`);
    if (context.processType) reasons.push(`Relevante para procesos de tipo ${context.processType}`);
    if (threat.threat_type === 'externo') reasons.push('Amenaza externa con impacto directo');
    return reasons.join('. ') || 'Amenaza catalogada en ISO 28000';
  }

  validateISO31010Compliance(risk: IdentifiedRisk): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;
    if (!risk.title || risk.title.length < 10) { issues.push('El título debe ser descriptivo (mínimo 10 caracteres)'); score -= 20; }
    if (!risk.detailed_description || risk.detailed_description.length < 30) { warnings.push('Se recomienda una descripción más detallada del riesgo'); score -= 10; }
    if (!risk.threat_id) { warnings.push('ISO 31010 recomienda vincular con amenaza del catálogo'); score -= 10; }
    if (!risk.category_id) { issues.push('Debe asignar una categoría de riesgo'); score -= 20; }
    if (!risk.vulnerabilities || risk.vulnerabilities.length === 0) { warnings.push('ISO recomienda identificar vulnerabilidades asociadas'); score -= 10; }
    if (!risk.controls || risk.controls.length === 0) { suggestions.push('Considere documentar controles existentes para ISO 28000'); score -= 5; }
    if (!risk.identification_method) { suggestions.push('Documente el método de identificación usado'); score -= 5; }
    return { isValid: issues.length === 0, score: Math.max(0, score), issues, warnings, suggestions };
  }

  calculateQualityMetrics(risks: IdentifiedRisk[]) {
    if (risks.length === 0) return { totalRisks: 0, avgComplianceScore: 0, risksWithVulnerabilities: 0, risksWithControls: 0, categoriesWithRisks: 0 };
    const complianceScores = risks.map(r => this.validateISO31010Compliance(r).score);
    return {
      totalRisks: risks.length,
      avgComplianceScore: Math.round(complianceScores.reduce((a, b) => a + b, 0) / risks.length),
      risksWithVulnerabilities: risks.filter(r => r.vulnerabilities && r.vulnerabilities.length > 0).length,
      risksWithControls: risks.filter(r => r.controls && r.controls.length > 0).length,
      categoriesWithRisks: new Set(risks.map(r => r.category_id)).size
    };
  }
}

export const riskEngine = new RiskIdentificationEngine();
