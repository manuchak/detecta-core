-- Insertar datos de ejemplo para demostrar el funcionamiento del sistema
-- (Excluyendo columnas generadas automáticamente)

-- 1. Insertar métricas de demanda de zona (sin columnas generadas)
INSERT INTO public.metricas_demanda_zona (
  zona_id, periodo_inicio, periodo_fin, servicios_promedio_dia, custodios_activos, 
  custodios_requeridos, score_urgencia, gmv_promedio, 
  ingresos_esperados_custodio, created_at, updated_at
) VALUES 
  ('11111111-1111-1111-1111-111111111111', '2024-12-01', '2024-12-31', 45, 30, 45, 85, 125000, 4500, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '2024-12-01', '2024-12-31', 25, 17, 25, 65, 75000, 3800, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '2024-12-01', '2024-12-31', 60, 38, 60, 95, 180000, 5200, now(), now()),
  ('44444444-4444-4444-4444-444444444444', '2024-12-01', '2024-12-31', 20, 15, 20, 45, 55000, 3200, now(), now())
ON CONFLICT DO NOTHING;

-- 2. Insertar alertas del sistema nacional
INSERT INTO public.alertas_sistema_nacional (
  titulo, descripcion, tipo_alerta, categoria, prioridad, 
  zona_id, estado, datos_contexto, acciones_sugeridas, created_at, updated_at
) VALUES 
  ('Déficit Crítico - Zona Norte', 'Se requieren 15 custodios adicionales en la zona norte para cubrir la demanda', 'deficit_critico', 'operacional', 1, '11111111-1111-1111-1111-111111111111', 'activa', '{"deficit": 15, "demanda": 45}', ARRAY['Activar campaña intensiva', 'Considerar bonos de referido'], now(), now()),
  ('Oportunidad de Expansión - Centro', 'Zona con potencial de crecimiento identificado', 'oportunidad', 'estrategica', 3, '22222222-2222-2222-2222-222222222222', 'activa', '{"potencial": "alto", "competencia": "baja"}', ARRAY['Evaluar mercado local', 'Preparar estrategia de entrada'], now(), now()),
  ('Meta Alcanzada - Sur', 'Zona sur ha superado las expectativas del mes', 'meta_alcanzada', 'positiva', 5, '33333333-3333-3333-3333-333333333333', 'activa', '{"superacion": "20%", "eficiencia": "alta"}', ARRAY['Reconocer equipo', 'Compartir mejores prácticas'], now(), now()),
  ('Revisión Preventiva - Oeste', 'Tendencia de retención en declive, requiere atención', 'preventiva', 'operacional', 2, '44444444-4444-4444-4444-444444444444', 'activa', '{"retencion": "75%", "objetivo": "85%"}', ARRAY['Revisar condiciones laborales', 'Encuesta de satisfacción'], now(), now())
ON CONFLICT DO NOTHING;

-- 3. Insertar candidatos custodios de ejemplo
INSERT INTO public.candidatos_custodios (
  nombre, email, telefono, zona_preferida_id, estado_proceso, 
  experiencia_seguridad, vehiculo_propio, expectativa_ingresos, 
  fuente_reclutamiento, calificacion_inicial, created_at, updated_at
) VALUES 
  ('Juan Pérez García', 'juan.perez@email.com', '+52-555-0101', '11111111-1111-1111-1111-111111111111', 'evaluacion', true, true, 35000, 'referido', 85, now(), now()),
  ('María González López', 'maria.gonzalez@email.com', '+52-555-0102', '22222222-2222-2222-2222-222222222222', 'entrevista', false, true, 30000, 'online', 78, now(), now()),
  ('Carlos Ruiz Mendoza', 'carlos.ruiz@email.com', '+52-555-0103', '33333333-3333-3333-3333-333333333333', 'contratado', true, false, 32000, 'evento', 92, now(), now()),
  ('Ana Martínez Silva', 'ana.martinez@email.com', '+52-555-0104', '11111111-1111-1111-1111-111111111111', 'lead', false, false, 28000, 'social_media', 70, now(), now()),
  ('Roberto Hernández Cruz', 'roberto.hernandez@email.com', '+52-555-0105', '22222222-2222-2222-2222-222222222222', 'documentos', true, true, 33000, 'referido', 88, now(), now()),
  ('Elena Vargas Morales', 'elena.vargas@email.com', '+52-555-0106', '44444444-4444-4444-4444-444444444444', 'evaluacion', false, true, 31000, 'online', 82, now(), now())
ON CONFLICT DO NOTHING;

-- 4. Insertar métricas de reclutamiento
INSERT INTO public.metricas_reclutamiento (
  zona_id, periodo_inicio, periodo_fin, custodios_contratados, 
  custodios_activos, tasa_retencion, costo_adquisicion, roi_reclutamiento, 
  canales_mas_efectivos, tiempo_promedio_contratacion, created_at, updated_at
) VALUES 
  ('11111111-1111-1111-1111-111111111111', '2024-12-01', '2024-12-31', 8, 7, 87.5, 2500, 145, ARRAY['referido', 'eventos'], 21, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '2024-12-01', '2024-12-31', 5, 5, 100.0, 1800, 178, ARRAY['online', 'social_media'], 18, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '2024-12-01', '2024-12-31', 12, 11, 91.7, 2200, 156, ARRAY['evento', 'referido'], 25, now(), now()),
  ('44444444-4444-4444-4444-444444444444', '2024-12-01', '2024-12-31', 3, 2, 66.7, 3200, 95, ARRAY['online'], 32, now(), now())
ON CONFLICT DO NOTHING;

-- 5. Crear la función para generar alertas automáticas
CREATE OR REPLACE FUNCTION public.generar_alertas_automaticas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    zona_record RECORD;
    deficit_critico INTEGER := 10;
    score_urgente INTEGER := 80;
BEGIN
    -- Generar alertas basadas en métricas de demanda
    FOR zona_record IN 
        SELECT z.id as zona_id, z.nombre, m.deficit_custodios, m.score_urgencia
        FROM zonas_operacion_nacional z
        JOIN metricas_demanda_zona m ON z.id = m.zona_id
        WHERE m.deficit_custodios >= deficit_critico OR m.score_urgencia >= score_urgente
    LOOP
        -- Insertar alerta si no existe una similar reciente
        INSERT INTO alertas_sistema_nacional (
            titulo, descripcion, tipo_alerta, categoria, prioridad,
            zona_id, estado, datos_contexto, acciones_sugeridas
        )
        SELECT 
            'Alerta Automática - ' || zona_record.nombre,
            'Déficit de ' || zona_record.deficit_custodios || ' custodios detectado automáticamente',
            CASE 
                WHEN zona_record.deficit_custodios >= deficit_critico THEN 'deficit_critico'
                ELSE 'preventiva'
            END,
            'operacional',
            CASE 
                WHEN zona_record.deficit_custodios >= deficit_critico THEN 1
                ELSE 2
            END,
            zona_record.zona_id,
            'activa',
            json_build_object(
                'deficit', zona_record.deficit_custodios,
                'score_urgencia', zona_record.score_urgencia,
                'generada_automaticamente', true
            ),
            ARRAY['Revisar estrategia de reclutamiento', 'Activar campañas adicionales']
        WHERE NOT EXISTS (
            SELECT 1 FROM alertas_sistema_nacional 
            WHERE zona_id = zona_record.zona_id 
            AND estado = 'activa' 
            AND created_at > now() - interval '7 days'
        );
    END LOOP;
    
    RAISE NOTICE 'Alertas automáticas generadas exitosamente';
END;
$$;