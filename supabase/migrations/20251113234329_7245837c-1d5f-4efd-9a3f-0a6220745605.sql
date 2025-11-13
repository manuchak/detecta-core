-- ================================================================
-- DATOS DE PRUEBA: ARMADOS CON VERIFICACIÓN PENDIENTE
-- ================================================================
-- Este migration crea datos de prueba para validar el flujo de
-- verificación de armados operativos desde registro rápido

-- Insertar armados de prueba con verificación pendiente (solo si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM armados_operativos WHERE telefono = '5512340001') THEN
    INSERT INTO armados_operativos (
      nombre, telefono, zona_base, tipo_armado, estado, disponibilidad,
      verificacion_pendiente, origen, score_desempeno
    ) VALUES (
      'Test Armado Verificación 1', '5512340001', 'Ciudad de México',
      'interno', 'activo', 'disponible', true, 'registro_rapido', 5.0
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM armados_operativos WHERE telefono = '5512340002') THEN
    INSERT INTO armados_operativos (
      nombre, telefono, zona_base, tipo_armado, estado, disponibilidad,
      verificacion_pendiente, origen, score_desempeno
    ) VALUES (
      'Test Armado Verificación 2', '5512340002', 'Monterrey',
      'interno', 'activo', 'disponible', true, 'registro_rapido', 5.0
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM armados_operativos WHERE telefono = '5512340003') THEN
    INSERT INTO armados_operativos (
      nombre, telefono, zona_base, tipo_armado, estado, disponibilidad,
      verificacion_pendiente, origen, score_desempeno
    ) VALUES (
      'Test Armado Verificación 3', '5512340003', 'Guadalajara',
      'interno', 'activo', 'disponible', true, 'registro_rapido', 5.0
    );
  END IF;
END $$;