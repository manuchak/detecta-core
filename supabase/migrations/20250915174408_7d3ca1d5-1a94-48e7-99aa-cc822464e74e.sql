-- Enhance vapi_call_logs table for structured interview data
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT NULL;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS analysis_score NUMERIC DEFAULT NULL;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT NULL;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS auto_decision TEXT DEFAULT NULL;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS red_flags TEXT[] DEFAULT '{}';

-- Add function to create VAPI call logs with enhanced data
CREATE OR REPLACE FUNCTION create_vapi_call_log(
  p_lead_id TEXT,
  p_vapi_call_id TEXT,
  p_phone_number TEXT,
  p_structured_data JSONB DEFAULT NULL,
  p_analysis_score NUMERIC DEFAULT NULL,
  p_recommendation TEXT DEFAULT NULL,
  p_auto_decision TEXT DEFAULT NULL,
  p_red_flags TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO vapi_call_logs (
    lead_id,
    vapi_call_id,
    phone_number,
    call_status,
    structured_data,
    analysis_score,
    recommendation,
    auto_decision,
    red_flags,
    created_at
  ) VALUES (
    p_lead_id,
    p_vapi_call_id,
    p_phone_number,
    'initiated',
    p_structured_data,
    p_analysis_score,
    p_recommendation,
    p_auto_decision,
    p_red_flags,
    now()
  );
  
  RETURN true;
END;
$$;

-- Function to update VAPI call with webhook data
CREATE OR REPLACE FUNCTION update_vapi_call_with_results(
  p_vapi_call_id TEXT,
  p_call_status TEXT,
  p_duration_seconds INTEGER,
  p_transcript TEXT,
  p_summary TEXT,
  p_structured_data JSONB,
  p_analysis_score NUMERIC,
  p_recording_url TEXT DEFAULT NULL,
  p_cost_usd NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead_id TEXT;
  v_auto_decision TEXT;
  v_recommendation TEXT;
BEGIN
  -- Extract decision data from structured_data
  v_auto_decision := p_structured_data->>'auto_decision';
  v_recommendation := p_structured_data->'evaluation'->>'recommendation';
  
  -- Update the VAPI call log
  UPDATE vapi_call_logs SET
    call_status = p_call_status,
    duration_seconds = p_duration_seconds,
    transcript = p_transcript,
    summary = p_summary,
    structured_data = p_structured_data,
    analysis_score = p_analysis_score,
    auto_decision = v_auto_decision,
    recommendation = v_recommendation,
    recording_url = p_recording_url,
    cost_usd = p_cost_usd,
    ended_at = CASE WHEN p_call_status IN ('completed', 'ended') THEN now() ELSE ended_at END
  WHERE vapi_call_id = p_vapi_call_id
  RETURNING lead_id INTO v_lead_id;
  
  -- Update the lead with interview results if auto-decision is available
  IF v_auto_decision IS NOT NULL AND v_lead_id IS NOT NULL THEN
    -- Update lead interview data
    UPDATE leads SET
      interview_data = COALESCE(interview_data, '{}'::jsonb) || jsonb_build_object(
        'vapi_interview', p_structured_data,
        'last_interview_type', 'vapi_automated',
        'last_interview_date', now(),
        'analysis_score', p_analysis_score,
        'auto_decision', v_auto_decision
      ),
      updated_at = now()
    WHERE id = v_lead_id;
    
    -- Update approval process based on auto-decision
    IF v_auto_decision = 'aprobar' THEN
      -- Auto-approve the lead
      UPDATE lead_approval_process SET
        current_stage = 'approved',
        phone_interview_completed = true,
        phone_interview_notes = 'Aprobado automáticamente por VAPI - Score: ' || p_analysis_score,
        updated_at = now()
      WHERE lead_id = v_lead_id;
      
    ELSIF v_auto_decision = 'segunda_entrevista' THEN
      -- Schedule for second interview
      UPDATE lead_approval_process SET
        current_stage = 'second_interview_needed',
        phone_interview_completed = true,
        phone_interview_notes = 'Requiere segunda entrevista - Score: ' || p_analysis_score || '. ' || COALESCE(v_recommendation, ''),
        updated_at = now()
      WHERE lead_id = v_lead_id;
      
    ELSIF v_auto_decision = 'rechazar' THEN
      -- Auto-reject the lead
      UPDATE lead_approval_process SET
        current_stage = 'rejected',
        phone_interview_completed = true,
        phone_interview_notes = 'Rechazado automáticamente por VAPI - Score: ' || p_analysis_score || '. Red flags detectados.',
        rejection_reason = v_recommendation,
        updated_at = now()
      WHERE lead_id = v_lead_id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;