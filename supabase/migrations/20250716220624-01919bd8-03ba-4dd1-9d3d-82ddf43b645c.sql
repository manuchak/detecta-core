-- Create table for manual call logs
CREATE TABLE IF NOT EXISTS public.manual_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text NOT NULL,
  caller_id uuid REFERENCES auth.users(id),
  call_outcome text NOT NULL CHECK (call_outcome IN ('successful', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'call_failed')),
  call_notes text,
  call_duration_minutes integer,
  call_datetime timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own call logs" 
ON public.manual_call_logs 
FOR SELECT 
USING (auth.uid() = caller_id);

CREATE POLICY "Users can create their own call logs" 
ON public.manual_call_logs 
FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own call logs" 
ON public.manual_call_logs 
FOR UPDATE 
USING (auth.uid() = caller_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_manual_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manual_call_logs_updated_at
  BEFORE UPDATE ON public.manual_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_call_logs_updated_at();