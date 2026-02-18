// Risk level enum
export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'extremo';

// Severity levels for security events
export type SeverityLevel = 'bajo' | 'medio' | 'alto' | 'critico';

// Event types
export type EventType = 
  | 'robo' 
  | 'asalto' 
  | 'secuestro' 
  | 'vandalismo' 
  | 'fraude' 
  | 'accidente' 
  | 'amenaza'
  | 'otro';

// Change types for history
export type ChangeType = 
  | 'event_added' 
  | 'recalculation' 
  | 'manual_adjustment' 
  | 'system_update';

// Security event record
export interface SecurityEvent {
  id: string;
  h3Index: string;
  h3Resolution?: number;
  eventType: EventType;
  severity: SeverityLevel;
  eventDate: string;
  description?: string;
  source?: string;
  reportedBy?: string;
  verified: boolean;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Risk zone score (current state)
export interface RiskZoneScore {
  id: string;
  h3Index: string;
  h3Resolution?: number;
  baseScore: number;
  manualAdjustment: number;
  finalScore: number;
  riskLevel: RiskLevel;
  priceMultiplier: number;
  eventCount: number;
  lastEventDate?: string;
  lastCalculatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Manual adjustment to a risk zone
export interface RiskZoneAdjustment {
  id: string;
  h3Index: string;
  adjustmentValue: number;
  reason: string;
  validFrom: string;
  validUntil?: string;
  createdBy: string;
  organizationId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Historical changes to risk zones
export interface RiskZoneHistory {
  id: string;
  h3Index: string;
  previousScore?: number;
  newScore?: number;
  previousRiskLevel?: RiskLevel;
  newRiskLevel?: RiskLevel;
  changeType: ChangeType;
  changeReason: string;
  changedBy?: string;
  changedAt?: string;
}

// Risk zone with full details (for display)
export interface RiskZoneDetails extends RiskZoneScore {
  recentEvents: SecurityEvent[];
  activeAdjustments: RiskZoneAdjustment[];
  history: RiskZoneHistory[];
}

// Risk calculation parameters
export interface RiskCalculationParams {
  h3Index: string;
  timeWindowDays?: number; // Default 90
  severityWeights?: {
    bajo: number;
    medio: number;
    alto: number;
    critico: number;
  };
  decayFactor?: boolean; // Apply temporal decay
  verifiedBonus?: number; // Bonus multiplier for verified events
}

// Risk score breakdown
export interface RiskScoreBreakdown {
  h3Index: string;
  baseScore: number;
  components: {
    eventScore: number;
    temporalDecay: number;
    verificationBonus: number;
    manualAdjustment: number;
  };
  eventCount: number;
  recentEventDates: string[];
  finalScore: number;
  riskLevel: RiskLevel;
  priceMultiplier: number;
}
