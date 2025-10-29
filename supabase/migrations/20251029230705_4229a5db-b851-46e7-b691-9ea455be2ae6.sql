-- Agregar rol 'planificador' al enum app_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'planificador' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'planificador';
  END IF;
END $$;

-- Crear tabla de auditoría para asignaciones de personal externo
CREATE TABLE IF NOT EXISTS public.asignacion_personal_externo_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid NOT NULL REFERENCES public.personal_proveedor_armados(id) ON DELETE CASCADE,
  proveedor_id uuid NOT NULL REFERENCES public.proveedores_armados(id) ON DELETE CASCADE,
  servicio_id text,
  accion text NOT NULL CHECK (accion IN ('creado', 'asignado', 'actualizado')),
  nombre_completo text NOT NULL,
  realizado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla de auditoría
ALTER TABLE public.asignacion_personal_externo_audit ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Planificadores pueden insertar auditoría" ON public.asignacion_personal_externo_audit;
DROP POLICY IF EXISTS "Planificadores y admins pueden ver auditoría" ON public.asignacion_personal_externo_audit;
DROP POLICY IF EXISTS "Planificadores pueden insertar personal externo" ON public.personal_proveedor_armados;
DROP POLICY IF EXISTS "Planificadores pueden actualizar personal externo" ON public.personal_proveedor_armados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver personal externo" ON public.personal_proveedor_armados;

-- Política: Solo planificadores pueden insertar registros de auditoría
CREATE POLICY "Planificadores pueden insertar auditoría"
ON public.asignacion_personal_externo_audit
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'planificador'));

-- Política: Solo planificadores y admins pueden ver auditoría
CREATE POLICY "Planificadores y admins pueden ver auditoría"
ON public.asignacion_personal_externo_audit
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'planificador') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Actualizar políticas de personal_proveedor_armados para planificadores
-- Solo planificadores pueden insertar personal
CREATE POLICY "Planificadores pueden insertar personal externo"
ON public.personal_proveedor_armados
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'planificador'));

-- Solo planificadores pueden actualizar personal
CREATE POLICY "Planificadores pueden actualizar personal externo"
ON public.personal_proveedor_armados
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'planificador'))
WITH CHECK (public.has_role(auth.uid(), 'planificador'));

-- Todos los autenticados pueden ver el personal (necesario para mostrar listados)
CREATE POLICY "Usuarios autenticados pueden ver personal externo"
ON public.personal_proveedor_armados
FOR SELECT
TO authenticated
USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_asignacion_personal_externo_audit_personal_id 
ON public.asignacion_personal_externo_audit(personal_id);

CREATE INDEX IF NOT EXISTS idx_asignacion_personal_externo_audit_realizado_por 
ON public.asignacion_personal_externo_audit(realizado_por);

CREATE INDEX IF NOT EXISTS idx_asignacion_personal_externo_audit_created_at 
ON public.asignacion_personal_externo_audit(created_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE public.asignacion_personal_externo_audit IS 'Auditoría de creación y asignación de personal de proveedores externos';
COMMENT ON COLUMN public.asignacion_personal_externo_audit.accion IS 'Tipo de acción: creado (nuevo personal), asignado (asignado a servicio), actualizado (modificación de datos)';
COMMENT ON COLUMN public.asignacion_personal_externo_audit.metadata IS 'Metadatos adicionales como servicio_id, cambios realizados, etc.';