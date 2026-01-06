-- =====================================================
-- FASE 4: CERTIFICADOS Y GAMIFICACIÓN (CORREGIDA)
-- =====================================================

-- 1. SISTEMA DE CERTIFICADOS
CREATE TABLE public.lms_certificados_plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  plantilla_html TEXT NOT NULL,
  estilos_css TEXT,
  variables_disponibles TEXT[] DEFAULT ARRAY['nombre_usuario', 'titulo_curso', 'fecha_completado', 'calificacion', 'codigo_verificacion', 'duracion_curso'],
  es_default BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lms_certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID NOT NULL REFERENCES public.lms_inscripciones(id) ON DELETE CASCADE,
  plantilla_id UUID REFERENCES public.lms_certificados_plantillas(id),
  codigo_verificacion TEXT UNIQUE NOT NULL,
  fecha_emision TIMESTAMPTZ DEFAULT now(),
  datos_certificado JSONB NOT NULL,
  pdf_url TEXT,
  verificado_count INTEGER DEFAULT 0,
  ultima_verificacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_certificados_inscripcion ON public.lms_certificados(inscripcion_id);
CREATE INDEX idx_certificados_codigo ON public.lms_certificados(codigo_verificacion);

-- 2. SISTEMA DE GAMIFICACIÓN
CREATE TABLE public.lms_gamificacion_perfil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puntos_totales INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  racha_actual INTEGER DEFAULT 0,
  racha_maxima INTEGER DEFAULT 0,
  ultima_actividad DATE,
  cursos_completados INTEGER DEFAULT 0,
  quizzes_perfectos INTEGER DEFAULT 0,
  tiempo_total_estudio_min INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id)
);

CREATE TABLE public.lms_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT NOT NULL,
  categoria TEXT DEFAULT 'logro',
  puntos_otorga INTEGER DEFAULT 0,
  condicion_tipo TEXT NOT NULL,
  condicion_valor INTEGER DEFAULT 1,
  nivel_requerido INTEGER DEFAULT 1,
  es_secreto BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lms_badges_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.lms_badges(id) ON DELETE CASCADE,
  fecha_obtencion TIMESTAMPTZ DEFAULT now(),
  datos_contexto JSONB,
  notificado BOOLEAN DEFAULT false,
  UNIQUE(usuario_id, badge_id)
);

CREATE TABLE public.lms_puntos_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puntos INTEGER NOT NULL,
  tipo_accion TEXT NOT NULL,
  descripcion TEXT,
  referencia_id UUID,
  referencia_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lms_puntos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accion TEXT UNIQUE NOT NULL,
  puntos INTEGER NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_gamificacion_usuario ON public.lms_gamificacion_perfil(usuario_id);
CREATE INDEX idx_gamificacion_puntos ON public.lms_gamificacion_perfil(puntos_totales DESC);
CREATE INDEX idx_badges_usuario ON public.lms_badges_usuario(usuario_id);
CREATE INDEX idx_puntos_historial_usuario ON public.lms_puntos_historial(usuario_id);

-- Datos iniciales
INSERT INTO public.lms_puntos_config (accion, puntos, descripcion) VALUES
  ('contenido_video', 10, 'Completar un video'),
  ('contenido_documento', 5, 'Ver un documento'),
  ('contenido_texto', 5, 'Leer contenido de texto'),
  ('quiz_aprobado', 20, 'Aprobar un quiz'),
  ('quiz_perfecto', 50, 'Obtener 100% en un quiz'),
  ('curso_completado', 100, 'Completar un curso'),
  ('racha_7_dias', 25, 'Mantener racha de 7 días'),
  ('racha_30_dias', 100, 'Mantener racha de 30 días');

