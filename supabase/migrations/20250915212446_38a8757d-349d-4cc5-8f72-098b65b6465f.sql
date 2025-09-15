-- Test function to validate José Manuel Muñoz can save interview data
CREATE OR REPLACE FUNCTION public.test_jose_manuel_interview_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  jose_user_id UUID := 'b2a39d22-20b9-48f7-a4ce-e3a5de799e52';
  test_lead_id TEXT := 'TEST_LEAD_001';
  test_progress_data JSONB := '{"interviewNotes": "Test notes", "decision": "approved", "decisionReason": "Test reason"}';
  result JSONB := '{}';
  test_result BOOLEAN;
  error_msg TEXT;
BEGIN
  -- Test 1: Check if user exists and has correct role
  SELECT EXISTS(
    SELECT 1 FROM profiles p
    JOIN user_roles ur ON p.id = ur.user_id
    WHERE p.id = jose_user_id 
    AND ur.role = 'supply_lead'
  ) INTO test_result;
  
  result := result || jsonb_build_object('user_role_test', test_result);
  
  -- Test 2: Test direct insert to interview_progress table (simulating José Manuel)
  BEGIN
    -- Insert test data
    INSERT INTO interview_progress (
      lead_id,
      user_id,
      progress_data,
      expires_at
    ) VALUES (
      test_lead_id,
      jose_user_id,
      test_progress_data,
      now() + interval '24 hours'
    );
    
    result := result || jsonb_build_object('direct_insert_test', true);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('direct_insert_test', false, 'insert_error', SQLERRM);
  END;
  
  -- Test 3: Test if data can be retrieved
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM interview_progress
      WHERE lead_id = test_lead_id 
      AND user_id = jose_user_id
    ) INTO test_result;
    
    result := result || jsonb_build_object('data_retrieval_test', test_result);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('data_retrieval_test', false, 'retrieval_error', SQLERRM);
  END;
  
  -- Test 4: Test update functionality
  BEGIN
    UPDATE interview_progress 
    SET progress_data = progress_data || '{"updated": true}'::jsonb
    WHERE lead_id = test_lead_id 
    AND user_id = jose_user_id;
    
    result := result || jsonb_build_object('update_test', true);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('update_test', false, 'update_error', SQLERRM);
  END;
  
  -- Test 5: Check role-based permissions for interview functions
  BEGIN
    -- Test if user_has_role_direct function works for José Manuel
    SELECT user_has_role_direct('supply_lead') INTO test_result;
    result := result || jsonb_build_object('role_function_test', test_result);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('role_function_test', false, 'role_function_error', SQLERRM);
  END;
  
  -- Test 6: Test save_interview_session function permissions
  BEGIN
    SELECT save_interview_session(
      test_lead_id,
      gen_random_uuid(),
      test_progress_data
    ) INTO test_result;
    
    result := result || jsonb_build_object('save_interview_session_test', test_result);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('save_interview_session_test', false, 'save_session_error', SQLERRM);
  END;
  
  -- Test 7: Test update_lead_state_after_interview function permissions
  BEGIN
    SELECT update_lead_state_after_interview(
      test_lead_id,
      'approved',
      'Test interview notes from José Manuel',
      NULL
    ) INTO test_result;
    
    result := result || jsonb_build_object('update_lead_state_test', test_result);
  EXCEPTION WHEN OTHERS THEN
    result := result || jsonb_build_object('update_lead_state_test', false, 'update_lead_error', SQLERRM);
  END;
  
  -- Cleanup: Remove test data
  DELETE FROM interview_progress WHERE lead_id = test_lead_id AND user_id = jose_user_id;
  
  -- Add test summary
  result := result || jsonb_build_object(
    'test_user', 'José Manuel Muñoz Iglesias',
    'user_id', jose_user_id,
    'role', 'supply_lead',
    'test_completed_at', now()
  );
  
  RETURN result;
END;
$$;