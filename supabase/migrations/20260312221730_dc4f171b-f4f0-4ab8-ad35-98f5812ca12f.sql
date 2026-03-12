-- Add 'aprobado_en_espera' and 'en_liberacion' to leads_estado_check constraint
ALTER TABLE leads DROP CONSTRAINT leads_estado_check;

ALTER TABLE leads ADD CONSTRAINT leads_estado_check CHECK (
    estado = ANY (ARRAY[
        'nuevo', 'contactado', 'en_revision', 'aprobado', 'rechazado',
        'psicometricos_pendiente', 'psicometricos_completado',
        'toxicologicos_pendiente', 'toxicologicos_completado',
        'instalacion_gps_pendiente', 'instalacion_gps_completado',
        'custodio_activo', 'rechazado_psicometrico', 'rechazado_toxicologico',
        'inactivo', 'aprobado_en_espera', 'en_liberacion'
    ])
);

-- Now fix the 293 existing pool records
UPDATE leads 
SET estado = 'aprobado_en_espera', updated_at = now()
WHERE fecha_entrada_pool IS NOT NULL AND estado = 'aprobado';