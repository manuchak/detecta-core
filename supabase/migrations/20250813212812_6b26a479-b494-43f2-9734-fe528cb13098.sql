-- Phase 1: Fix Critical RLS Policies for Exposed Tables
-- These tables are currently publicly readable and contain sensitive data

-- 1. Fix contactos_empresa table - restrict to admin/coordinators only
DROP POLICY IF EXISTS "Contactos de empresa visibles para usuarios autenticados" ON public.contactos_empresa;
CREATE POLICY "Contactos de empresa para roles autorizados" 
ON public.contactos_empresa 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'ejecutivo_ventas')
  )
);

-- 2. Fix instaladores table - create proper RLS policies
DROP POLICY IF EXISTS "Instaladores pueden ver información" ON public.instaladores;
DROP POLICY IF EXISTS "Instaladores pueden actualizar información" ON public.instaladores;

-- Installers can see their own data, coordinators can see all
CREATE POLICY "Instaladores ven sus datos propios" 
ON public.instaladores 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- Only installers can update their own data
CREATE POLICY "Instaladores actualizan sus datos" 
ON public.instaladores 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Only coordinators can insert new installers
CREATE POLICY "Coordinadores crean instaladores" 
ON public.instaladores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- 3. Fix instaladores_datos_fiscales table - highly sensitive financial data
DROP POLICY IF EXISTS "Instaladores pueden gestionar datos fiscales" ON public.instaladores_datos_fiscales;

-- Only installer can see their own fiscal data + admin/coordinators
CREATE POLICY "Datos fiscales acceso restringido" 
ON public.instaladores_datos_fiscales 
FOR SELECT 
USING (
  instalador_id IN (
    SELECT id FROM public.instaladores WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Only installer can update their own fiscal data
CREATE POLICY "Instaladores actualizan datos fiscales propios" 
ON public.instaladores_datos_fiscales 
FOR UPDATE 
USING (
  instalador_id IN (
    SELECT id FROM public.instaladores WHERE user_id = auth.uid()
  )
);

-- Only admin can insert fiscal data
CREATE POLICY "Admin crea datos fiscales" 
ON public.instaladores_datos_fiscales 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- 4. Fix leads table - restrict to sales team and assigned users
DROP POLICY IF EXISTS "Leads visibles para usuarios autenticados" ON public.leads;

CREATE POLICY "Leads para equipo autorizado" 
ON public.leads 
FOR SELECT 
USING (
  -- Sales team and admin can see all leads
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'ejecutivo_ventas', 'supply_admin', 'supply_lead')
  )
  -- Or assigned to current user
  OR asignado_a = auth.uid()
);

-- Only sales team can modify leads
CREATE POLICY "Equipo ventas modifica leads" 
ON public.leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'ejecutivo_ventas', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'ejecutivo_ventas', 'supply_admin')
  )
);

-- 5. Fix vapi_call_logs table - highly sensitive call data
DROP POLICY IF EXISTS "call_logs_restricted_access" ON public.vapi_call_logs;

CREATE POLICY "Call logs solo para roles autorizados" 
ON public.vapi_call_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'ejecutivo_ventas')
  )
);

-- Only admin can modify call logs
CREATE POLICY "Admin modifica call logs" 
ON public.vapi_call_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- 6. Ensure candidatos_custodios has proper restrictions (already has some policies but let's verify)
-- The existing policies look mostly correct, but let's add a more restrictive read policy

DROP POLICY IF EXISTS "candidatos_authenticated_read" ON public.candidatos_custodios;

CREATE POLICY "Candidatos para reclutadores autorizados" 
ON public.candidatos_custodios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
  )
);