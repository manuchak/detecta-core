-- Agregar campos para mejorar la gestión de productos
ALTER TABLE public.productos_inventario 
ADD COLUMN IF NOT EXISTS estado_producto text DEFAULT 'activo' CHECK (estado_producto IN ('activo', 'inactivo', 'archivado', 'descontinuado')),
ADD COLUMN IF NOT EXISTS fecha_archivado timestamp with time zone,
ADD COLUMN IF NOT EXISTS motivo_archivado text,
ADD COLUMN IF NOT EXISTS archivado_por uuid REFERENCES auth.users(id);

-- Crear índice para mejorar consultas por estado
CREATE INDEX IF NOT EXISTS idx_productos_inventario_estado ON public.productos_inventario(estado_producto);

-- Actualizar productos existentes para usar el nuevo estado basado en el campo activo
UPDATE public.productos_inventario 
SET estado_producto = CASE 
    WHEN activo = true THEN 'activo'
    ELSE 'inactivo'
END
WHERE estado_producto = 'activo';

-- Función para archivar producto
CREATE OR REPLACE FUNCTION public.archivar_producto(
    p_producto_id uuid,
    p_motivo text DEFAULT 'Producto obsoleto'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    producto_existe boolean := false;
BEGIN
    -- Verificar que el usuario tenga permisos WMS
    IF NOT can_manage_wms() THEN
        RAISE EXCEPTION 'Sin permisos para archivar productos';
    END IF;
    
    -- Verificar que el producto existe y está activo
    SELECT EXISTS(
        SELECT 1 FROM productos_inventario 
        WHERE id = p_producto_id AND estado_producto = 'activo'
    ) INTO producto_existe;
    
    IF NOT producto_existe THEN
        RAISE EXCEPTION 'Producto no encontrado o ya está archivado';
    END IF;
    
    -- Archivar el producto
    UPDATE productos_inventario 
    SET 
        estado_producto = 'archivado',
        activo = false,
        fecha_archivado = now(),
        motivo_archivado = p_motivo,
        archivado_por = auth.uid(),
        updated_at = now()
    WHERE id = p_producto_id;
    
    -- Registrar en audit log
    INSERT INTO audit_log_productos (
        producto_id,
        accion,
        datos_anteriores,
        datos_nuevos,
        usuario_id,
        motivo
    ) SELECT 
        p_producto_id,
        'archivar',
        to_jsonb(p_old),
        to_jsonb(p_new),
        auth.uid(),
        p_motivo
    FROM (
        SELECT * FROM productos_inventario WHERE id = p_producto_id
    ) p_new,
    (
        SELECT 'activo'::text as estado_producto
    ) p_old;
    
    RETURN true;
END;
$$;

-- Función para marcar producto como inactivo
CREATE OR REPLACE FUNCTION public.marcar_producto_inactivo(
    p_producto_id uuid,
    p_motivo text DEFAULT 'Marcado como inactivo'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Verificar permisos
    IF NOT can_manage_wms() THEN
        RAISE EXCEPTION 'Sin permisos para modificar productos';
    END IF;
    
    -- Marcar como inactivo
    UPDATE productos_inventario 
    SET 
        estado_producto = 'inactivo',
        activo = false,
        updated_at = now()
    WHERE id = p_producto_id AND estado_producto = 'activo';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado o ya está inactivo';
    END IF;
    
    -- Registrar en audit log
    INSERT INTO audit_log_productos (
        producto_id,
        accion,
        datos_anteriores,
        datos_nuevos,
        usuario_id,
        motivo
    ) VALUES (
        p_producto_id,
        'desactivar',
        '{"estado_producto": "activo"}'::jsonb,
        '{"estado_producto": "inactivo"}'::jsonb,
        auth.uid(),
        p_motivo
    );
    
    RETURN true;
END;
$$;

-- Función para restaurar producto
CREATE OR REPLACE FUNCTION public.restaurar_producto(
    p_producto_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Verificar permisos
    IF NOT can_manage_wms() THEN
        RAISE EXCEPTION 'Sin permisos para modificar productos';
    END IF;
    
    -- Restaurar producto
    UPDATE productos_inventario 
    SET 
        estado_producto = 'activo',
        activo = true,
        fecha_archivado = null,
        motivo_archivado = null,
        archivado_por = null,
        updated_at = now()
    WHERE id = p_producto_id AND estado_producto IN ('inactivo', 'archivado');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado o ya está activo';
    END IF;
    
    -- Registrar en audit log
    INSERT INTO audit_log_productos (
        producto_id,
        accion,
        datos_anteriores,
        datos_nuevos,
        usuario_id,
        motivo
    ) VALUES (
        p_producto_id,
        'restaurar',
        '{"estado_producto": "inactivo"}'::jsonb,
        '{"estado_producto": "activo"}'::jsonb,
        auth.uid(),
        'Producto restaurado'
    );
    
    RETURN true;
END;
$$;