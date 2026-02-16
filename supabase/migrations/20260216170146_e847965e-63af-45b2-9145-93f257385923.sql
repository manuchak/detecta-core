-- Reactivar custodio de prueba (tel: 5500000001)
UPDATE custodios_operativos
SET 
  estado = 'activo',
  disponibilidad = 'disponible',
  motivo_inactivacion = NULL,
  tipo_inactivacion = NULL,
  fecha_inactivacion = NULL,
  fecha_reactivacion_programada = NULL,
  updated_at = now()
WHERE telefono = '5500000001';

-- Registrar en historial
INSERT INTO operativo_estatus_historial (
  operativo_id, operativo_tipo, estatus_anterior, estatus_nuevo,
  tipo_cambio, motivo, notas
)
SELECT 
  id, 'custodio', 'inactivo', 'activo',
  'reactivacion', 'Reactivación manual - cuenta de prueba documentada',
  'Cuenta de prueba (5500000001) reactivada. Fue dada de baja automática por inactividad +90 días.'
FROM custodios_operativos
WHERE telefono = '5500000001';