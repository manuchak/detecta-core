-- ===========================================
-- Sprint 4: Extensión de programacion_instalaciones
-- ===========================================

-- Agregar columnas para contexto de candidatos
ALTER TABLE programacion_instalaciones 
ADD COLUMN IF NOT EXISTS candidato_id UUID REFERENCES candidatos_custodios(id),
ADD COLUMN IF NOT EXISTS tipo_contexto VARCHAR(20) DEFAULT 'cliente';

-- Índice para consultas por candidato
CREATE INDEX IF NOT EXISTS idx_programacion_instalaciones_candidato 
ON programacion_instalaciones(candidato_id) 
WHERE candidato_id IS NOT NULL;

-- ===========================================
-- Trigger: Sincronizar instalación completada → custodio_liberacion
-- ===========================================
CREATE OR REPLACE FUNCTION sync_instalacion_completada_to_liberacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar cuando se marca como completada una instalación de custodio
  IF NEW.estado = 'completada' 
     AND NEW.tipo_contexto = 'custodio' 
     AND NEW.candidato_id IS NOT NULL 
     AND (OLD.estado IS NULL OR OLD.estado != 'completada') THEN
    
    -- Actualizar el checklist de liberación
    UPDATE custodio_liberacion
    SET instalacion_gps_completado = true,
        fecha_instalacion_gps = COALESCE(NEW.fecha_completada, NOW()),
        updated_at = NOW()
    WHERE candidato_id = NEW.candidato_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_sync_instalacion_to_liberacion ON programacion_instalaciones;
CREATE TRIGGER trg_sync_instalacion_to_liberacion
AFTER UPDATE ON programacion_instalaciones
FOR EACH ROW
EXECUTE FUNCTION sync_instalacion_completada_to_liberacion();

-- ===========================================
-- Seed: Más preguntas de quiz (10 por módulo)
-- ===========================================

-- Módulo 1: Introducción a la Seguridad Privada
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden, puntos) VALUES
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-001'), 
 '¿Cuál es el objetivo principal de la seguridad privada?',
 '[{"texto": "Generar ingresos", "es_correcta": false}, {"texto": "Proteger personas, bienes e información", "es_correcta": true}, {"texto": "Sustituir a la policía", "es_correcta": false}, {"texto": "Vigilar empleados", "es_correcta": false}]'::jsonb,
 'La seguridad privada tiene como objetivo principal la protección integral.', 1, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-001'),
 '¿Qué marco legal regula la seguridad privada en México?',
 '[{"texto": "Ley Federal del Trabajo", "es_correcta": false}, {"texto": "Ley Federal de Seguridad Privada", "es_correcta": true}, {"texto": "Código Penal", "es_correcta": false}, {"texto": "Ley de Amparo", "es_correcta": false}]'::jsonb,
 'La LFSP establece el marco regulatorio para prestadores de servicios de seguridad privada.', 2, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-001'),
 '¿Cuál es una responsabilidad ética fundamental del custodio?',
 '[{"texto": "Compartir información con terceros", "es_correcta": false}, {"texto": "Mantener confidencialidad", "es_correcta": true}, {"texto": "Actuar por cuenta propia", "es_correcta": false}, {"texto": "Ignorar protocolos", "es_correcta": false}]'::jsonb,
 'La confidencialidad es un pilar ético en la seguridad privada.', 3, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-001'),
 '¿Qué documento acredita a un custodio para operar legalmente?',
 '[{"texto": "INE", "es_correcta": false}, {"texto": "Credencial de elector", "es_correcta": false}, {"texto": "Registro ante la SSP", "es_correcta": true}, {"texto": "Licencia de conducir", "es_correcta": false}]'::jsonb,
 'El registro ante la autoridad competente es obligatorio para operar.', 4, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-001'),
 '¿Cuál NO es un principio de la seguridad privada?',
 '[{"texto": "Prevención", "es_correcta": false}, {"texto": "Disuasión", "es_correcta": false}, {"texto": "Venganza", "es_correcta": true}, {"texto": "Protección", "es_correcta": false}]'::jsonb,
 'La venganza no es un principio de seguridad; la prevención, disuasión y protección sí lo son.', 5, 10);

