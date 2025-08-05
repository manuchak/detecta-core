-- Obtener el ID de la marca Dodge
DO $$
DECLARE
    dodge_marca_id UUID;
BEGIN
    SELECT id INTO dodge_marca_id FROM marcas_vehiculos WHERE nombre = 'Dodge';
    
    -- Insertar modelos faltantes de Dodge
    INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
    (dodge_marca_id, 'Attitude', 'sedán', true),
    (dodge_marca_id, 'ProMaster', 'van comercial', true),
    (dodge_marca_id, 'ProMaster City', 'van comercial', true),
    (dodge_marca_id, 'Ram 1200', 'pickup', true),
    (dodge_marca_id, 'Ram 3500', 'pickup', true),
    (dodge_marca_id, 'Ram 4500', 'pickup comercial', true),
    (dodge_marca_id, 'Ram 5500', 'pickup comercial', true),
    (dodge_marca_id, 'Ram ProMaster 1500', 'van comercial', true),
    (dodge_marca_id, 'Ram ProMaster 2500', 'van comercial', true),
    (dodge_marca_id, 'Ram ProMaster 3500', 'van comercial', true),
    (dodge_marca_id, 'Journey SXT', 'suv', true),
    (dodge_marca_id, 'Journey GT', 'suv', true),
    (dodge_marca_id, 'Journey R/T', 'suv', true),
    (dodge_marca_id, 'Attitude SE', 'sedán', true),
    (dodge_marca_id, 'Attitude SXT', 'sedán', true),
    (dodge_marca_id, 'Durango SXT', 'suv', true),
    (dodge_marca_id, 'Durango GT', 'suv', true),
    (dodge_marca_id, 'Durango R/T', 'suv', true),
    (dodge_marca_id, 'Durango SRT', 'suv', true),
    (dodge_marca_id, 'Charger SXT', 'sedán deportivo', true),
    (dodge_marca_id, 'Charger R/T', 'sedán deportivo', true),
    (dodge_marca_id, 'Charger SRT Hellcat', 'sedán deportivo', true),
    (dodge_marca_id, 'Challenger SXT', 'coupé deportivo', true),
    (dodge_marca_id, 'Challenger R/T', 'coupé deportivo', true),
    (dodge_marca_id, 'Challenger SRT Hellcat', 'coupé deportivo', true),
    (dodge_marca_id, 'Ram 1500 Classic', 'pickup', true),
    (dodge_marca_id, 'Ram 1500 Rebel', 'pickup', true),
    (dodge_marca_id, 'Ram 1500 Limited', 'pickup', true),
    (dodge_marca_id, 'Ram 1500 Laramie', 'pickup', true),
    (dodge_marca_id, 'Ram 1500 Big Horn', 'pickup', true),
    (dodge_marca_id, 'Ram 1500 Tradesman', 'pickup', true),
    (dodge_marca_id, 'Ram 1500 RHO', 'pickup', true),
    (dodge_marca_id, 'Ram 2500 Power Wagon', 'pickup', true),
    (dodge_marca_id, 'Ram 2500 Laramie', 'pickup', true),
    (dodge_marca_id, 'Ram 2500 Tradesman', 'pickup', true),
    (dodge_marca_id, 'Ram 3500 Laramie', 'pickup', true),
    (dodge_marca_id, 'Ram 3500 Tradesman', 'pickup', true)
    ON CONFLICT (marca_id, nombre) DO NOTHING;
    
    RAISE NOTICE 'Modelos de Dodge agregados exitosamente';
END $$;