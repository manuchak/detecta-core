-- =====================================================
-- LMS MODULE: Complete Database Schema
-- =====================================================

-- ===================
-- 1. CURSOS
-- ===================
CREATE TABLE public.lms_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(30) UNIQUE NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  imagen_portada_url TEXT,
  categoria VARCHAR(50), -- 'onboarding', 'procesos', 'herramientas', 'compliance', 'habilidades'
  nivel VARCHAR(20) DEFAULT 'basico' CHECK (nivel IN ('basico', 'intermedio', 'avanzado')),
  duracion_estimada_min INTEGER DEFAULT 0,
  
  -- Obligatoriedad
  es_obligatorio BOOLEAN DEFAULT false,
  roles_objetivo TEXT[] DEFAULT '{}', -- roles que deben tomarlo
  plazo_dias_default INTEGER DEFAULT 30, -- días para completar desde inscripción
  
  -- Estado
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  publicado BOOLEAN DEFAULT false,
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- 2. MÓDULOS
-- ===================
CREATE TABLE public.lms_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.lms_cursos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- 3. CONTENIDOS
-- ===================
CREATE TABLE public.lms_contenidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.lms_modulos(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('video', 'documento', 'embed', 'texto_enriquecido', 'quiz', 'interactivo')),
  titulo VARCHAR(200) NOT NULL,
  contenido JSONB NOT NULL DEFAULT '{}',
  duracion_min INTEGER DEFAULT 0,
  es_obligatorio BOOLEAN DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentario sobre estructura de contenido JSONB:
-- video: { "url": "...", "provider": "youtube|vimeo|storage", "subtitles_url": null }
-- documento: { "url": "...", "tipo": "pdf|docx" }
-- embed: { "html": "<iframe...>", "altura": 400 }
-- texto_enriquecido: { "html": "<p>...</p>" }
-- quiz: { "preguntas_ids": ["uuid1", "uuid2"], "puntuacion_minima": 70, "intentos_permitidos": 3 }
-- interactivo: { "tipo": "flashcards|timeline|dragdrop|hotspots", "data": {...} }

-- ===================
-- 4. PREGUNTAS (Banco de preguntas para quizzes)
-- ===================
CREATE TABLE public.lms_preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES public.lms_cursos(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('opcion_multiple', 'verdadero_falso', 'respuesta_corta', 'ordenar')),
  pregunta TEXT NOT NULL,
  opciones JSONB DEFAULT '[]', -- [{ "texto": "...", "es_correcta": true, "feedback": "..." }]
  explicacion TEXT,
  puntos INTEGER DEFAULT 10,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- 5. INSCRIPCIONES
-- ===================
CREATE TABLE public.lms_inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.lms_cursos(id) ON DELETE CASCADE,
  
  -- Tipo de inscripción
  tipo_inscripcion VARCHAR(20) DEFAULT 'voluntaria' CHECK (tipo_inscripcion IN ('obligatoria', 'voluntaria', 'asignada')),
  asignado_por UUID REFERENCES auth.users(id),
  
  -- Fechas
  fecha_inscripcion TIMESTAMPTZ DEFAULT NOW(),
  fecha_inicio TIMESTAMPTZ,
  fecha_completado TIMESTAMPTZ,
  fecha_limite TIMESTAMPTZ,
  
  -- Estado y progreso
  estado VARCHAR(20) DEFAULT 'inscrito' CHECK (estado IN ('inscrito', 'en_progreso', 'completado', 'vencido', 'abandonado')),
  progreso_porcentaje DECIMAL(5,2) DEFAULT 0,
  calificacion_final DECIMAL(5,2),
  
  -- Certificado
  certificado_generado BOOLEAN DEFAULT false,
  certificado_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(usuario_id, curso_id)
);

-- ===================
-- 6. PROGRESO (Tracking granular)
-- ===================
CREATE TABLE public.lms_progreso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID NOT NULL REFERENCES public.lms_inscripciones(id) ON DELETE CASCADE,
  contenido_id UUID NOT NULL REFERENCES public.lms_contenidos(id) ON DELETE CASCADE,
  
  -- Estado
  iniciado BOOLEAN DEFAULT false,
  completado BOOLEAN DEFAULT false,
  fecha_inicio TIMESTAMPTZ,
  fecha_completado TIMESTAMPTZ,
  
  -- Tiempo y vistas
  tiempo_dedicado_seg INTEGER DEFAULT 0,
  veces_visto INTEGER DEFAULT 1,
  
  -- Para videos
  video_posicion_seg INTEGER DEFAULT 0,
  video_porcentaje_visto DECIMAL(5,2) DEFAULT 0,
  
  -- Para quizzes
  quiz_intentos INTEGER DEFAULT 0,
  quiz_mejor_puntaje DECIMAL(5,2),
  quiz_ultimo_puntaje DECIMAL(5,2),
  quiz_respuestas JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(inscripcion_id, contenido_id)
);

