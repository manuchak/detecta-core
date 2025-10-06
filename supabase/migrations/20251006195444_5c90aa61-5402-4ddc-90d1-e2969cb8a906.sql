-- Eliminar la política permisiva actual de SELECT
DROP POLICY IF EXISTS "activos_select_auth" ON public.activos_monitoreo;

-- Crear nueva política restrictiva basada en roles
CREATE POLICY "activos_select_authorized_roles"
ON public.activos_monitoreo
FOR SELECT
TO authenticated
USING (
  -- Solo roles con necesidad operativa de ver datos de monitoreo
  user_has_role_direct('admin') OR
  user_has_role_direct('owner') OR
  user_has_role_direct('coordinador_operaciones') OR
  user_has_role_direct('monitoring_supervisor') OR
  user_has_role_direct('monitoring') OR
  user_has_role_direct('jefe_seguridad') OR
  user_has_role_direct('analista_seguridad')
);

-- Agregar comentario explicativo
COMMENT ON POLICY "activos_select_authorized_roles" ON public.activos_monitoreo IS 
'Restringe acceso de lectura a datos sensibles de GPS y personales solo a roles autorizados con necesidad operativa de monitoreo y seguridad';