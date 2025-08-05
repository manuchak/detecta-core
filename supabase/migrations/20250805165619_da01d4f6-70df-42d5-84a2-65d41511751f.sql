-- Agregar modelos prioritarios más vendidos en México
DO $$
DECLARE
    nissan_id UUID;
    toyota_id UUID;
    chevrolet_id UUID;
    honda_id UUID;
    vento_id UUID;
    byd_id UUID;
    seat_id UUID;
    geely_id UUID;
BEGIN
    -- Obtener IDs de las marcas
    SELECT id INTO nissan_id FROM marcas_vehiculos WHERE nombre = 'Nissan';
    SELECT id INTO toyota_id FROM marcas_vehiculos WHERE nombre = 'Toyota';
    SELECT id INTO chevrolet_id FROM marcas_vehiculos WHERE nombre = 'Chevrolet';
    SELECT id INTO honda_id FROM marcas_vehiculos WHERE nombre = 'Honda';
    SELECT id INTO vento_id FROM marcas_vehiculos WHERE nombre = 'Vento';
    SELECT id INTO byd_id FROM marcas_vehiculos WHERE nombre = 'BYD';
    SELECT id INTO seat_id FROM marcas_vehiculos WHERE nombre = 'SEAT';
    SELECT id INTO geely_id FROM marcas_vehiculos WHERE nombre = 'Geely';
    
    -- NISSAN - Modelos más vendidos faltantes
    INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
    (nissan_id, 'Kicks', 'suv compacta', true),
    (nissan_id, 'Kicks Exclusive', 'suv compacta', true),
    (nissan_id, 'Kicks Advance', 'suv compacta', true),
    (nissan_id, 'Sentra Sense', 'sedán', true),
    (nissan_id, 'Sentra Advance', 'sedán', true),
    (nissan_id, 'Sentra Exclusive', 'sedán', true),
    (nissan_id, 'Rogue', 'suv mediana', true),
    (nissan_id, 'Rogue Advance', 'suv mediana', true),
    (nissan_id, 'Rogue Exclusive', 'suv mediana', true),
    (nissan_id, 'Maxima', 'sedán premium', true),
    (nissan_id, 'Patrol', 'suv grande', true),
    (nissan_id, 'Murano', 'suv mediana', true),
    (nissan_id, 'Juke', 'suv compacta', true),
    
    -- TOYOTA - Modelos populares faltantes
    (toyota_id, 'Corolla Cross', 'suv compacta', true),
    (toyota_id, 'Corolla Cross XLE', 'suv compacta', true),
    (toyota_id, 'CH-R', 'suv compacta', true),
    (toyota_id, 'CH-R XLE', 'suv compacta', true),
    (toyota_id, 'Venza', 'suv mediana', true),
    (toyota_id, 'Venza Limited', 'suv mediana', true),
    (toyota_id, 'Land Cruiser', 'suv grande', true),
    (toyota_id, 'Land Cruiser Heritage', 'suv grande', true),
    (toyota_id, 'Prius Prime', 'híbrido', true),
    (toyota_id, 'Prius C', 'híbrido compacto', true),
    (toyota_id, 'GR Supra', 'deportivo', true),
    (toyota_id, 'GR86', 'deportivo', true),
    (toyota_id, 'Yaris Cross', 'suv compacta', true),
    
    -- CHEVROLET - Bestsellers faltantes
    (chevrolet_id, 'Tracker', 'suv compacta', true),
    (chevrolet_id, 'Tracker LT', 'suv compacta', true),
    (chevrolet_id, 'Tracker Premier', 'suv compacta', true),
    (chevrolet_id, 'Groove', 'suv compacta', true),
    (chevrolet_id, 'Groove LT', 'suv compacta', true),
    (chevrolet_id, 'Cavalier', 'sedán', true),
    (chevrolet_id, 'Cavalier LT', 'sedán', true),
    (chevrolet_id, 'Cavalier Premier', 'sedán', true),
    (chevrolet_id, 'Camaro', 'deportivo', true),
    (chevrolet_id, 'Camaro SS', 'deportivo', true),
    (chevrolet_id, 'Camaro ZL1', 'deportivo', true),
    (chevrolet_id, 'Corvette', 'deportivo', true),
    (chevrolet_id, 'Monza', 'sedán', true),
    
    -- HONDA - Modelos faltantes importantes
    (honda_id, 'BR-V', 'suv', true),
    (honda_id, 'BR-V Prime', 'suv', true),
    (honda_id, 'Passport', 'suv mediana', true),
    (honda_id, 'Passport Elite', 'suv mediana', true),
    (honda_id, 'Insight', 'híbrido', true),
    (honda_id, 'Insight Touring', 'híbrido', true),
    (honda_id, 'Civic Type R', 'deportivo', true),
    (honda_id, 'Civic Si', 'deportivo', true),
    (honda_id, 'Element', 'suv compacta', true);
    
    -- Agregar modelos básicos a marcas sin modelos
    IF vento_id IS NOT NULL THEN
        INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
        (vento_id, 'V3', 'sedán compacto', true),
        (vento_id, 'V5', 'sedán', true),
        (vento_id, 'V7', 'suv', true);
    END IF;
    
    IF byd_id IS NOT NULL THEN
        INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
        (byd_id, 'Yuan Plus', 'suv eléctrica', true),
        (byd_id, 'Han', 'sedán eléctrico', true),
        (byd_id, 'Tang', 'suv eléctrica', true),
        (byd_id, 'Song Plus', 'suv eléctrica', true),
        (byd_id, 'Dolphin', 'hatchback eléctrico', true);
    END IF;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
        (seat_id, 'Ibiza', 'hatchback', true),
        (seat_id, 'Leon', 'hatchback', true),
        (seat_id, 'Arona', 'suv compacta', true),
        (seat_id, 'Ateca', 'suv mediana', true),
        (seat_id, 'Tarraco', 'suv grande', true);
    END IF;
    
    IF geely_id IS NOT NULL THEN
        INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
        (geely_id, 'Coolray', 'suv compacta', true),
        (geely_id, 'Okavango', 'suv mediana', true),
        (geely_id, 'Azkarra', 'suv', true),
        (geely_id, 'Emgrand', 'sedán', true);
    END IF;
    
    RAISE NOTICE 'Modelos prioritarios agregados exitosamente';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al agregar modelos: %', SQLERRM;
END $$;