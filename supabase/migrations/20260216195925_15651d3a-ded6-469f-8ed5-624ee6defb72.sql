UPDATE public.custodios_operativos 
SET estado = 'activo', 
    disponibilidad = 'disponible', 
    fecha_inactivacion = NULL, 
    motivo_inactivacion = NULL, 
    tipo_inactivacion = NULL, 
    fecha_reactivacion_programada = NULL, 
    updated_at = now() 
WHERE id = '42e8a44b-951e-4acf-a2f9-a079f0ac532a';