-- Add scheduling fields to manual_call_logs table
ALTER TABLE public.manual_call_logs 
ADD COLUMN scheduled_datetime timestamp with time zone,
ADD COLUMN rescheduled_from_call_id uuid REFERENCES public.manual_call_logs(id),
ADD COLUMN requires_reschedule boolean DEFAULT false;

-- Create index for scheduling queries
CREATE INDEX idx_manual_call_logs_scheduled_datetime ON public.manual_call_logs(scheduled_datetime);
CREATE INDEX idx_manual_call_logs_caller_scheduled ON public.manual_call_logs(caller_id, scheduled_datetime) WHERE scheduled_datetime IS NOT NULL;

-- Update call outcome constraint to include reschedule option
ALTER TABLE public.manual_call_logs 
DROP CONSTRAINT IF EXISTS manual_call_logs_call_outcome_check;

ALTER TABLE public.manual_call_logs 
ADD CONSTRAINT manual_call_logs_call_outcome_check 
CHECK (call_outcome IN ('successful', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'call_failed', 'reschedule_requested'));

-- Create a view for upcoming scheduled calls
CREATE OR REPLACE VIEW scheduled_calls_view AS
SELECT 
  mcl.*,
  'manual_call_logs' as source_table
FROM public.manual_call_logs mcl
WHERE mcl.scheduled_datetime IS NOT NULL 
  AND mcl.scheduled_datetime > now()
  AND mcl.call_outcome IS NULL
ORDER BY mcl.scheduled_datetime ASC;