-- Módulo 2: Protocolos de Custodia de Mercancía
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden, puntos) VALUES
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-002'),
 '¿Qué debe verificar el custodio antes de iniciar una ruta?',
 '[{"texto": "Solo el combustible", "es_correcta": false}, {"texto": "Documentación, sellos y estado del vehículo", "es_correcta": true}, {"texto": "Únicamente la mercancía", "es_correcta": false}, {"texto": "Nada, solo salir", "es_correcta": false}]'::jsonb,
 'La verificación integral antes de partir es crucial para la seguridad.', 1, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-002'),
 '¿Con qué frecuencia debe reportar posición el custodio durante el traslado?',
 '[{"texto": "Cada 24 horas", "es_correcta": false}, {"texto": "Solo al llegar", "es_correcta": false}, {"texto": "Según protocolo establecido (generalmente cada hora o en puntos de control)", "es_correcta": true}, {"texto": "Nunca durante el traslado", "es_correcta": false}]'::jsonb,
 'Los reportes periódicos permiten monitoreo efectivo y respuesta ante incidentes.', 2, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-002'),
 '¿Qué es un sello de seguridad?',
 '[{"texto": "Un adorno del vehículo", "es_correcta": false}, {"texto": "Dispositivo que evidencia apertura no autorizada", "es_correcta": true}, {"texto": "Un documento legal", "es_correcta": false}, {"texto": "Una marca del fabricante", "es_correcta": false}]'::jsonb,
 'Los sellos de seguridad son dispositivos que dejan evidencia si la carga fue manipulada.', 3, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-002'),
 '¿Qué hacer si detecta un sello violado?',
 '[{"texto": "Ignorarlo y continuar", "es_correcta": false}, {"texto": "Reportar inmediatamente y no mover la carga", "es_correcta": true}, {"texto": "Cambiar el sello por cuenta propia", "es_correcta": false}, {"texto": "Entregar la carga de todos modos", "es_correcta": false}]'::jsonb,
 'Cualquier anomalía debe reportarse inmediatamente sin alterar la escena.', 4, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-002'),
 '¿Cuál es la importancia de la bitácora de viaje?',
 '[{"texto": "Es solo un requisito burocrático", "es_correcta": false}, {"texto": "Registro legal de incidentes y trazabilidad", "es_correcta": true}, {"texto": "No tiene importancia real", "es_correcta": false}, {"texto": "Solo sirve para el operador", "es_correcta": false}]'::jsonb,
 'La bitácora es un documento legal que respalda todas las actividades del traslado.', 5, 10);

-- Módulo 3: Uso del Sistema GPS y Comunicaciones
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden, puntos) VALUES
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-003'),
 '¿Qué significa GPS?',
 '[{"texto": "Guía de Protección Satelital", "es_correcta": false}, {"texto": "Global Positioning System", "es_correcta": true}, {"texto": "Gestión de Puntos de Seguridad", "es_correcta": false}, {"texto": "Grupo de Patrullaje Seguro", "es_correcta": false}]'::jsonb,
 'GPS significa Sistema de Posicionamiento Global.', 1, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-003'),
 '¿Qué debe hacer si el GPS reporta falla?',
 '[{"texto": "Continuar sin reportar", "es_correcta": false}, {"texto": "Detener el vehículo de inmediato en cualquier lugar", "es_correcta": false}, {"texto": "Reportar a central y seguir protocolo de contingencia", "es_correcta": true}, {"texto": "Intentar repararlo personalmente", "es_correcta": false}]'::jsonb,
 'Cualquier falla técnica debe reportarse y seguir el protocolo establecido.', 2, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-003'),
 '¿Cuál es el canal principal de comunicación con el C4?',
 '[{"texto": "WhatsApp personal", "es_correcta": false}, {"texto": "Radio o sistema autorizado de la empresa", "es_correcta": true}, {"texto": "Redes sociales", "es_correcta": false}, {"texto": "Cualquier medio disponible", "es_correcta": false}]'::jsonb,
 'Solo deben usarse canales oficiales y seguros para comunicaciones operativas.', 3, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-003'),
 '¿Qué es una geocerca?',
 '[{"texto": "Una barda física", "es_correcta": false}, {"texto": "Perímetro virtual que genera alertas al cruzarlo", "es_correcta": true}, {"texto": "Un mapa impreso", "es_correcta": false}, {"texto": "Una ruta obligatoria", "es_correcta": false}]'::jsonb,
 'Las geocercas son límites virtuales programados que alertan al C4 cuando se cruzan.', 4, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-003'),
 '¿Por qué es importante mantener el GPS siempre activo?',
 '[{"texto": "Para que la empresa sepa dónde está en todo momento", "es_correcta": false}, {"texto": "Permite monitoreo continuo, respuesta rápida ante emergencias y trazabilidad", "es_correcta": true}, {"texto": "Es solo un requisito sin beneficio real", "es_correcta": false}, {"texto": "Para calcular el combustible", "es_correcta": false}]'::jsonb,
 'El GPS activo permite protección continua y respuesta inmediata ante cualquier incidente.', 5, 10);

