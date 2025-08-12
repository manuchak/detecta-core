-- 1) Extensiones necesarias
-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Ampliar stock_productos con columnas para RMA y Desecho
ALTER TABLE public.stock_productos
  ADD COLUMN IF NOT EXISTS cantidad_rma integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_desecho integer NOT NULL DEFAULT 0;

-- 3) Crear tabla de devoluciones a proveedor (RMA)
CREATE TABLE IF NOT EXISTS public.devoluciones_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_rma text,
  proveedor_id uuid,
  estado text NOT NULL DEFAULT 'iniciada',
  total_items integer NOT NULL DEFAULT 0,
  total_valor numeric NOT NULL DEFAULT 0,
  notas text,
  evidencia_urls text[] DEFAULT '{}'::text[],
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Detalle de devoluciones
CREATE TABLE IF NOT EXISTS public.devoluciones_proveedor_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucion_id uuid NOT NULL REFERENCES public.devoluciones_proveedor(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  seriales text[] DEFAULT '{}'::text[],
  motivo text,
  costo_unitario numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  estado_item text NOT NULL DEFAULT 'pendiente',
  evidencia_urls text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Tabla de desechos de inventario
CREATE TABLE IF NOT EXISTS public.desechos_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  motivo text,
  seriales text[] DEFAULT '{}'::text[],
  costo_unitario numeric DEFAULT 0,
  valor_total numeric DEFAULT 0,
  estado text NOT NULL DEFAULT 'registrado',
  evidencia_urls text[] DEFAULT '{}'::text[],
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Habilitar RLS
ALTER TABLE public.devoluciones_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones_proveedor_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desechos_inventario ENABLE ROW LEVEL SECURITY;

-- 7) Políticas RLS: lectura para autenticados
DO $$ BEGIN
  -- devoluciones_proveedor
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devoluciones_proveedor' AND policyname = 'devoluciones_select_auth'
  ) THEN
    CREATE POLICY devoluciones_select_auth ON public.devoluciones_proveedor
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devoluciones_proveedor' AND policyname = 'devoluciones_manage_admins'
  ) THEN
    CREATE POLICY devoluciones_manage_admins ON public.devoluciones_proveedor
      FOR ALL USING (public.check_admin_secure() OR public.user_has_role_direct('supply_admin'))
      WITH CHECK (public.check_admin_secure() OR public.user_has_role_direct('supply_admin'));
  END IF;

  -- devoluciones_proveedor_detalle
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devoluciones_proveedor_detalle' AND policyname = 'devoluciones_detalle_select_auth'
  ) THEN
    CREATE POLICY devoluciones_detalle_select_auth ON public.devoluciones_proveedor_detalle
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'devoluciones_proveedor_detalle' AND policyname = 'devoluciones_detalle_manage_admins'
  ) THEN
    CREATE POLICY devoluciones_detalle_manage_admins ON public.devoluciones_proveedor_detalle
      FOR ALL USING (public.check_admin_secure() OR public.user_has_role_direct('supply_admin'))
      WITH CHECK (public.check_admin_secure() OR public.user_has_role_direct('supply_admin'));
  END IF;

  -- desechos_inventario
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'desechos_inventario' AND policyname = 'desechos_select_auth'
  ) THEN
    CREATE POLICY desechos_select_auth ON public.desechos_inventario
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'desechos_inventario' AND policyname = 'desechos_manage_admins'
  ) THEN
    CREATE POLICY desechos_manage_admins ON public.desechos_inventario
      FOR ALL USING (public.check_admin_secure() OR public.user_has_role_direct('supply_admin'))
      WITH CHECK (public.check_admin_secure() OR public.user_has_role_direct('supply_admin'));
  END IF;
END $$;
