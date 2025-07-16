-- Crear tabla de logs de auditoría para productos
CREATE TABLE IF NOT EXISTS public.audit_log_productos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID NOT NULL,
    accion TEXT NOT NULL, -- 'crear', 'actualizar', 'eliminar'
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id UUID NOT NULL,
    fecha_accion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    direccion_ip INET,
    user_agent TEXT,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.audit_log_productos ENABLE ROW LEVEL SECURITY;

-- Crear política para que solo admins puedan ver los logs
CREATE POLICY "Solo admins pueden ver logs de auditoría"
ON public.audit_log_productos
FOR SELECT
USING (can_manage_wms());

-- Crear política para que cualquier usuario autenticado pueda insertar logs
CREATE POLICY "Usuarios autenticados pueden crear logs"
ON public.audit_log_productos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Crear índices para mejorar performance
CREATE INDEX idx_audit_log_productos_producto_id ON public.audit_log_productos(producto_id);
CREATE INDEX idx_audit_log_productos_usuario_id ON public.audit_log_productos(usuario_id);
CREATE INDEX idx_audit_log_productos_fecha_accion ON public.audit_log_productos(fecha_accion DESC);
CREATE INDEX idx_audit_log_productos_accion ON public.audit_log_productos(accion);