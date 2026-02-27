
-- Seed historical cost data
INSERT INTO public.project_cost_entries (entry_date, messages_count, estimated_cost_usd, participants, version_id, category, notes) VALUES
('2025-08-01', 200, 50.00, ARRAY['Ricardo'], '1807cba7-c789-4945-aac0-4cf0690b6dfa', 'development', 'Versión Genesis - Creación inicial del sistema con módulos base'),
('2025-08-20', 80, 20.00, ARRAY['Ricardo'], '36e182dc-5e89-4e31-8bd5-5e001a5190cf', 'development', 'Security Enhancement - Implementación de autenticación y RLS'),
('2025-10-01', 100, 25.00, ARRAY['Ricardo'], 'f7b6c207-3acf-4f1c-b779-5df8baf4d6e0', 'development', 'Version Control - Sistema de control de versiones'),
('2025-10-15', 150, 37.50, ARRAY['Ricardo'], '4472a442-95d8-4f37-a8d2-443296e8e137', 'development', 'Import Wizard Enhancement - Wizard de importación masiva'),
('2025-11-15', 500, 125.00, ARRAY['Ricardo'], '81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'development', 'LMS Platform - Sistema completo de Learning Management con IA'),
('2025-12-01', 400, 100.00, ARRAY['Ricardo'], '5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'development', 'Facturación Hub - Dashboard de facturación, CxC, CxP, cobranza'),
('2025-12-20', 450, 112.50, ARRAY['Ricardo'], 'efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'development', 'Customer Success - NPS, CSAT, VoC, health scores, playbooks'),
('2026-01-10', 300, 75.00, ARRAY['Ricardo'], 'f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'development', 'SIERCP & Evaluaciones - Sistema de evaluación de riesgo con IA'),
('2026-01-25', 350, 87.50, ARRAY['Ricardo'], 'f25a964e-6cfc-4cc9-8f16-9536af01da29', 'development', 'Recruitment Pipeline - Psicometría, toxicología, contratos'),
('2026-02-10', 250, 62.50, ARRAY['Ricardo'], '386f7fae-6388-48bf-a74b-ca1633231e85', 'development', 'Monitoring & Operations - Modo TV, checklists, incidentes'),
('2026-02-25', 400, 100.00, ARRAY['Ricardo'], '0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'development', 'Platform Maturity - WMS, Legal, AI prompts, madurez general');
