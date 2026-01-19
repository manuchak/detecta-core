-- =============================================
-- FIX: Ampliar RLS para roles de Planeación
-- Problema: supply_lead y otros roles operativos no ven armados
-- Solución: Agregar roles operativos a políticas SELECT
-- =============================================

-- 1. Eliminar políticas SELECT existentes
DROP POLICY IF EXISTS "armados_operativos_select_authorized" ON public.armados_operativos;
DROP POLICY IF EXISTS "proveedores_armados_select_authorized" ON public.proveedores_armados;

-- 2. Recrear política SELECT para armados_operativos con roles ampliados
CREATE POLICY "armados_operativos_select_authorized" 
ON public.armados_operativos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN (
      'admin', 
      'owner', 
      'coordinador_operaciones', 
      'planificador', 
      'supply_admin',
      'supply_lead',      -- Agregado: Supply leads que planifican servicios
      'jefe_seguridad',   -- Agregado: Supervisa asignaciones de armados
      'c4',               -- Agregado: Centro de comando necesita visibilidad
      'monitoreo',        -- Agregado: Monitoreo en tiempo real
      'monitoring_supervisor'  -- Agregado: Supervisor de monitoreo
    )
  )
);

-- 3. Recrear política SELECT para proveedores_armados con roles ampliados
CREATE POLICY "proveedores_armados_select_authorized" 
ON public.proveedores_armados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN (
      'admin', 
      'owner', 
      'coordinador_operaciones', 
      'planificador', 
      'supply_admin',
      'supply_lead',      -- Agregado: Supply leads que planifican servicios
      'jefe_seguridad',   -- Agregado: Supervisa asignaciones de armados
      'c4',               -- Agregado: Centro de comando necesita visibilidad
      'monitoreo',        -- Agregado: Monitoreo en tiempo real
      'monitoring_supervisor'  -- Agregado: Supervisor de monitoreo
    )
  )
);

-- Comentarios de documentación
COMMENT ON POLICY "armados_operativos_select_authorized" ON public.armados_operativos IS
'Permite lectura de armados operativos a roles con necesidad operacional:
- Administrativos: admin, owner, supply_admin
- Planeación: planificador, coordinador_operaciones, supply_lead
- Seguridad/Monitoreo: jefe_seguridad, c4, monitoreo, monitoring_supervisor
Actualizado 2026-01-19 para resolver bug de visibilidad en modal de asignación.';