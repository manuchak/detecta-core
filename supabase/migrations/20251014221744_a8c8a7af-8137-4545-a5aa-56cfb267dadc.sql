-- Fase 3 (corregido): Crear datos de prueba en Sandbox con estados válidos
-- Estos datos NO afectarán producción y serán filtrados automáticamente

-- 1. Insertar zona de prueba si no existe
INSERT INTO public.zonas_operacion_nacional (id, nombre, estados_incluidos, prioridad_reclutamiento)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Zona Test Sandbox', ARRAY['Test State'], 1)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear leads de prueba en Sandbox (is_test = true)
INSERT INTO public.leads (
  id,
  nombre,
  email,
  telefono,
  empresa,
  mensaje,
  fuente,
  estado,
  asignado_a,
  zona_preferida_id,
  is_test,
  fecha_creacion,
  created_at,
  updated_at
) VALUES 
  (
    'test-lead-sandbox-001',
    'Juan Pérez Test',
    'juan.test@sandbox.com',
    '+52 55 1234 5678',
    'Empresa Test SBX',
    'Mensaje de prueba para validación Sandbox',
    'test_sandbox',
    'nuevo',  -- ✅ Estado válido
    (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    true,
    now() - interval '2 days',
    now() - interval '2 days',
    now()
  ),
  (
    'test-lead-sandbox-002',
    'María González Test',
    'maria.test@sandbox.com',
    '+52 55 8765 4321',
    'Empresa Test SBX 2',
    'Segundo lead de prueba Sandbox',
    'test_sandbox',
    'contactado',  -- ✅ Estado válido
    (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    true,
    now() - interval '1 day',
    now() - interval '1 day',
    now()
  ),
  (
    'test-lead-sandbox-003',
    'Carlos López Test',
    'carlos.test@sandbox.com',
    '+52 55 9999 8888',
    'Empresa Test SBX 3',
    'Tercer lead - en revisión',
    'test_sandbox',
    'en_revision',  -- ✅ Estado válido (corregido de 'en_pool')
    (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    true,
    now() - interval '5 hours',
    now() - interval '5 hours',
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  telefono = EXCLUDED.telefono,
  estado = EXCLUDED.estado,
  is_test = EXCLUDED.is_test,
  updated_at = now();

-- 3. Crear registros de aprobación para los leads de prueba
INSERT INTO public.lead_approval_process (
  lead_id,
  analyst_id,
  current_stage,
  interview_method,
  phone_interview_completed,
  phone_interview_notes,
  final_decision,
  is_test,
  created_at,
  updated_at
) VALUES 
  (
    'test-lead-sandbox-001',
    (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1),
    'phone_interview',
    'llamada',
    false,
    'Entrevista telefónica pendiente - Sandbox',
    NULL,
    true,
    now() - interval '2 days',
    now()
  ),
  (
    'test-lead-sandbox-002',
    (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1),
    'approved',
    'llamada',
    true,
    'Aprobado para siguiente etapa - Sandbox',
    'approved',
    true,
    now() - interval '1 day',
    now()
  ),
  (
    'test-lead-sandbox-003',
    (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1),
    'pending',
    NULL,
    false,
    NULL,
    NULL,
    true,
    now() - interval '5 hours',
    now()
  )
ON CONFLICT (lead_id) DO UPDATE SET
  analyst_id = EXCLUDED.analyst_id,
  current_stage = EXCLUDED.current_stage,
  is_test = EXCLUDED.is_test,
  updated_at = now();

-- 4. Crear un candidato custodio de prueba en Sandbox
INSERT INTO public.candidatos_custodios (
  id,
  nombre,
  telefono,
  email,
  estado_proceso,
  fuente_reclutamiento,
  zona_preferida_id,
  is_test,
  created_at,
  updated_at
) VALUES 
  (
    '00000000-0000-0000-0000-000000000011'::uuid,
    'Roberto Martínez Test',
    '+52 55 7777 6666',
    'roberto.test@sandbox.com',
    'lead',
    'test_sandbox',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true,
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  is_test = EXCLUDED.is_test,
  updated_at = now();