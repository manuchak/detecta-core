/**
 * CRM Hub Types
 * Types for Pipedrive integration and CRM functionality
 */

export interface CrmPipelineStage {
  id: string;
  pipedrive_id: number;
  name: string;
  pipeline_name: string;
  order_nr: number;
  deal_probability: number;
  is_active: boolean;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  pipedrive_id: number | null;
  title: string;
  organization_name: string | null;
  person_name: string | null;
  person_email: string | null;
  person_phone: string | null;
  value: number;
  currency: string;
  stage_id: string | null;
  stage?: CrmPipelineStage;
  status: 'open' | 'won' | 'lost';
  probability: number;
  expected_close_date: string | null;
  won_time: string | null;
  lost_time: string | null;
  lost_reason: string | null;
  owner_name: string | null;
  owner_id: number | null;
  pipedrive_data: Record<string, unknown> | null;
  matched_client_name: string | null;
  match_confidence: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmDealWithStage extends CrmDeal {
  crm_pipeline_stages: CrmPipelineStage | null;
}

export interface CrmDealStageHistory {
  id: string;
  deal_id: string;
  from_stage_id: string | null;
  to_stage_id: string | null;
  changed_at: string;
  time_in_previous_stage: string | null;
  from_stage?: CrmPipelineStage;
  to_stage?: CrmPipelineStage;
}

export interface CrmActivity {
  id: string;
  pipedrive_id: number | null;
  deal_id: string | null;
  type: string;
  subject: string | null;
  done: boolean;
  due_date: string | null;
  duration_minutes: number | null;
  note: string | null;
  owner_name: string | null;
  pipedrive_data: Record<string, unknown> | null;
  created_at: string;
}

export interface CrmForecast {
  stage_id: string;
  stage_name: string;
  order_nr: number;
  deal_probability: number;
  deals_count: number;
  total_value: number;
  weighted_value: number;
}

export interface CrmWebhookLog {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error_message: string | null;
  created_at: string;
}

export interface CrmMetrics {
  totalPipelineValue: number;
  weightedForecast: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  avgDealSize: number;
}

export interface ClientMatchResult {
  dealId: string;
  dealTitle: string;
  organizationName: string | null;
  matchedClientName: string | null;
  matchConfidence: number | null;
  matchStatus: 'verified' | 'auto-match' | 'pending' | 'no-match';
  dealValue: number;
  gmvReal: number | null;
}

export type DealStatus = 'open' | 'won' | 'lost';

export interface DealFilters {
  status?: DealStatus | 'all';
  stageId?: string;
  ownerName?: string;
  search?: string;
}

// Value tier for visual hierarchy
export type DealValueTier = 'low' | 'medium' | 'high' | 'premium';

export function getDealValueTier(value: number): DealValueTier {
  if (value >= 500000) return 'premium';
  if (value >= 200000) return 'high';
  if (value >= 50000) return 'medium';
  return 'low';
}

// Stalled detection
export interface DealStalledStatus {
  isStalled: boolean;
  daysInStage: number;
  avgDaysForStage: number;
  severity: 'warning' | 'critical' | null;
}

// Sankey chart types
export interface SankeyNode {
  id: string;
  name: string;
  category: 'source' | 'zone' | 'stage' | 'outcome';
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// Geographic distribution types
export interface DealGeoDistribution {
  zone: string;
  zoneName: string;
  lat: number;
  lng: number;
  dealsCount: number;
  totalValue: number;
  weightedValue: number;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
  }>;
}

export interface SupplyGapAnalysis {
  zone: string;
  zoneName: string;
  demandProjected: number; // weighted deals / avg ticket
  supplyActual: number; // active custodians in zone
  gap: number; // supply - demand (negative = deficit)
  gapStatus: 'surplus' | 'balanced' | 'deficit' | 'critical';
}
