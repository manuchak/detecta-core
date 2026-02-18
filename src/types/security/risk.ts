// ============================================================================
// TypeScript types for Risk Management System (ISO 31000/28000)
// Adapted from Hermes for Detecta Security Module
// ============================================================================

export type ProcessType = 'ruta' | 'patio' | 'almacen' | 'cedis' | 'zona_transferencia' | 'frontera' | 'otro';
export type AssessmentStatus = 'draft' | 'in_review' | 'approved' | 'archived';
export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'extremo';
export type Acceptability = 'aceptable' | 'tolerable' | 'no_aceptable';
export type Priority = 'baja' | 'media' | 'alta' | 'critica';
export type TreatmentStrategy = 'evitar' | 'reducir' | 'transferir' | 'aceptar' | 'mejorar_controles';
export type TreatmentStatus = 'not_started' | 'in_progress' | 'implemented' | 'under_verification' | 'completed';
export type VulnerabilityType = 'procedimental' | 'tecnologico' | 'humano' | 'infraestructura' | 'proveedor';
export type ControlType = 'preventivo' | 'detectivo' | 'correctivo';
export type ThreatType = 'externo' | 'interno' | 'mixto';
export type ImpactCalculationMethod = 'maximum' | 'weighted_average';

export interface RiskCategory {
  id: string;
  name: string;
  description?: string;
  display_order?: number;
  created_at: string;
}

export interface Threat {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  threat_type?: ThreatType;
  created_at: string;
  is_active: boolean;
}

export interface Vulnerability {
  id: string;
  description: string;
  vulnerability_type?: VulnerabilityType;
  created_at: string;
  is_active: boolean;
}

export interface ExistingControl {
  id: string;
  name: string;
  control_type?: ControlType;
  description?: string;
  responsible?: string;
  coverage?: string;
  created_at: string;
  is_active: boolean;
}

export interface MatrixConfig {
  id: string;
  organization_id: string;
  name: string;
  probability_definitions: Record<string, { label: string; description: string }>;
  consequence_definitions: Record<string, Record<string, string>>;
  impact_weights: {
    personas: number;
    operacion: number;
    financiero: number;
    reputacional: number;
  };
  impact_calculation_method: ImpactCalculationMethod;
  risk_level_ranges: Record<string, { min: number; max: number; color: string }>;
  matrix_design: {
    rows: number;
    cols: number;
    cells: any[];
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdentifiedRisk {
  id: string;
  assessment_id: string;
  risk_number?: string;
  title: string;
  threat_id?: string;
  category_id: string;
  detailed_description?: string;
  consequence_people?: number;
  consequence_operation?: number;
  consequence_financial?: number;
  consequence_reputation?: number;
  total_impact?: number;
  probability?: number;
  inherent_risk_score?: number;
  inherent_risk_level?: RiskLevel;
  residual_probability?: number;
  residual_total_impact?: number;
  residual_risk_score?: number;
  residual_risk_level?: RiskLevel;
  valuation_justification: string;
  acceptability?: Acceptability;
  priority?: Priority;
  vulnerabilities?: Vulnerability[];
  controls?: ExistingControl[];
  identification_method?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TreatmentPlan {
  id: string;
  risk_id: string;
  strategy: TreatmentStrategy;
  proposed_measures: string;
  responsible: string;
  commitment_date?: string;
  target_closure_date?: string;
  status: TreatmentStatus;
  evidence?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Label maps for enums
export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  ruta: 'Ruta',
  patio: 'Patio',
  almacen: 'Almacén',
  cedis: 'CEDIS',
  zona_transferencia: 'Zona de Transferencia',
  frontera: 'Frontera',
  otro: 'Otro'
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  extremo: 'Extremo'
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  bajo: '#22c55e',
  medio: '#eab308',
  alto: '#f97316',
  extremo: '#ef4444'
};

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  draft: 'Borrador',
  in_review: 'En Revisión',
  approved: 'Aprobado',
  archived: 'Archivado'
};

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  not_started: 'No Iniciado',
  in_progress: 'En Progreso',
  implemented: 'Implementado',
  under_verification: 'En Verificación',
  completed: 'Completado'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica'
};