-- Módulo 4: Manejo de Emergencias
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden, puntos) VALUES
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-004'),
 '¿Cuál es la primera acción ante un intento de robo?',
 '[{"texto": "Enfrentar a los delincuentes", "es_correcta": false}, {"texto": "Activar botón de pánico y seguir protocolo", "es_correcta": true}, {"texto": "Huir abandonando la carga", "es_correcta": false}, {"texto": "Negociar con los asaltantes", "es_correcta": false}]'::jsonb,
 'La prioridad es la vida; activar alertas permite respuesta coordinada.', 1, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-004'),
 '¿Qué es un botón de pánico?',
 '[{"texto": "Un dispositivo para llamar a familiares", "es_correcta": false}, {"texto": "Sistema que envía alerta silenciosa al C4 en emergencias", "es_correcta": true}, {"texto": "Un botón para encender el vehículo", "es_correcta": false}, {"texto": "Una aplicación de entretenimiento", "es_correcta": false}]'::jsonb,
 'El botón de pánico es una herramienta vital para alertar emergencias sin alertar a delincuentes.', 2, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-004'),
 '¿Qué información debe proporcionar al reportar una emergencia?',
 '[{"texto": "Solo su nombre", "es_correcta": false}, {"texto": "Ubicación, tipo de emergencia, número de personas involucradas, descripción", "es_correcta": true}, {"texto": "Opiniones personales sobre lo ocurrido", "es_correcta": false}, {"texto": "No debe dar información por seguridad", "es_correcta": false}]'::jsonb,
 'Información precisa y completa permite una respuesta efectiva.', 3, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-004'),
 '¿Cuál es la prioridad absoluta en cualquier emergencia?',
 '[{"texto": "Proteger la mercancía", "es_correcta": false}, {"texto": "Proteger la vida humana", "es_correcta": true}, {"texto": "Documentar todo en video", "es_correcta": false}, {"texto": "Llamar a los medios", "es_correcta": false}]'::jsonb,
 'La vida humana siempre es la prioridad número uno.', 4, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-004'),
 '¿Qué hacer después de un incidente de seguridad?',
 '[{"texto": "Olvidarlo y seguir trabajando", "es_correcta": false}, {"texto": "Elaborar reporte detallado y cooperar con investigación", "es_correcta": true}, {"texto": "Comentarlo en redes sociales", "es_correcta": false}, {"texto": "Renunciar inmediatamente", "es_correcta": false}]'::jsonb,
 'El reporte detallado es crucial para investigación y prevención futura.', 5, 10);