INSERT INTO public.lms_badges (codigo, nombre, descripcion, icono, categoria, puntos_otorga, condicion_tipo, condicion_valor, orden) VALUES
  ('primer_curso', 'Primer Paso', 'Completaste tu primer curso', 'Star', 'logro', 50, 'cursos_completados', 1, 1),
  ('cinco_cursos', 'Estudiante Dedicado', 'Completaste 5 cursos', 'Award', 'logro', 100, 'cursos_completados', 5, 2),
  ('primer_perfecto', 'Perfeccionista', 'Obtuviste 100% en un quiz', 'Target', 'logro', 30, 'quizzes_perfectos', 1, 3),
  ('racha_7', 'En Racha', '7 días consecutivos de estudio', 'Flame', 'racha', 25, 'racha_dias', 7, 4),
  ('racha_30', 'Imparable', '30 días consecutivos de estudio', 'Zap', 'racha', 100, 'racha_dias', 30, 5),
  ('puntos_500', 'Coleccionista', 'Acumulaste 500 puntos', 'Coins', 'logro', 0, 'puntos_acumulados', 500, 6),
  ('puntos_1000', 'Veterano', 'Acumulaste 1000 puntos', 'Medal', 'logro', 0, 'puntos_acumulados', 1000, 7);

INSERT INTO public.lms_certificados_plantillas (nombre, descripcion, plantilla_html, es_default) VALUES
('Certificado Estándar', 'Plantilla por defecto',
'<div class="certificate"><h1>Certificado de Finalización</h1><p>{{nombre_usuario}}</p><h3>{{titulo_curso}}</h3><p>Calificación: {{calificacion}}%</p><p>Fecha: {{fecha_completado}}</p><p>Código: {{codigo_verificacion}}</p></div>', true);

-- RLS
ALTER TABLE public.lms_certificados_plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_gamificacion_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_badges_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_puntos_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_puntos_config ENABLE ROW LEVEL SECURITY;

-- Políticas simples
CREATE POLICY "Public read templates" ON public.lms_certificados_plantillas FOR SELECT USING (activo = true);
CREATE POLICY "Users read own certificates" ON public.lms_certificados FOR SELECT USING (
  EXISTS (SELECT 1 FROM lms_inscripciones WHERE id = lms_certificados.inscripcion_id AND usuario_id = auth.uid())
);
CREATE POLICY "Users read own gamification" ON public.lms_gamificacion_perfil FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Public read badges" ON public.lms_badges FOR SELECT USING (activo = true);
CREATE POLICY "Users read own badges" ON public.lms_badges_usuario FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Users read own points" ON public.lms_puntos_historial FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Public read points config" ON public.lms_puntos_config FOR SELECT USING (true);

