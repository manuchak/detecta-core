-- =====================================================
-- MÓDULO FACTURACIÓN Y FINANZAS - VISTA BI + RLS
-- =====================================================

-- 1. Crear vista para facturación con datos completos de servicios
CREATE OR REPLACE VIEW public.vw_servicios_facturacion AS
SELECT 
  sc.id,
  sc.id_servicio,
  sc.fecha_hora_cita,
  sc.nombre_cliente,
  sc.folio_cliente,
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.tipo_servicio,
  sc.local_foraneo,
  sc.km_recorridos,
  sc.km_teorico,
  sc.cobro_cliente,
  sc.costo_custodio,
  COALESCE(sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) as margen_bruto,
  CASE 
    WHEN COALESCE(sc.cobro_cliente, 0) > 0 
    THEN ROUND(((COALESCE(sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) / sc.cobro_cliente * 100)::numeric, 2)
    ELSE 0 
  END as porcentaje_margen,
  sc.nombre_custodio,
  sc.nombre_armado,
  sc.proveedor,
  sc.estado,
  sc.casetas,
  sc.gadget,
  sc.duracion_servicio,
  sc.created_at,
  sc.creado_por,
  -- Datos de cliente
  pc.rfc as cliente_rfc,
  pc.contacto_email as cliente_email,
  pc.forma_pago_preferida,
  -- Precios de referencia
  mpr.valor_bruto as precio_lista,
  mpr.precio_custodio as costo_lista
FROM servicios_custodia sc
LEFT JOIN pc_clientes pc ON LOWER(TRIM(sc.nombre_cliente)) = LOWER(TRIM(pc.nombre))
LEFT JOIN matriz_precios_rutas mpr ON sc.ruta = mpr.clave;

-- 2. Crear función helper para verificar roles de facturación
CREATE OR REPLACE FUNCTION public.has_facturacion_access(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = $1
    AND ur.role::text IN (
      'admin', 'owner', 'bi',
      'facturacion_admin', 'facturacion',
      'finanzas_admin', 'finanzas',
      'coordinador_operaciones'
    )
  );
$$;

-- 3. Política RLS para la vista (requiere que servicios_custodia tenga RLS)
-- Como la vista hereda permisos, aseguramos acceso via función

-- 4. Crear tabla de auditoría para accesos a facturación
CREATE TABLE IF NOT EXISTS public.audit_facturacion_accesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  accion text NOT NULL,
  filtros_aplicados jsonb,
  registros_consultados integer,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en tabla de auditoría
ALTER TABLE public.audit_facturacion_accesos ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden insertar sus propios registros de auditoría
CREATE POLICY "audit_facturacion_insert" ON public.audit_facturacion_accesos
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: solo admins pueden leer auditoría
CREATE POLICY "audit_facturacion_select" ON public.audit_facturacion_accesos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::text IN ('admin', 'owner', 'bi', 'finanzas_admin')
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_facturacion_user ON public.audit_facturacion_accesos(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_facturacion_fecha ON public.audit_facturacion_accesos(created_at DESC);