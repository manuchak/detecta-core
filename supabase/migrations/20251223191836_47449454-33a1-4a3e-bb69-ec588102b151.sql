-- PLAYBOOKS y TEMPLATES
INSERT INTO public.knowledge_base_playbooks (intent_id, paso_numero, tipo, titulo, contenido, preguntas, acciones_sistema) VALUES
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'amenaza_persecucion'), 1, 'validacion_inmediata', 'Confirmar situación', 
 'Mantén la calma. Necesito confirmar tu situación para ayudarte de inmediato.',
 ARRAY['¿Estás en un lugar seguro en este momento?', '¿Puedes describir brevemente qué está pasando?'],
 ARRAY['activar_protocolo_emergencia', 'notificar_c4']),
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'amenaza_persecucion'), 2, 'instruccion_seguridad', 'Instrucciones de seguridad',
 'IMPORTANTE: No te detengas en lugares aislados. Busca una zona concurrida, gasolinera, plaza comercial o caseta de peaje. Si tienes botón de pánico, mantenlo presionado.',
 ARRAY['¿Cuál es tu ubicación actual o hacia dónde te diriges?'],
 ARRAY['rastrear_gps']),
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'pago_pendiente'), 1, 'recopilacion_info', 'Identificar servicio',
 'Entiendo tu preocupación por el pago. Para revisar el estado necesito algunos datos.',
 ARRAY['¿Cuál es el folio o fecha del servicio?', '¿Cuál era el monto esperado?'],
 ARRAY['buscar_servicios_custodio']),
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'gps_no_funciona'), 1, 'diagnostico_inicial', 'Validaciones rápidas',
 'Vamos a hacer validaciones rápidas para identificar el problema.',
 ARRAY['¿El LED del GPS está encendido?', '¿Está conectado a corriente?', '¿Cuándo funcionó por última vez?'],
 ARRAY['consultar_ultimo_reporte_gps']);

-- TEMPLATES
INSERT INTO public.knowledge_base_templates (intent_id, nombre, tipo, template, variables) VALUES
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'amenaza_persecucion'), 'emergencia_inicial', 'respuesta_inmediata',
 'Entendido, estoy activando protocolo de emergencia. Tu seguridad es prioridad. Por favor confirma: ¿Estás en un lugar seguro?', ARRAY[]::TEXT[]),
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'pago_pendiente'), 'confirmacion_pago', 'respuesta',
 'Ya localicé tu servicio del {fecha_servicio}. El estado del pago es: {estado_pago}. {mensaje_adicional}', ARRAY['fecha_servicio', 'estado_pago', 'mensaje_adicional']),
((SELECT id FROM public.knowledge_base_intents WHERE nombre = 'saludo_inicio'), 'saludo', 'respuesta',
 '¡Hola! Soy el asistente de soporte de Detecta. ¿En qué puedo ayudarte hoy?', ARRAY[]::TEXT[]);