-- Funciones RPC esenciales
CREATE OR REPLACE FUNCTION public.lms_generar_codigo_verificacion()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_codigo TEXT;
BEGIN
  v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12));
  RETURN substr(v_codigo, 1, 4) || '-' || substr(v_codigo, 5, 4) || '-' || substr(v_codigo, 9, 4);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_generar_certificado(p_inscripcion_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inscripcion RECORD; v_curso RECORD; v_usuario RECORD; v_plantilla RECORD;
  v_codigo TEXT; v_certificado_id UUID; v_datos JSONB;
BEGIN
  SELECT * INTO v_inscripcion FROM lms_inscripciones WHERE id = p_inscripcion_id;
  IF NOT FOUND OR v_inscripcion.estado != 'completado' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inscripción no válida');
  END IF;
  IF v_inscripcion.certificado_generado THEN
    SELECT id, codigo_verificacion INTO v_certificado_id, v_codigo FROM lms_certificados WHERE inscripcion_id = p_inscripcion_id;
    RETURN jsonb_build_object('success', true, 'certificado_id', v_certificado_id, 'codigo', v_codigo, 'ya_existia', true);
  END IF;
  SELECT * INTO v_curso FROM lms_cursos WHERE id = v_inscripcion.curso_id;
  SELECT p.display_name, p.email INTO v_usuario FROM profiles p WHERE p.id = v_inscripcion.usuario_id;
  SELECT * INTO v_plantilla FROM lms_certificados_plantillas WHERE es_default = true AND activo = true LIMIT 1;
  v_codigo := lms_generar_codigo_verificacion();
  v_datos := jsonb_build_object('nombre_usuario', COALESCE(v_usuario.display_name, v_usuario.email), 'titulo_curso', v_curso.titulo,
    'calificacion', COALESCE(v_inscripcion.calificacion_final, v_inscripcion.progreso_porcentaje),
    'duracion_curso', v_curso.duracion_estimada_min, 'fecha_completado', to_char(v_inscripcion.fecha_completado, 'DD/MM/YYYY'),
    'codigo_verificacion', v_codigo);
  INSERT INTO lms_certificados (inscripcion_id, plantilla_id, codigo_verificacion, datos_certificado)
  VALUES (p_inscripcion_id, v_plantilla.id, v_codigo, v_datos) RETURNING id INTO v_certificado_id;
  UPDATE lms_inscripciones SET certificado_generado = true, certificado_url = v_codigo WHERE id = p_inscripcion_id;
  RETURN jsonb_build_object('success', true, 'certificado_id', v_certificado_id, 'codigo', v_codigo);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_verificar_certificado(p_codigo TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cert RECORD;
BEGIN
  SELECT c.*, cu.titulo as curso_titulo INTO v_cert FROM lms_certificados c
  JOIN lms_inscripciones i ON i.id = c.inscripcion_id JOIN lms_cursos cu ON cu.id = i.curso_id
  WHERE c.codigo_verificacion = upper(replace(p_codigo, '-', '')) OR c.codigo_verificacion = upper(p_codigo);
  IF NOT FOUND THEN RETURN jsonb_build_object('valido', false, 'error', 'Certificado no encontrado'); END IF;
  UPDATE lms_certificados SET verificado_count = verificado_count + 1, ultima_verificacion = now() WHERE id = v_cert.id;
  RETURN jsonb_build_object('valido', true, 'datos', v_cert.datos_certificado, 'curso', v_cert.curso_titulo);
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_get_gamificacion_perfil()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_perfil RECORD; v_badges JSONB;
BEGIN
  SELECT auth.uid() INTO v_user_id;
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('error', 'No autenticado'); END IF;
  INSERT INTO lms_gamificacion_perfil (usuario_id) VALUES (v_user_id) ON CONFLICT (usuario_id) DO NOTHING;
  SELECT * INTO v_perfil FROM lms_gamificacion_perfil WHERE usuario_id = v_user_id;
  SELECT jsonb_agg(jsonb_build_object('id', b.id, 'codigo', b.codigo, 'nombre', b.nombre, 'descripcion', b.descripcion,
    'icono', b.icono, 'categoria', b.categoria, 'fecha_obtencion', bu.fecha_obtencion) ORDER BY bu.fecha_obtencion DESC)
  INTO v_badges FROM lms_badges_usuario bu JOIN lms_badges b ON b.id = bu.badge_id WHERE bu.usuario_id = v_user_id;
  RETURN jsonb_build_object('perfil', jsonb_build_object('puntos_totales', v_perfil.puntos_totales, 'nivel', v_perfil.nivel,
    'racha_actual', v_perfil.racha_actual, 'racha_maxima', v_perfil.racha_maxima, 'cursos_completados', v_perfil.cursos_completados,
    'quizzes_perfectos', v_perfil.quizzes_perfectos), 'badges', COALESCE(v_badges, '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_otorgar_puntos(p_usuario_id UUID, p_accion TEXT, p_referencia_id UUID DEFAULT NULL, p_referencia_tipo TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_config RECORD; v_nuevos_puntos INTEGER;
BEGIN
  SELECT * INTO v_config FROM lms_puntos_config WHERE accion = p_accion AND activo = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false); END IF;
  INSERT INTO lms_gamificacion_perfil (usuario_id, puntos_totales, ultima_actividad) VALUES (p_usuario_id, v_config.puntos, CURRENT_DATE)
  ON CONFLICT (usuario_id) DO UPDATE SET puntos_totales = lms_gamificacion_perfil.puntos_totales + v_config.puntos, ultima_actividad = CURRENT_DATE, updated_at = now();
  INSERT INTO lms_puntos_historial (usuario_id, puntos, tipo_accion, descripcion, referencia_id, referencia_tipo)
  VALUES (p_usuario_id, v_config.puntos, p_accion, v_config.descripcion, p_referencia_id, p_referencia_tipo);
  SELECT puntos_totales INTO v_nuevos_puntos FROM lms_gamificacion_perfil WHERE usuario_id = p_usuario_id;
  RETURN jsonb_build_object('success', true, 'puntos_otorgados', v_config.puntos, 'puntos_totales', v_nuevos_puntos);
END;
$$;