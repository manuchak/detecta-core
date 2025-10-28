-- =====================================================
-- FIX: Restringir acceso a tablas WMS según roles
-- Compatible con useWMSAccess.ts
-- =====================================================

-- =====================================================
-- FUNCIÓN HELPER: Verificar acceso WMS
-- =====================================================
CREATE OR REPLACE FUNCTION public.user_has_wms_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner',
      'admin',
      'monitoring_supervisor',
      'monitoring',
      'coordinador_operaciones',
      'supply_admin'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_wms_access() TO authenticated;

COMMENT ON FUNCTION public.user_has_wms_access() IS 
'Verifica si el usuario actual tiene acceso al módulo WMS';

-- =====================================================
-- TABLA 1: proveedores
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.proveedores;

CREATE POLICY "wms_roles_ven_proveedores"
ON public.proveedores
FOR SELECT
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_proveedores"
ON public.proveedores
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- =====================================================
-- TABLA 2: productos_inventario
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.productos_inventario;

CREATE POLICY "wms_roles_ven_productos"
ON public.productos_inventario
FOR SELECT
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_productos"
ON public.productos_inventario
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
);

-- =====================================================
-- TABLA 3: ordenes_compra
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.ordenes_compra;

CREATE POLICY "wms_roles_ven_ordenes"
ON public.ordenes_compra
FOR SELECT
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_ordenes"
ON public.ordenes_compra
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- =====================================================
-- TABLA 4: categorias_productos
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.categorias_productos;

CREATE POLICY "wms_roles_ven_categorias" 
ON public.categorias_productos
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_categorias" 
ON public.categorias_productos
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- =====================================================
-- TABLA 5: stock_productos
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.stock_productos;

CREATE POLICY "wms_roles_ven_stock" 
ON public.stock_productos
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_stock" 
ON public.stock_productos
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
);

-- =====================================================
-- TABLA 6: detalles_orden_compra
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.detalles_orden_compra;

CREATE POLICY "wms_roles_ven_detalles_orden" 
ON public.detalles_orden_compra
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_detalles_orden" 
ON public.detalles_orden_compra
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- =====================================================
-- TABLA 7: movimientos_inventario
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.movimientos_inventario;

CREATE POLICY "wms_roles_ven_movimientos" 
ON public.movimientos_inventario
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_movimientos" 
ON public.movimientos_inventario
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
);

-- =====================================================
-- TABLA 8: productos_serie
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.productos_serie;

CREATE POLICY "wms_roles_ven_series" 
ON public.productos_serie
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_series" 
ON public.productos_serie
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- =====================================================
-- TABLA 9: configuraciones_producto
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.configuraciones_producto;

CREATE POLICY "wms_roles_ven_configuraciones" 
ON public.configuraciones_producto
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_configuraciones" 
ON public.configuraciones_producto
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin')
  )
);

-- =====================================================
-- TABLA 10: recepciones_mercancia
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.recepciones_mercancia;

CREATE POLICY "wms_roles_ven_recepciones" 
ON public.recepciones_mercancia
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_recepciones" 
ON public.recepciones_mercancia
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
);

-- =====================================================
-- TABLA 11: detalles_recepcion
-- =====================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.detalles_recepcion;

CREATE POLICY "wms_roles_ven_detalles_recepcion" 
ON public.detalles_recepcion
FOR SELECT 
USING (public.user_has_wms_access());

CREATE POLICY "wms_admins_gestionan_detalles_recepcion" 
ON public.detalles_recepcion
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones')
  )
);