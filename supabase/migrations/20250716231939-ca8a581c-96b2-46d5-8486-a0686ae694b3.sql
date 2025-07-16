-- Corregir los errores de seguridad detectados por el linter de Supabase

-- 1. Habilitar RLS en programacion_instalaciones (errores 2 y 6)
ALTER TABLE public.programacion_instalaciones ENABLE ROW LEVEL SECURITY;

-- 2. Recrear vista_kits_instalacion sin SECURITY DEFINER y sin exponer auth.users (errores 1 y 4)
DROP VIEW IF EXISTS public.vista_kits_instalacion;

-- Recrear la vista sin SECURITY DEFINER y sin referencias a auth.users
CREATE VIEW public.vista_kits_instalacion AS
SELECT 
    ki.id,
    ki.nombre,
    ki.descripcion,
    ki.productos_incluidos,
    ki.tipo_instalacion,
    ki.precio_sugerido,
    ki.activo,
    ki.created_at,
    ki.updated_at
FROM public.kits_instalacion ki
WHERE ki.activo = true;

-- 3. Recrear vista_analisis_inventario sin SECURITY DEFINER (error 3)
DROP VIEW IF EXISTS public.vista_analisis_inventario;

CREATE VIEW public.vista_analisis_inventario AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.categoria_id,
    p.precio_compra,
    p.precio_venta,
    p.stock_actual,
    p.stock_minimo,
    p.stock_maximo,
    p.ubicacion_almacen,
    p.activo,
    p.created_at,
    p.updated_at,
    c.nombre as categoria_nombre
FROM public.productos_inventario p
LEFT JOIN public.categorias_productos c ON p.categoria_id = c.id;

-- 4. Recrear scheduled_calls_view sin SECURITY DEFINER (error 5)
DROP VIEW IF EXISTS public.scheduled_calls_view;

CREATE VIEW public.scheduled_calls_view AS
SELECT 
    sc.id,
    sc.lead_id,
    sc.scheduled_date,
    sc.status,
    sc.notes,
    sc.created_at,
    sc.updated_at,
    l.nombre_completo,
    l.telefono,
    l.email
FROM public.scheduled_calls sc
LEFT JOIN public.leads l ON sc.lead_id = l.id;

-- 5. Otorgar permisos apropiados a las vistas recreadas
GRANT SELECT ON public.vista_kits_instalacion TO authenticated;
GRANT SELECT ON public.vista_analisis_inventario TO authenticated;
GRANT SELECT ON public.scheduled_calls_view TO authenticated;