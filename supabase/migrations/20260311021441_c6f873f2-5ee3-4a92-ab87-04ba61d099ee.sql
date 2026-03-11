INSERT INTO public.whatsapp_templates (name, content, category, is_active, meta_status, meta_category, variable_count, has_buttons, button_count)
VALUES
  (
    'nudge_status_custodio',
    'Hola {{1}}, por favor envía tu status actual del servicio {{2}} con una foto. 📸',
    'monitoreo',
    true,
    'not_submitted',
    'UTILITY',
    2,
    false,
    0
  ),
  (
    'reporte_servicio_cliente',
    'Estimado {{1}}, le informamos que el servicio {{2}} se encuentra {{3}}. Observaciones: {{4}}. — Equipo Detecta 🛡️',
    'monitoreo',
    true,
    'not_submitted',
    'UTILITY',
    4,
    false,
    0
  ),
  (
    'cierre_servicio_cliente',
    '{{1}}, el servicio {{2}} ha sido completado exitosamente a las {{3}}. Gracias por confiar en Detecta. 🛡️',
    'monitoreo',
    true,
    'not_submitted',
    'UTILITY',
    3,
    false,
    0
  )