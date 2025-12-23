-- =====================================================
-- INTENTS DEL DOCUMENTO KB_AI_ASISTENCIA
-- =====================================================

-- INTENTS - Emergencias
INSERT INTO public.knowledge_base_intents (category_id, nombre, descripcion, disparadores, slots_requeridos, prioridad, sla_minutos, nivel_escalamiento) VALUES
((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Emergencias y Seguridad'), 
 'amenaza_persecucion', 
 'Custodio reporta ser seguido o amenazado',
 ARRAY['me siguen', 'me están siguiendo', 'amenaza', 'amenazaron', 'persecución', 'vehículo sospechoso', 'me quieren robar', 'nos vienen siguiendo'],
 ARRAY['ubicacion', 'descripcion_vehiculo', 'numero_personas'],
 'P0', 5, 'L3'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Emergencias y Seguridad'),
 'robo_asalto',
 'Custodio reporta robo o asalto en progreso o reciente',
 ARRAY['me robaron', 'asalto', 'asaltaron', 'quitaron carga', 'robaron mercancía', 'arma', 'pistola', 'robo'],
 ARRAY['ubicacion', 'hora_incidente', 'descripcion_agresores', 'carga_afectada'],
 'P0', 5, 'L4'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Emergencias y Seguridad'),
 'accidente_vehicular',
 'Accidente de tránsito durante servicio',
 ARRAY['choqué', 'accidente', 'me chocaron', 'volcadura', 'golpe', 'impacto', 'choque'],
 ARRAY['ubicacion', 'lesiones', 'estado_vehiculo', 'estado_carga'],
 'P0', 10, 'L3'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Emergencias y Seguridad'),
 'emergencia_medica',
 'Problema de salud del custodio durante servicio',
 ARRAY['me siento mal', 'enfermo', 'mareo', 'dolor', 'no puedo continuar', 'emergencia médica', 'dolor pecho'],
 ARRAY['sintomas', 'ubicacion', 'estado_servicio'],
 'P0', 10, 'L2'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Emergencias y Seguridad'),
 'ponchadura_averia',
 'Falla mecánica o llanta ponchada',
 ARRAY['ponchadura', 'llanta', 'se ponchó', 'falla mecánica', 'no arranca', 'batería', 'motor', 'llanta ponchada'],
 ARRAY['ubicacion', 'tipo_falla', 'tiene_refaccion'],
 'P1', 30, 'L2');

-- INTENTS - Pagos
INSERT INTO public.knowledge_base_intents (category_id, nombre, descripcion, disparadores, slots_requeridos, prioridad, sla_minutos, nivel_escalamiento) VALUES
((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Pagos y Finanzas'),
 'pago_pendiente',
 'Consulta sobre pago no recibido',
 ARRAY['no me pagaron', 'pago pendiente', 'cuándo cae', 'fecha de pago', 'no llegó depósito', 'falta pago', 'cuando pagan', 'mi pago'],
 ARRAY['folio_servicio', 'fecha_servicio', 'monto_esperado'],
 'P2', 60, 'L1'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Pagos y Finanzas'),
 'solicitud_adelanto',
 'Solicitud de adelanto de pago',
 ARRAY['adelanto', 'préstamo', 'necesito dinero', 'urgencia económica', 'anticipo'],
 ARRAY['monto_solicitado', 'motivo'],
 'P2', 120, 'L2'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Pagos y Finanzas'),
 'consulta_deduccion',
 'Pregunta sobre deducciones en pago',
 ARRAY['descuento', 'deducción', 'por qué me quitaron', 'cobro', 'menos dinero', 'me descontaron'],
 ARRAY['folio_pago', 'concepto_deduccion'],
 'P2', 60, 'L1'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Pagos y Finanzas'),
 'bono_incentivo',
 'Consulta sobre bonos o incentivos',
 ARRAY['bono', 'incentivo', 'meta', 'premio', 'extra', 'referido'],
 ARRAY[]::TEXT[],
 'P3', 120, 'L1');

-- INTENTS - Gadgets
INSERT INTO public.knowledge_base_intents (category_id, nombre, descripcion, disparadores, slots_requeridos, prioridad, sla_minutos, nivel_escalamiento) VALUES
((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Gadgets y Equipos'),
 'gps_no_funciona',
 'GPS no enciende o no transmite',
 ARRAY['gps no funciona', 'gps apagado', 'no prende', 'no transmite', 'sin señal gps', 'gps no reporta'],
 ARRAY['numero_serie', 'ultimo_funcionamiento', 'indicadores_led'],
 'P1', 30, 'L2'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Gadgets y Equipos'),
 'boton_panico',
 'Problemas con botón de pánico',
 ARRAY['botón pánico', 'panico no funciona', 'activé pánico', 'emergencia botón', 'boton de panico'],
 ARRAY['numero_serie', 'accion_realizada'],
 'P0', 15, 'L2'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Gadgets y Equipos'),
 'solicitud_equipo',
 'Solicitud de nuevo equipo o reemplazo',
 ARRAY['necesito gps', 'cambio equipo', 'equipo dañado', 'reemplazo', 'nuevo dispositivo', 'cargador'],
 ARRAY['tipo_equipo', 'motivo_cambio'],
 'P2', 240, 'L2');

-- INTENTS - Servicios
INSERT INTO public.knowledge_base_intents (category_id, nombre, descripcion, disparadores, slots_requeridos, prioridad, sla_minutos, nivel_escalamiento) VALUES
((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Servicios y Rutas'),
 'consulta_asignacion',
 'Pregunta sobre próximo servicio',
 ARRAY['próximo servicio', 'siguiente ruta', 'asignación', 'qué tengo', 'horario', 'mi servicio'],
 ARRAY[]::TEXT[],
 'P3', 60, 'L1'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Servicios y Rutas'),
 'cambio_disponibilidad',
 'Cambio de horario o disponibilidad',
 ARRAY['no puedo', 'cambio horario', 'día libre', 'permiso', 'descanso', 'no disponible', 'cancelar'],
 ARRAY['fecha', 'motivo'],
 'P2', 60, 'L1'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Servicios y Rutas'),
 'problema_ruta',
 'Problema durante el servicio actual',
 ARRAY['tráfico', 'cerrada la calle', 'no encuentro', 'dirección incorrecta', 'cliente no está', 'demora'],
 ARRAY['ubicacion', 'descripcion_problema'],
 'P2', 30, 'L1');

-- INTENTS - Capacitación
INSERT INTO public.knowledge_base_intents (category_id, nombre, descripcion, disparadores, slots_requeridos, prioridad, sla_minutos, nivel_escalamiento) VALUES
((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Capacitación y Onboarding'),
 'duda_capacitacion',
 'Pregunta sobre módulos o proceso de capacitación',
 ARRAY['capacitación', 'módulo', 'curso', 'examen', 'quiz', 'no entiendo', 'entrenamiento'],
 ARRAY['modulo_especifico'],
 'P3', 120, 'L1'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Capacitación y Onboarding'),
 'problema_plataforma',
 'Problema técnico con la app o plataforma',
 ARRAY['no carga', 'error app', 'no puedo entrar', 'pantalla blanca', 'bug', 'no funciona la app'],
 ARRAY['pantalla_error', 'mensaje_error'],
 'P2', 60, 'L2');

-- INTENTS - Soporte General
INSERT INTO public.knowledge_base_intents (category_id, nombre, descripcion, disparadores, slots_requeridos, prioridad, sla_minutos, nivel_escalamiento) VALUES
((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Soporte General'),
 'saludo_inicio',
 'Saludo inicial o inicio de conversación',
 ARRAY['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'qué tal', 'ayuda'],
 ARRAY[]::TEXT[],
 'P3', 5, 'L1'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Soporte General'),
 'feedback_queja',
 'Queja o feedback sobre el servicio',
 ARRAY['queja', 'reclamo', 'inconformidad', 'no estoy de acuerdo', 'mal servicio', 'molesto'],
 ARRAY['motivo_queja'],
 'P2', 60, 'L2'),

((SELECT id FROM public.knowledge_base_categories WHERE nombre = 'Soporte General'),
 'agradecimiento',
 'Agradecimiento o despedida',
 ARRAY['gracias', 'muchas gracias', 'excelente', 'perfecto', 'listo', 'ok gracias'],
 ARRAY[]::TEXT[],
 'P3', 5, 'L1');