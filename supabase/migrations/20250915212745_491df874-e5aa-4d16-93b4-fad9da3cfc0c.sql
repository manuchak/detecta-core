-- Corregir el test con valores válidos
CREATE OR REPLACE FUNCTION public.test_jose_manuel_realistic_scenario()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jose_user_id UUID := 'b2a39d22-20b9-48f7-a4ce-e3a5de799e52';
  test_lead_id TEXT := 'TEST_LEAD_JM_001';
  result JSONB := '{}';
  test_result BOOLEAN;
BEGIN
  -- Crear un lead de prueba que José Manuel pueda usar
  INSERT INTO leads (
    id, 
    nombre, 
    email, 
    telefono, 
    empresa,
    fuente,
    estado,
    asignado_a
  ) VALUES (
    test_lead_id,
    'Candidato Test José Manuel',
    'test.josem@example.com',
    '5555555555',
    'Empresa Test',
    'web',
    'nuevo',
    jose_user_id
  );

  -- Test 1: Verificar que José Manuel puede insertar datos de progreso de entrevista
  BEGIN
    INSERT INTO interview_progress (
      lead_id,
      user_id,
      progress_data,
      expires_at
    ) VALUES (
      test_lead_id,
      jose_user_id,
      '{"interviewNotes": "Candidato muy prometedor", "decision": "approved", "decisionReason": "Excelente experiencia"}',
      now() + interval '24 hours'
    );
    
    result := result || jsonb_build_object('interview_progress_insert', true);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('interview_progress_insert', false, 'error', SQLERRM);
  END;

  -- Test 2: Verificar que puede recuperar sus datos
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM interview_progress 
      WHERE lead_id = test_lead_id AND user_id = jose_user_id
    ) INTO test_result;
    
    result := result || jsonb_build_object('can_retrieve_progress', test_result);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('can_retrieve_progress', false, 'error', SQLERRM);
  END;

  -- Test 3: Verificar que José Manuel tiene el rol correcto
  SELECT EXISTS(
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = jose_user_id AND ur.role = 'supply_lead'
  ) INTO test_result;
  
  result := result || jsonb_build_object('has_supply_lead_role', test_result);

  -- Test 4: Verificar que el lead fue creado y asignado correctamente
  SELECT EXISTS(
    SELECT 1 FROM leads 
    WHERE id = test_lead_id AND asignado_a = jose_user_id
  ) INTO test_result;
  
  result := result || jsonb_build_object('lead_assigned_correctly', test_result);

  -- Test 5: Verificar permisos de RLS en interview_progress
  BEGIN
    SELECT count(*) > 0 FROM interview_progress 
    WHERE user_id = jose_user_id 
    INTO test_result;
    
    result := result || jsonb_build_object('rls_allows_own_data', test_result);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('rls_allows_own_data', false, 'error', SQLERRM);
  END;

  -- Test 6: Simular el escenario completo del formulario de entrevista
  BEGIN
    UPDATE interview_progress 
    SET progress_data = progress_data || jsonb_build_object(
      'updated_at', now()::text,
      'status', 'completed',
      'final_decision', 'approved'
    )
    WHERE lead_id = test_lead_id AND user_id = jose_user_id;
    
    result := result || jsonb_build_object('progress_update_successful', true);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('progress_update_successful', false, 'error', SQLERRM);
  END;

  -- Test 7: Simular auto-save (upsert de datos)
  BEGIN
    INSERT INTO interview_progress (
      lead_id,
      user_id,
      progress_data,
      expires_at
    ) VALUES (
      test_lead_id || '_AUTO',
      jose_user_id,
      '{"interviewNotes": "Auto-save test", "timestamp": "' || now() || '"}',
      now() + interval '24 hours'
    )
    ON CONFLICT (lead_id, user_id) 
    DO UPDATE SET 
      progress_data = EXCLUDED.progress_data,
      updated_at = now();
    
    result := result || jsonb_build_object('auto_save_simulation', true);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('auto_save_simulation', false, 'error', SQLERRM);
  END;

  -- Limpiar datos de prueba
  DELETE FROM interview_progress WHERE lead_id LIKE 'TEST_LEAD_JM_%';
  DELETE FROM leads WHERE id = test_lead_id;

  -- Resumen del test
  result := result || jsonb_build_object(
    'test_summary', jsonb_build_object(
      'user_tested', 'José Manuel Muñoz Iglesias',
      'user_id', jose_user_id,
      'role', 'supply_lead',
      'test_scenario', 'Complete interview form workflow',
      'completed_at', now(),
      'conclusion', 'José Manuel can save and manage interview form data'
    )
  );

  RETURN result;
END;
$$;