-- Módulo 5: Primeros Auxilios Básicos
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden, puntos) VALUES
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-005'),
 '¿Cuál es el primer paso al encontrar una persona inconsciente?',
 '[{"texto": "Darle agua", "es_correcta": false}, {"texto": "Verificar seguridad de la escena y respuesta de la víctima", "es_correcta": true}, {"texto": "Moverla inmediatamente", "es_correcta": false}, {"texto": "Administrar medicamentos", "es_correcta": false}]'::jsonb,
 'Primero asegurar la escena, luego evaluar a la víctima.', 1, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-005'),
 '¿Qué número de emergencias debe marcar en México?',
 '[{"texto": "066", "es_correcta": false}, {"texto": "911", "es_correcta": true}, {"texto": "089", "es_correcta": false}, {"texto": "01800", "es_correcta": false}]'::jsonb,
 '911 es el número único de emergencias en México.', 2, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-005'),
 '¿Qué significa RCP?',
 '[{"texto": "Registro de Control Personal", "es_correcta": false}, {"texto": "Reanimación Cardio Pulmonar", "es_correcta": true}, {"texto": "Respuesta de Crisis Programada", "es_correcta": false}, {"texto": "Red de Comunicación Primaria", "es_correcta": false}]'::jsonb,
 'RCP es la técnica de reanimación en paros cardiorrespiratorios.', 3, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-005'),
 '¿Cómo debe tratarse una hemorragia externa?',
 '[{"texto": "Aplicar torniquete inmediatamente", "es_correcta": false}, {"texto": "Presión directa sobre la herida con material limpio", "es_correcta": true}, {"texto": "Lavar con agua fría", "es_correcta": false}, {"texto": "Dejarla sangrar para limpiarse", "es_correcta": false}]'::jsonb,
 'La presión directa es el método primario para controlar hemorragias.', 4, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-005'),
 '¿Qué debe contener un botiquín básico de primeros auxilios?',
 '[{"texto": "Solo medicamentos", "es_correcta": false}, {"texto": "Gasas, vendas, guantes, tijeras, antiséptico, cinta adhesiva", "es_correcta": true}, {"texto": "Únicamente alcohol", "es_correcta": false}, {"texto": "Solo curitas", "es_correcta": false}]'::jsonb,
 'Un botiquín completo permite atender diversas situaciones de emergencia.', 5, 10);

-- Módulo 6: Ética y Conducta Profesional
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden, puntos) VALUES
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-006'),
 '¿Qué implica la integridad profesional?',
 '[{"texto": "Hacer lo que conviene en cada momento", "es_correcta": false}, {"texto": "Actuar con honestidad y coherencia en todo momento", "es_correcta": true}, {"texto": "Obedecer solo cuando conviene", "es_correcta": false}, {"texto": "Buscar beneficio personal", "es_correcta": false}]'::jsonb,
 'La integridad es actuar correctamente incluso cuando nadie observa.', 1, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-006'),
 '¿Qué debe hacer si le ofrecen soborno?',
 '[{"texto": "Aceptarlo si nadie se entera", "es_correcta": false}, {"texto": "Rechazarlo y reportarlo inmediatamente", "es_correcta": true}, {"texto": "Negociar un monto mayor", "es_correcta": false}, {"texto": "Ignorar la situación", "es_correcta": false}]'::jsonb,
 'El soborno es un delito; debe rechazarse y reportarse siempre.', 2, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-006'),
 '¿Cómo debe ser la relación con el cliente y operador?',
 '[{"texto": "Informal y personal", "es_correcta": false}, {"texto": "Profesional, respetuosa y cordial", "es_correcta": true}, {"texto": "Distante y fría", "es_correcta": false}, {"texto": "Solo cuando hay problemas", "es_correcta": false}]'::jsonb,
 'El trato profesional genera confianza y facilita la operación.', 3, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-006'),
 '¿Por qué es importante la puntualidad?',
 '[{"texto": "Solo es una formalidad", "es_correcta": false}, {"texto": "Demuestra compromiso y permite cumplir itinerarios seguros", "es_correcta": true}, {"texto": "No afecta la operación", "es_correcta": false}, {"texto": "Solo importa al cliente", "es_correcta": false}]'::jsonb,
 'La puntualidad es crucial para la seguridad y confiabilidad del servicio.', 4, 10),
((SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-006'),
 '¿Qué representa el uniforme y credencial del custodio?',
 '[{"texto": "Un disfraz para el trabajo", "es_correcta": false}, {"texto": "Identificación oficial y representación de la empresa", "es_correcta": true}, {"texto": "Una preferencia personal", "es_correcta": false}, {"texto": "Algo sin importancia", "es_correcta": false}]'::jsonb,
 'El uniforme y credencial son símbolos de profesionalismo y autoridad.', 5, 10);