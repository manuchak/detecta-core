-- CREAR DATOS DE PRUEBA PARA EL SISTEMA DE RECLUTAMIENTO

-- Insertar métricas de demanda de ejemplo (si no existen)
INSERT INTO public.metricas_demanda_zona (
  zona_id, 
  periodo_inicio, 
  periodo_fin, 
  servicios_promedio_dia, 
  custodios_activos, 
  custodios_requeridos, 
  deficit_custodios, 
  score_urgencia, 
  gmv_promedio, 
  ingresos_esperados_custodio
) 
SELECT 
  '44dafbdf-de68-41d0-837f-b4c0172980fc'::uuid,
  '2024-12-01'::date,
  '2025-01-31'::date,
  15,
  8,
  20,
  12,
  9,
  45000.00,
  25000.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.metricas_demanda_zona 
  WHERE zona_id = '44dafbdf-de68-41d0-837f-b4c0172980fc'::uuid 
  AND periodo_fin >= '2025-01-01'::date
);

-- Insertar alerta de ejemplo (si no existe)
INSERT INTO public.alertas_sistema_nacional (
  tipo_alerta,
  categoria,
  zona_id,
  titulo,
  descripcion,
  datos_contexto,
  prioridad,
  estado,
  acciones_sugeridas
)
SELECT 
  'critica',
  'deficit_custodios',
  '44dafbdf-de68-41d0-837f-b4c0172980fc'::uuid,
  'Déficit crítico de custodios en Centro de México',
  'La zona Centro de México presenta un déficit de 12 custodios, afectando la capacidad de atención.',
  '{"deficit": 12, "custodios_activos": 8, "requeridos": 20}'::jsonb,
  9,
  'activa',
  ARRAY['Campaña de reclutamiento urgente', 'Incentivos económicos', 'Reasignación temporal']
WHERE NOT EXISTS (
  SELECT 1 FROM public.alertas_sistema_nacional 
  WHERE zona_id = '44dafbdf-de68-41d0-837f-b4c0172980fc'::uuid 
  AND estado = 'activa'
);