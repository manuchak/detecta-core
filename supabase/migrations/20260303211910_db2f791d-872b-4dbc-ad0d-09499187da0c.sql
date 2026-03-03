-- Insert role_permissions for customer_success role
-- Pages: dashboard and customer-success module
INSERT INTO role_permissions (role, permission_type, permission_id, allowed) VALUES
  ('customer_success', 'page', 'dashboard', true),
  ('customer_success', 'page', 'leads', true),
  ('customer_success', 'module', 'customer_success', true),
  ('customer_success', 'page', 'customer_success_panorama', true),
  ('customer_success', 'page', 'customer_success_cartera', true),
  ('customer_success', 'page', 'customer_success_operativo', true),
  ('customer_success', 'page', 'customer_success_analisis', true),
  ('customer_success', 'page', 'customer_success_config', true),
  ('customer_success', 'feature', 'cs_dashboard', true),
  ('customer_success', 'feature', 'cs_analytics', true),
  ('customer_success', 'feature', 'cs_metrics', true),
  ('customer_success', 'feature', 'cs_touchpoints', true),
  ('customer_success', 'feature', 'cs_complaints', true),
  ('customer_success', 'feature', 'cs_portfolio', true)
ON CONFLICT DO NOTHING;