-- Insertar modelos completos de SEAT basados en el catálogo oficial 2024-2025
-- La marca SEAT ya existe con ID: 74df4b4e-f611-4294-8c0c-5e55d772a33a

DO $$
DECLARE
    seat_marca_id uuid := '74df4b4e-f611-4294-8c0c-5e55d772a33a';
BEGIN
    -- SEAT Ibiza - Compacto urbano (5 puertas)
    INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
    (seat_marca_id, 'Ibiza 5P', 'Hatchback', true),
    (seat_marca_id, 'Ibiza Style', 'Hatchback', true),
    (seat_marca_id, 'Ibiza Reference', 'Hatchback', true),
    (seat_marca_id, 'Ibiza FR', 'Hatchback', true),
    (seat_marca_id, 'Ibiza Xcellence', 'Hatchback', true),
    
    -- SEAT León - Compacto (múltiples variantes)
    (seat_marca_id, 'León 5P', 'Hatchback', true),
    (seat_marca_id, 'León Style', 'Hatchback', true),
    (seat_marca_id, 'León FR', 'Hatchback', true),
    (seat_marca_id, 'León Xcellence', 'Hatchback', true),
    (seat_marca_id, 'León Cupra', 'Hatchback', true),
    (seat_marca_id, 'León e-Hybrid', 'Hatchback', true),
    
    -- SEAT León Sportstourer (Familiar/Estate)
    (seat_marca_id, 'León Sportstourer Style', 'Familiar', true),
    (seat_marca_id, 'León Sportstourer FR', 'Familiar', true),
    (seat_marca_id, 'León Sportstourer Xcellence', 'Familiar', true),
    (seat_marca_id, 'León Sportstourer e-Hybrid', 'Familiar', true),
    
    -- SEAT Arona - SUV compacto
    (seat_marca_id, 'Arona Reference', 'SUV', true),
    (seat_marca_id, 'Arona Style', 'SUV', true),
    (seat_marca_id, 'Arona FR', 'SUV', true),
    (seat_marca_id, 'Arona Xcellence', 'SUV', true),
    (seat_marca_id, 'Arona TGI', 'SUV', true),
    
    -- SEAT Ateca - SUV mediano
    (seat_marca_id, 'Ateca Reference', 'SUV', true),
    (seat_marca_id, 'Ateca Style', 'SUV', true),
    (seat_marca_id, 'Ateca FR', 'SUV', true),
    (seat_marca_id, 'Ateca Xcellence', 'SUV', true),
    (seat_marca_id, 'Ateca 4Drive', 'SUV', true),
    (seat_marca_id, 'Ateca e-Hybrid', 'SUV', true),
    
    -- SEAT Tarraco - SUV grande (7 plazas)
    (seat_marca_id, 'Tarraco Style', 'SUV', true),
    (seat_marca_id, 'Tarraco FR', 'SUV', true),
    (seat_marca_id, 'Tarraco Xcellence', 'SUV', true),
    (seat_marca_id, 'Tarraco 4Drive', 'SUV', true),
    (seat_marca_id, 'Tarraco e-Hybrid', 'SUV', true),
    
    -- SEAT Alhambra - Monovolumen (7 plazas)
    (seat_marca_id, 'Alhambra Reference', 'Monovolumen', true),
    (seat_marca_id, 'Alhambra Style', 'Monovolumen', true),
    (seat_marca_id, 'Alhambra Xcellence', 'Monovolumen', true),
    
    -- Modelos especiales y ediciones limitadas
    (seat_marca_id, 'León Cupra 300', 'Hatchback', true),
    (seat_marca_id, 'Ateca Cupra', 'SUV', true),
    (seat_marca_id, 'Ibiza Beats', 'Hatchback', true),
    (seat_marca_id, 'León ST Cupra', 'Familiar', true),
    
    -- Versiones TGI (Gas Natural)
    (seat_marca_id, 'Ibiza TGI', 'Hatchback', true),
    (seat_marca_id, 'León TGI', 'Hatchback', true),
    (seat_marca_id, 'León Sportstourer TGI', 'Familiar', true);
    
    RAISE NOTICE 'Se han insertado % modelos de SEAT exitosamente', 41;
    
END $$;