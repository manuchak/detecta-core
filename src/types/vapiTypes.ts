
export interface VapiCallLog {
  id: string;
  vapi_call_id: string;
  call_status: string;
  phone_number: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  analysis: any;
  recording_url: string | null;
  cost_usd: number | null;
  created_at: string;
}
