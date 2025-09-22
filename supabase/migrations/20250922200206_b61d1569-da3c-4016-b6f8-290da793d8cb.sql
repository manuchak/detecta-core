-- SEMANA 1 - PARTE 2: Crear tabla de indisponibilidades y vista optimizada

-- 1. Crear tabla para gestionar indisponibilidades temporales
CREATE TABLE IF NOT EXISTS public.custodio_indisponibilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custodio_id UUID NOT NULL REFERENCES public.custodios_operativos(id) ON DELETE CASCADE,
    tipo_indisponibilidad TEXT NOT NULL CHECK (tipo_indisponibilidad IN (
        'falla_mecanica', 'enfermedad', 'familiar', 'personal', 'mantenimiento', 'capacitacion', 'otro'
    )),
    motivo TEXT NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_fin_estimada TIMESTAMP WITH TIME ZONE,
    fecha_fin_real TIMESTAMP WITH TIME ZONE,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'resuelto', 'extendido', 'cancelado')),
    severidad TEXT DEFAULT 'media' CHECK (severidad IN ('baja', 'media', 'alta')),
    requiere_seguimiento BOOLEAN DEFAULT false,
    notas TEXT,
    reportado_por UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_custodio_indisponibilidades_custodio_id ON public.custodio_indisponibilidades(custodio_id);
CREATE INDEX IF NOT EXISTS idx_custodio_indisponibilidades_estado ON public.custodio_indisponibilidades(estado);
CREATE INDEX IF NOT EXISTS idx_custodio_indisponibilidades_fecha_inicio ON public.custodio_indisponibilidades(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_custodio_indisponibilidades_fecha_fin_estimada ON public.custodio_indisponibilidades(fecha_fin_estimada);

-- 3. Crear vista para custodios operativos disponibles (filtro de 90 días y nuevos)
CREATE OR REPLACE VIEW public.custodios_operativos_disponibles AS
SELECT 
    co.*,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.custodio_indisponibilidades ci 
            WHERE ci.custodio_id = co.id 
            AND ci.estado = 'activo'
            AND (ci.fecha_fin_estimada IS NULL OR ci.fecha_fin_estimada > now())
        ) THEN 'temporalmente_indisponible'::disponibilidad_custodio
        ELSE co.disponibilidad
    END as disponibilidad_efectiva,
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', ci.id,
                'tipo_indisponibilidad', ci.tipo_indisponibilidad,
                'motivo', ci.motivo,
                'fecha_inicio', ci.fecha_inicio,
                'fecha_fin_estimada', ci.fecha_fin_estimada,
                'severidad', ci.severidad,
                'estado', ci.estado
            )
        ) FROM public.custodio_indisponibilidades ci 
        WHERE ci.custodio_id = co.id AND ci.estado = 'activo'),
        '[]'::json
    ) as indisponibilidades_activas
FROM public.custodios_operativos co
WHERE 
    -- Filtro: Solo custodios con actividad en los últimos 90 días O nuevos (creados en últimos 30 días)
    (
        co.fecha_ultimo_servicio >= (CURRENT_DATE - INTERVAL '90 days')
        OR 
        co.created_at >= (CURRENT_DATE - INTERVAL '30 days')
    )
    -- Excluir custodios marcados como inactivos permanentemente
    AND co.estado != 'inactivo';

-- 4. Función para auto-reactivar custodios cuando expire su indisponibilidad
CREATE OR REPLACE FUNCTION public.auto_reactivar_custodios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Marcar como resueltas las indisponibilidades que ya expiraron
    UPDATE public.custodio_indisponibilidades 
    SET 
        estado = 'resuelto',
        fecha_fin_real = now(),
        updated_at = now()
    WHERE estado = 'activo' 
    AND fecha_fin_estimada IS NOT NULL 
    AND fecha_fin_estimada <= now();
    
    -- Reactivar custodios que no tienen indisponibilidades activas
    UPDATE public.custodios_operativos 
    SET 
        disponibilidad = 'disponible',
        updated_at = now()
    WHERE disponibilidad = 'temporalmente_indisponible'
    AND NOT EXISTS (
        SELECT 1 FROM public.custodio_indisponibilidades ci 
        WHERE ci.custodio_id = custodios_operativos.id 
        AND ci.estado = 'activo'
    );
END;
$$;

-- 5. Trigger para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION public.update_custodio_indisponibilidades_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_custodio_indisponibilidades_updated_at ON public.custodio_indisponibilidades;
CREATE TRIGGER update_custodio_indisponibilidades_updated_at
    BEFORE UPDATE ON public.custodio_indisponibilidades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_custodio_indisponibilidades_updated_at();

-- 6. Trigger para actualizar disponibilidad del custodio automáticamente
CREATE OR REPLACE FUNCTION public.sync_custodio_disponibilidad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Si se crea una nueva indisponibilidad activa, marcar custodio como temporalmente indisponible
    IF TG_OP = 'INSERT' AND NEW.estado = 'activo' THEN
        UPDATE public.custodios_operativos 
        SET disponibilidad = 'temporalmente_indisponible'
        WHERE id = NEW.custodio_id;
    END IF;
    
    -- Si se resuelve una indisponibilidad, verificar si debe reactivarse el custodio
    IF TG_OP = 'UPDATE' AND OLD.estado = 'activo' AND NEW.estado IN ('resuelto', 'cancelado') THEN
        -- Solo reactivar si no hay otras indisponibilidades activas
        IF NOT EXISTS (
            SELECT 1 FROM public.custodio_indisponibilidades 
            WHERE custodio_id = NEW.custodio_id 
            AND estado = 'activo'
            AND id != NEW.id
        ) THEN
            UPDATE public.custodios_operativos 
            SET disponibilidad = 'disponible'
            WHERE id = NEW.custodio_id 
            AND disponibilidad = 'temporalmente_indisponible';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_custodio_disponibilidad ON public.custodio_indisponibilidades;
CREATE TRIGGER sync_custodio_disponibilidad
    AFTER INSERT OR UPDATE ON public.custodio_indisponibilidades
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_custodio_disponibilidad();

-- 7. RLS Policies para la nueva tabla
ALTER TABLE public.custodio_indisponibilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custodio_indisponibilidades_authenticated_read" ON public.custodio_indisponibilidades
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "custodio_indisponibilidades_authorized_insert" ON public.custodio_indisponibilidades
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead')
        )
    );

CREATE POLICY "custodio_indisponibilidades_authorized_update" ON public.custodio_indisponibilidades
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead')
        )
    );

CREATE POLICY "custodio_indisponibilidades_admin_delete" ON public.custodio_indisponibilidades
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );