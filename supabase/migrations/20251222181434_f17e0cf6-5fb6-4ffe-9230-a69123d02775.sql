-- Agregar rol 'planificador' a la política de UPDATE en matriz_precios_rutas
-- El problema: planificador puede INSERT pero no UPDATE, y el UPSERT requiere ambos permisos

-- Primero eliminar la política existente
DROP POLICY IF EXISTS matriz_precios_update_senior_management ON matriz_precios_rutas;

-- Crear nueva política que incluye planificador
CREATE POLICY matriz_precios_update_authorized ON matriz_precios_rutas
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador']::text[])
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador']::text[])
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);