-- Update supply_lead permissions to match supply_admin but without lead assignment

-- Remove assign_leads permission for supply_lead
UPDATE public.role_permissions 
SET allowed = false 
WHERE role = 'supply_lead' AND permission_type = 'action' AND permission_id = 'assign_leads';

-- Add missing permissions for supply_lead to match supply_admin
INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed) VALUES
('supply_lead', 'action', 'manage_supply', true),
('supply_lead', 'feature', 'analytics', true),
('supply_lead', 'feature', 'financial_data', false),
('supply_lead', 'feature', 'metrics', true),
('supply_lead', 'page', 'dashboard', true),
('supply_lead', 'page', 'landing_management', true),
('supply_lead', 'page', 'reports', true),
('supply_lead', 'page', 'supply', true),
('supply_lead', 'action', 'interview_candidates', true),
('supply_lead', 'action', 'save_interviews', true),
('supply_lead', 'action', 'approve_candidates', true)
ON CONFLICT (role, permission_type, permission_id) DO UPDATE SET
allowed = EXCLUDED.allowed;