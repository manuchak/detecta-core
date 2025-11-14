-- ================================================================
-- FIX: Agregar supply_lead al enum app_role
-- ================================================================
-- Este migration agrega el rol 'supply_lead' al enum app_role
-- para que los 7 usuarios con este rol puedan verlo activo

-- Agregar supply_lead al enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supply_lead';

-- Verificar que se agregó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'supply_lead' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    RAISE NOTICE '✅ supply_lead agregado correctamente al enum app_role';
  ELSE
    RAISE EXCEPTION '❌ Error: supply_lead no se agregó al enum';
  END IF;
END $$;

-- Verificar usuarios afectados
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM user_roles
  WHERE role = 'supply_lead';
  
  RAISE NOTICE '✅ Usuarios con rol supply_lead: %', user_count;
END $$;