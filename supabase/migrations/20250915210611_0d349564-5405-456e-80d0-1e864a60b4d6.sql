-- Create table for storing interview progress (auto-save data)
CREATE TABLE public.interview_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  progress_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  CONSTRAINT fk_interview_progress_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.interview_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own interview progress" 
ON public.interview_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview progress" 
ON public.interview_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview progress" 
ON public.interview_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview progress" 
ON public.interview_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_interview_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interview_progress_updated_at
BEFORE UPDATE ON public.interview_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_interview_progress_updated_at();

-- Create index for better performance
CREATE INDEX idx_interview_progress_lead_user ON public.interview_progress(lead_id, user_id);
CREATE INDEX idx_interview_progress_expires ON public.interview_progress(expires_at);

-- Create function to clean up expired progress
CREATE OR REPLACE FUNCTION public.cleanup_expired_interview_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.interview_progress 
  WHERE expires_at < now();
END;
$$;