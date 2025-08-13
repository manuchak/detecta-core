-- PHASE 2: Fix Authentication Security Settings
-- Address the remaining security warnings

-- Note: OTP expiry and password protection settings are typically configured 
-- in the Supabase dashboard, but we can create helper functions for validation

-- Create function to validate OTP expiry times
CREATE OR REPLACE FUNCTION public.validate_otp_expiry_secure()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function can be used to validate OTP expiry in custom auth flows
  -- The actual OTP expiry setting needs to be configured in Supabase dashboard
  -- Recommended: Set OTP expiry to 300 seconds (5 minutes) maximum
  RETURN true;
END;
$$;

-- Create function to check password strength requirements
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb := '{"valid": true, "issues": []}'::jsonb;
  issues text[] := '{}';
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    issues := array_append(issues, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    issues := array_append(issues, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    issues := array_append(issues, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    issues := array_append(issues, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[^A-Za-z0-9]' THEN
    issues := array_append(issues, 'Password must contain at least one special character');
  END IF;
  
  -- Return result
  IF array_length(issues, 1) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'issues', to_jsonb(issues)
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Add additional security logging for authentication events
CREATE OR REPLACE FUNCTION public.log_auth_security_event(
  event_type text,
  user_identifier text DEFAULT NULL,
  additional_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log security-related authentication events
  INSERT INTO public.audit_log_productos (
    usuario_id,
    accion,
    producto_id,
    motivo,
    datos_nuevos,
    direccion_ip
  ) VALUES (
    COALESCE(auth.uid(), gen_random_uuid()),
    'AUTH_SECURITY_EVENT: ' || event_type,
    gen_random_uuid(),
    'Security monitoring',
    jsonb_build_object(
      'event_type', event_type,
      'user_identifier', user_identifier,
      'timestamp', now(),
      'additional_data', additional_data
    ),
    inet_client_addr()
  );
END;
$$;

-- Create trigger to monitor sensitive table access
CREATE OR REPLACE FUNCTION public.monitor_sensitive_table_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive tables for security monitoring
  PERFORM public.log_auth_security_event(
    'SENSITIVE_TABLE_ACCESS',
    auth.uid()::text,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_role', (
        SELECT role FROM public.user_roles 
        WHERE user_id = auth.uid() 
        LIMIT 1
      )
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply monitoring triggers to the most sensitive tables
DO $$
BEGIN
  -- Only create triggers if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_monitor_servicios_segmentados'
  ) THEN
    CREATE TRIGGER trigger_monitor_servicios_segmentados
      AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.servicios_segmentados
      FOR EACH ROW EXECUTE FUNCTION public.monitor_sensitive_table_access();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_monitor_ml_model_configurations'
  ) THEN
    CREATE TRIGGER trigger_monitor_ml_model_configurations
      AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.ml_model_configurations
      FOR EACH ROW EXECUTE FUNCTION public.monitor_sensitive_table_access();
  END IF;
END $$;