-- ===================
-- ÍNDICES
-- ===================
CREATE INDEX idx_lms_cursos_publicado ON public.lms_cursos(publicado) WHERE activo = true;
CREATE INDEX idx_lms_cursos_obligatorio ON public.lms_cursos(es_obligatorio) WHERE publicado = true;
CREATE INDEX idx_lms_modulos_curso ON public.lms_modulos(curso_id, orden);
CREATE INDEX idx_lms_contenidos_modulo ON public.lms_contenidos(modulo_id, orden);
CREATE INDEX idx_lms_inscripciones_usuario ON public.lms_inscripciones(usuario_id, estado);
CREATE INDEX idx_lms_inscripciones_curso ON public.lms_inscripciones(curso_id);
CREATE INDEX idx_lms_inscripciones_vencimiento ON public.lms_inscripciones(fecha_limite) WHERE estado NOT IN ('completado', 'abandonado');
CREATE INDEX idx_lms_progreso_inscripcion ON public.lms_progreso(inscripcion_id);
CREATE INDEX idx_lms_preguntas_curso ON public.lms_preguntas(curso_id) WHERE activa = true;

-- ===================
-- TRIGGERS: Updated_at
-- ===================
CREATE TRIGGER update_lms_cursos_updated_at
  BEFORE UPDATE ON public.lms_cursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lms_modulos_updated_at
  BEFORE UPDATE ON public.lms_modulos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lms_contenidos_updated_at
  BEFORE UPDATE ON public.lms_contenidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lms_inscripciones_updated_at
  BEFORE UPDATE ON public.lms_inscripciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lms_progreso_updated_at
  BEFORE UPDATE ON public.lms_progreso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lms_preguntas_updated_at
  BEFORE UPDATE ON public.lms_preguntas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================
-- TRIGGER: Inscripción automática cuando se publica curso obligatorio
-- ===================
CREATE OR REPLACE FUNCTION public.lms_inscribir_usuarios_curso_obligatorio()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario RECORD;
  v_plazo_dias INTEGER;
