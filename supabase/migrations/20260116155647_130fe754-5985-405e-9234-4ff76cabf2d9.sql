-- Create business_targets table for annual planning
CREATE TABLE public.business_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  target_services INTEGER NOT NULL,
  target_gmv DECIMAL(15,2) NOT NULL,
  target_aov DECIMAL(10,2) NOT NULL DEFAULT 6765.00,
  target_active_custodians INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT business_targets_month_check CHECK (month >= 1 AND month <= 12),
  CONSTRAINT business_targets_year_month_unique UNIQUE(year, month)
);

-- Enable RLS
ALTER TABLE public.business_targets ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can view business targets"
ON public.business_targets
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admin/owner can insert/update/delete (using user_roles table)
CREATE POLICY "Admin can manage business targets"
ON public.business_targets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
    AND user_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
    AND user_roles.is_active = true
  )
);

-- Insert 2026 plan data
INSERT INTO public.business_targets (year, month, target_services, target_gmv, target_aov, target_active_custodians) VALUES
(2026, 1, 828, 5600000.00, 6765.00, 34),
(2026, 2, 947, 6400000.00, 6765.00, 39),
(2026, 3, 1036, 7000000.00, 6765.00, 43),
(2026, 4, 1095, 7400000.00, 6765.00, 45),
(2026, 5, 1183, 8000000.00, 6765.00, 49),
(2026, 6, 1272, 8600000.00, 6765.00, 52),
(2026, 7, 1361, 9200000.00, 6765.00, 56),
(2026, 8, 1450, 9800000.00, 6765.00, 60),
(2026, 9, 1568, 10600000.00, 6765.00, 65),
(2026, 10, 1657, 11200000.00, 6765.00, 68),
(2026, 11, 1776, 12000000.00, 6765.00, 73),
(2026, 12, 1924, 13000000.00, 6765.00, 79);

-- Create updated_at trigger
CREATE TRIGGER update_business_targets_updated_at
BEFORE UPDATE ON public.business_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.business_targets IS 'Monthly business targets for services, GMV, AOV and active custodians';