BEGIN
  -- Solo actuar cuando se publica un curso obligatorio por primera vez
  IF NEW.publicado = true AND NEW.es_obligatorio = true 
     AND (OLD IS NULL OR OLD.publicado = false) THEN
    
    v_plazo_dias := COALESCE(NEW.plazo_dias_default, 30);
    
    -- Inscribir a todos los usuarios de los roles objetivo
    FOR v_usuario IN
      SELECT DISTINCT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role = ANY(NEW.roles_objetivo)
        AND ur.is_active = true
    LOOP
      INSERT INTO public.lms_inscripciones (
        usuario_id, 
        curso_id, 
        tipo_inscripcion,
        fecha_limite,
        estado
      )
      VALUES (
        v_usuario.user_id,
        NEW.id,
        'obligatoria',
        NOW() + (v_plazo_dias || ' days')::INTERVAL,
        'inscrito'
      )
      ON CONFLICT (usuario_id, curso_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_lms_inscribir_curso_obligatorio
  AFTER INSERT OR UPDATE ON public.lms_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.lms_inscribir_usuarios_curso_obligatorio();

-- ===================
-- TRIGGER: Inscribir nuevos usuarios en cursos obligatorios de su rol
-- ===================
CREATE OR REPLACE FUNCTION public.lms_inscribir_nuevo_usuario_cursos_obligatorios()
RETURNS TRIGGER AS $$
DECLARE
  v_curso RECORD;
BEGIN
  -- Inscribir al nuevo usuario en todos los cursos obligatorios de su rol
  FOR v_curso IN
    SELECT c.id, c.plazo_dias_default
    FROM public.lms_cursos c
    WHERE c.publicado = true
      AND c.es_obligatorio = true
      AND c.activo = true
      AND NEW.role = ANY(c.roles_objetivo)
  LOOP
    INSERT INTO public.lms_inscripciones (
      usuario_id,
      curso_id,
      tipo_inscripcion,
      fecha_limite,
      estado
    )
    VALUES (
      NEW.user_id,
      v_curso.id,
      'obligatoria',
      NOW() + (COALESCE(v_curso.plazo_dias_default, 30) || ' days')::INTERVAL,
      'inscrito'
    )
    ON CONFLICT (usuario_id, curso_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_lms_inscribir_nuevo_usuario
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.lms_inscribir_nuevo_usuario_cursos_obligatorios();

-- ===================
-- FUNCTION: Calcular progreso de inscripción
-- ===================
CREATE OR REPLACE FUNCTION public.lms_calcular_progreso(p_inscripcion_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_completados INTEGER;
  v_porcentaje DECIMAL(5,2);
  v_calificacion DECIMAL(5,2);
  v_nuevo_estado VARCHAR(20);
  v_inscripcion RECORD;
BEGIN
  -- Obtener inscripción actual
  SELECT * INTO v_inscripcion FROM public.lms_inscripciones WHERE id = p_inscripcion_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Inscripción no encontrada');
  END IF;
  
  -- Contar contenidos obligatorios del curso
  SELECT COUNT(*)
  INTO v_total
  FROM public.lms_contenidos c
  JOIN public.lms_modulos m ON c.modulo_id = m.id
  WHERE m.curso_id = v_inscripcion.curso_id
    AND c.es_obligatorio = true
    AND c.activo = true
    AND m.activo = true;
  
  -- Contar completados
  SELECT COUNT(*)
  INTO v_completados
  FROM public.lms_progreso p
  JOIN public.lms_contenidos c ON p.contenido_id = c.id
  JOIN public.lms_modulos m ON c.modulo_id = m.id
  WHERE p.inscripcion_id = p_inscripcion_id
    AND p.completado = true
    AND c.es_obligatorio = true
    AND c.activo = true
    AND m.activo = true;
  
  -- Calcular porcentaje
  v_porcentaje := CASE WHEN v_total > 0 
    THEN ROUND((v_completados::DECIMAL / v_total) * 100, 2)
    ELSE 0 END;
  
  -- Calcular calificación promedio de quizzes
  SELECT COALESCE(AVG(p.quiz_mejor_puntaje), 0)
  INTO v_calificacion
  FROM public.lms_progreso p
  JOIN public.lms_contenidos c ON p.contenido_id = c.id
  WHERE p.inscripcion_id = p_inscripcion_id
    AND c.tipo = 'quiz'
    AND p.quiz_mejor_puntaje IS NOT NULL;
  
  -- Determinar nuevo estado
  v_nuevo_estado := CASE 
    WHEN v_porcentaje >= 100 THEN 'completado'
    WHEN v_completados > 0 OR v_inscripcion.fecha_inicio IS NOT NULL THEN 'en_progreso'
    ELSE v_inscripcion.estado
  END;
  
  -- Actualizar inscripción
  UPDATE public.lms_inscripciones
  SET progreso_porcentaje = v_porcentaje,
      calificacion_final = NULLIF(v_calificacion, 0),
      estado = v_nuevo_estado,
      fecha_completado = CASE 
        WHEN v_porcentaje >= 100 AND fecha_completado IS NULL THEN NOW()
        ELSE fecha_completado
      END,
      updated_at = NOW()
  WHERE id = p_inscripcion_id;
  
  RETURN json_build_object(
    'total', v_total,
    'completados', v_completados,
    'porcentaje', v_porcentaje,
    'calificacion', v_calificacion,
    'estado', v_nuevo_estado
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================
-- FUNCTION: Obtener cursos disponibles para usuario
-- ===================
CREATE OR REPLACE FUNCTION public.lms_get_cursos_disponibles(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  codigo VARCHAR(30),
  titulo VARCHAR(200),
  descripcion TEXT,
  imagen_portada_url TEXT,
  categoria VARCHAR(50),
  nivel VARCHAR(20),
  duracion_estimada_min INTEGER,
  es_obligatorio BOOLEAN,
  orden INTEGER,
  -- Inscripción del usuario (si existe)
  inscripcion_id UUID,
  inscripcion_estado VARCHAR(20),
  inscripcion_progreso DECIMAL(5,2),
  inscripcion_fecha_limite TIMESTAMPTZ,
  tipo_inscripcion VARCHAR(20)
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    c.id,
    c.codigo,
    c.titulo,
    c.descripcion,
    c.imagen_portada_url,
    c.categoria,
    c.nivel,
    c.duracion_estimada_min,
    c.es_obligatorio,
    c.orden,
    i.id AS inscripcion_id,
    i.estado AS inscripcion_estado,
    i.progreso_porcentaje AS inscripcion_progreso,
    i.fecha_limite AS inscripcion_fecha_limite,
    i.tipo_inscripcion
  FROM public.lms_cursos c
  LEFT JOIN public.lms_inscripciones i ON i.curso_id = c.id AND i.usuario_id = v_user_id
  WHERE c.publicado = true
    AND c.activo = true
  ORDER BY c.es_obligatorio DESC, c.orden, c.titulo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================
-- FUNCTION: Inscribirse voluntariamente a un curso
-- ===================
CREATE OR REPLACE FUNCTION public.lms_inscribirse_curso(
  p_curso_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_curso RECORD;
  v_inscripcion_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Verificar que el curso existe y está publicado
  SELECT * INTO v_curso 
  FROM public.lms_cursos 
  WHERE id = p_curso_id AND publicado = true AND activo = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Curso no disponible');
  END IF;
  
  -- Crear inscripción
  INSERT INTO public.lms_inscripciones (
    usuario_id,
    curso_id,
    tipo_inscripcion,
    fecha_limite,
    estado
  )
  VALUES (
    v_user_id,
    p_curso_id,
    'voluntaria',
    NOW() + (COALESCE(v_curso.plazo_dias_default, 30) || ' days')::INTERVAL,
    'inscrito'
  )
  ON CONFLICT (usuario_id, curso_id) DO UPDATE
    SET updated_at = NOW()
  RETURNING id INTO v_inscripcion_id;
  
  RETURN json_build_object(
    'success', true, 
    'inscripcion_id', v_inscripcion_id,
    'mensaje', 'Inscripción exitosa'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================
-- FUNCTION: Marcar contenido como completado
-- ===================
CREATE OR REPLACE FUNCTION public.lms_marcar_contenido_completado(
  p_contenido_id UUID,
  p_datos_extra JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_inscripcion_id UUID;
  v_progreso_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Obtener inscripción del usuario para este contenido
  SELECT i.id INTO v_inscripcion_id
  FROM public.lms_inscripciones i
  JOIN public.lms_cursos c ON c.id = i.curso_id
  JOIN public.lms_modulos m ON m.curso_id = c.id
  JOIN public.lms_contenidos cont ON cont.modulo_id = m.id
  WHERE cont.id = p_contenido_id
    AND i.usuario_id = v_user_id;
  
  IF v_inscripcion_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No inscrito en este curso');
  END IF;
  
  -- Actualizar o crear registro de progreso
  INSERT INTO public.lms_progreso (
    inscripcion_id,
    contenido_id,
    iniciado,
    completado,
    fecha_inicio,
    fecha_completado,
    tiempo_dedicado_seg,
    video_porcentaje_visto,
    quiz_ultimo_puntaje,
    quiz_mejor_puntaje,
    quiz_intentos,
    quiz_respuestas
  )
  VALUES (
    v_inscripcion_id,
    p_contenido_id,
    true,
    true,
    COALESCE((p_datos_extra->>'fecha_inicio')::TIMESTAMPTZ, NOW()),
    NOW(),
    COALESCE((p_datos_extra->>'tiempo_dedicado_seg')::INTEGER, 0),
    COALESCE((p_datos_extra->>'video_porcentaje_visto')::DECIMAL, 100),
    (p_datos_extra->>'quiz_puntaje')::DECIMAL,
    (p_datos_extra->>'quiz_puntaje')::DECIMAL,
    COALESCE((p_datos_extra->>'quiz_intentos')::INTEGER, 0),
    p_datos_extra->'quiz_respuestas'
  )
  ON CONFLICT (inscripcion_id, contenido_id) DO UPDATE
    SET completado = true,
        fecha_completado = NOW(),
        tiempo_dedicado_seg = EXCLUDED.tiempo_dedicado_seg + lms_progreso.tiempo_dedicado_seg,
        veces_visto = lms_progreso.veces_visto + 1,
        video_porcentaje_visto = GREATEST(lms_progreso.video_porcentaje_visto, EXCLUDED.video_porcentaje_visto),
        quiz_ultimo_puntaje = COALESCE(EXCLUDED.quiz_ultimo_puntaje, lms_progreso.quiz_ultimo_puntaje),
        quiz_mejor_puntaje = GREATEST(COALESCE(EXCLUDED.quiz_mejor_puntaje, 0), COALESCE(lms_progreso.quiz_mejor_puntaje, 0)),
        quiz_intentos = COALESCE(EXCLUDED.quiz_intentos, lms_progreso.quiz_intentos),
        quiz_respuestas = COALESCE(EXCLUDED.quiz_respuestas, lms_progreso.quiz_respuestas),
        updated_at = NOW()
  RETURNING id INTO v_progreso_id;
  
  -- Actualizar fecha_inicio de inscripción si es la primera actividad
  UPDATE public.lms_inscripciones
  SET fecha_inicio = COALESCE(fecha_inicio, NOW()),
      estado = CASE WHEN estado = 'inscrito' THEN 'en_progreso' ELSE estado END
  WHERE id = v_inscripcion_id;
  
  -- Recalcular progreso
  PERFORM public.lms_calcular_progreso(v_inscripcion_id);
  
  RETURN json_build_object(
    'success', true,
    'progreso_id', v_progreso_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================
-- RLS POLICIES
-- ===================
ALTER TABLE public.lms_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_contenidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_progreso ENABLE ROW LEVEL SECURITY;

-- Cursos: Todos pueden ver publicados, admin/owner/supply_admin pueden crear/editar
CREATE POLICY "lms_cursos_select_publicados" ON public.lms_cursos
  FOR SELECT USING (
    publicado = true AND activo = true
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_cursos_insert_admin" ON public.lms_cursos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_cursos_update_admin" ON public.lms_cursos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_cursos_delete_admin" ON public.lms_cursos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

-- Módulos: Igual que cursos
CREATE POLICY "lms_modulos_select" ON public.lms_modulos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lms_cursos c
      WHERE c.id = lms_modulos.curso_id
        AND (c.publicado = true OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'owner', 'supply_admin')
            AND ur.is_active = true
        ))
    )
  );

CREATE POLICY "lms_modulos_insert_admin" ON public.lms_modulos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_modulos_update_admin" ON public.lms_modulos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_modulos_delete_admin" ON public.lms_modulos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

-- Contenidos: Igual que módulos
CREATE POLICY "lms_contenidos_select" ON public.lms_contenidos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lms_modulos m
      JOIN public.lms_cursos c ON c.id = m.curso_id
      WHERE m.id = lms_contenidos.modulo_id
        AND (c.publicado = true OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'owner', 'supply_admin')
            AND ur.is_active = true
        ))
    )
  );

CREATE POLICY "lms_contenidos_insert_admin" ON public.lms_contenidos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_contenidos_update_admin" ON public.lms_contenidos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_contenidos_delete_admin" ON public.lms_contenidos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

-- Preguntas: Admin full, usuarios pueden ver durante quiz
CREATE POLICY "lms_preguntas_select" ON public.lms_preguntas
  FOR SELECT USING (
    activa = true
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_preguntas_insert_admin" ON public.lms_preguntas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_preguntas_update_admin" ON public.lms_preguntas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_preguntas_delete_admin" ON public.lms_preguntas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

-- Inscripciones: Usuario ve las suyas, admin ve todas
CREATE POLICY "lms_inscripciones_select" ON public.lms_inscripciones
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'bi')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_inscripciones_insert" ON public.lms_inscripciones
  FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_inscripciones_update" ON public.lms_inscripciones
  FOR UPDATE USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

-- Progreso: Usuario ve/edita el suyo, admin ve todo
CREATE POLICY "lms_progreso_select" ON public.lms_progreso
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lms_inscripciones i
      WHERE i.id = lms_progreso.inscripcion_id
        AND (i.usuario_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'owner', 'supply_admin', 'bi')
            AND ur.is_active = true
        ))
    )
  );

CREATE POLICY "lms_progreso_insert" ON public.lms_progreso
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lms_inscripciones i
      WHERE i.id = lms_progreso.inscripcion_id
        AND i.usuario_id = auth.uid()
    )
  );

CREATE POLICY "lms_progreso_update" ON public.lms_progreso
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lms_inscripciones i
      WHERE i.id = lms_progreso.inscripcion_id
        AND i.usuario_id = auth.uid()
    )
  );

-- ===================
-- STORAGE BUCKET
-- ===================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lms-media', 
  'lms-media', 
  true, 
  104857600, -- 100MB
  ARRAY[
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY "lms_media_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'lms-media');

CREATE POLICY "lms_media_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lms-media'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_media_update_admin" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'lms-media'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY "lms_media_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lms-media'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'owner', 'supply_admin')
        AND ur.is_active = true
    )
  );