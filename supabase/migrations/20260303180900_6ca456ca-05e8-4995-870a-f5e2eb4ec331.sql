INSERT INTO safe_points (name, type, lat, lng, address, corridor_id, km_marker, has_security_guard, has_employees_24h, has_visible_cctv, has_military_nearby, is_well_lit, is_recognized_chain, has_perimeter_barrier, has_commercial_activity, truck_fits_inside, has_alternate_exit, has_restrooms, has_cell_signal, total_score, certification_level, verification_status, is_active) VALUES
-- CORREDOR 1: México-Puebla (mexico-puebla)
('Pemex San Buenaventura', 'gasolinera', 19.3950, -99.0200, 'Autopista México-Puebla Km 15', 'mexico-puebla', 15, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Los Reyes La Paz', 'tienda', 19.3900, -98.9800, 'Autopista 150D Km 25', 'mexico-puebla', 25, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Caseta Chalco', 'caseta', 19.3400, -98.8900, 'Caseta Chalco Km 45', 'mexico-puebla', 45, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Base GN San Martín Texmelucan', 'base_gn', 19.2800, -98.4500, 'Carr. 150 Km 80', 'mexico-puebla', 80, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Huejotzingo', 'gasolinera', 19.2750, -98.4000, 'Autopista 150D Km 90', 'mexico-puebla', 90, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('7-Eleven Puebla Norte', 'tienda', 19.1200, -98.2500, 'Blvd Norte Puebla Km 120', 'mexico-puebla', 120, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Amozoc', 'gasolinera', 19.0500, -98.0400, 'Carr. 150D Km 140', 'mexico-puebla', 140, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),

-- CORREDOR 2: SLP Hub (san-luis-potosi-hub)
('Pemex SLP Norte', 'gasolinera', 22.1700, -100.9500, 'Carr. 57 Norte Km 5', 'san-luis-potosi-hub', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Base GN Soledad', 'base_gn', 22.1900, -100.8800, 'Soledad de Graciano Sánchez', 'san-luis-potosi-hub', 15, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Caseta Villa de Reyes', 'caseta', 21.8500, -100.9200, 'Autopista 57D Km 50', 'san-luis-potosi-hub', 50, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Oxxo Villa de Reyes', 'tienda', 21.8100, -100.9000, 'Carr. 57 Km 55', 'san-luis-potosi-hub', 55, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Ojuelos', 'gasolinera', 21.6500, -101.2000, 'Carr. 70 Km 80', 'san-luis-potosi-hub', 80, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),

-- CORREDOR 3: Lázaro Cárdenas-CDMX (lazaro-cardenas-cdmx)
('Pemex Lázaro Cárdenas Puerto', 'gasolinera', 17.9560, -102.1800, 'Puerto LC Km 5', 'lazaro-cardenas-cdmx', 5, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', true),
('Base Naval Lázaro Cárdenas', 'base_gn', 17.9400, -102.1600, 'Puerto Industrial Km 10', 'lazaro-cardenas-cdmx', 10, true, true, true, true, true, false, true, false, true, true, false, true, 9, 'oro', 'verified', true),
('Oxxo Arteaga Mich', 'tienda', 18.3500, -102.2800, 'Carr. 37D Km 50', 'lazaro-cardenas-cdmx', 50, false, true, false, false, true, true, false, true, false, false, true, false, 5, 'bronce', 'verified', true),
('Pemex Nueva Italia', 'gasolinera', 19.0000, -102.1000, 'Carr. 37 Km 90', 'lazaro-cardenas-cdmx', 90, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Caseta Uruapan', 'caseta', 19.3800, -102.0500, 'Autopista Uruapan Km 140', 'lazaro-cardenas-cdmx', 140, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Pátzcuaro', 'gasolinera', 19.5100, -101.6100, 'Carr. 14 Km 200', 'lazaro-cardenas-cdmx', 200, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Base GN Morelia Sur', 'base_gn', 19.6800, -101.1900, 'Periférico Morelia Km 260', 'lazaro-cardenas-cdmx', 260, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Maravatío', 'gasolinera', 19.8900, -100.4400, 'Carr. 126 Km 340', 'lazaro-cardenas-cdmx', 340, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Caseta Atlacomulco', 'caseta', 19.7900, -99.8700, 'Autopista 55D Km 390', 'lazaro-cardenas-cdmx', 390, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Toluca Oriente', 'gasolinera', 19.2800, -99.5500, 'Paseo Tollocan Km 420', 'lazaro-cardenas-cdmx', 420, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR 4: Manzanillo-Tampico (manzanillo-tampico)
('Pemex Manzanillo Puerto', 'gasolinera', 19.0500, -104.3100, 'Puerto Manzanillo Km 5', 'manzanillo-tampico', 5, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', true),
('Caseta Colima', 'caseta', 19.2300, -103.7200, 'Autopista Colima-GDL Km 100', 'manzanillo-tampico', 100, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Ciudad Guzmán', 'gasolinera', 19.7000, -103.4600, 'Carr. 54 Km 150', 'manzanillo-tampico', 150, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Oxxo Acatlán de Juárez', 'tienda', 20.2000, -103.5900, 'Carr. 54D Km 180', 'manzanillo-tampico', 180, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex El Salto GDL', 'gasolinera', 20.5200, -103.2800, 'Periférico GDL Sur Km 200', 'manzanillo-tampico', 200, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Base GN Tonalá', 'base_gn', 20.6200, -103.2300, 'Periférico GDL Km 210', 'manzanillo-tampico', 210, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Caseta Lagos de Moreno', 'caseta', 21.3500, -102.0000, 'Autopista 80D Km 330', 'manzanillo-tampico', 330, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Aguascalientes Sur', 'gasolinera', 21.8500, -102.2800, 'Carr. 45 Sur Km 400', 'manzanillo-tampico', 400, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Pemex Altiplano Potosino', 'gasolinera', 22.0500, -101.5000, 'Carr. 70 Km 470', 'manzanillo-tampico', 470, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Caseta Río Verde', 'caseta', 21.9300, -99.9900, 'Carr. 70 Km 580', 'manzanillo-tampico', 580, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Ciudad Valles', 'gasolinera', 21.9900, -99.0100, 'Carr. 85 Km 700', 'manzanillo-tampico', 700, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Tampico Puerto', 'gasolinera', 22.2400, -97.8500, 'Av. Hidalgo Tampico Km 850', 'manzanillo-tampico', 850, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', true),

-- CORREDOR 5: Arco Norte (arco-norte)
('Caseta Tizayuca', 'caseta', 19.8400, -98.9800, 'Arco Norte Km 5', 'arco-norte', 5, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex San Martín Pirámides', 'gasolinera', 19.7400, -98.7800, 'Arco Norte Km 35', 'arco-norte', 35, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Oxxo Ecatepec Norte', 'tienda', 19.6500, -99.0200, 'Arco Norte Km 65', 'arco-norte', 65, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Tultitlán', 'gasolinera', 19.6400, -99.1700, 'Arco Norte Km 100', 'arco-norte', 100, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Cuautitlán', 'caseta', 19.6700, -99.1900, 'Arco Norte Km 135', 'arco-norte', 135, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Huehuetoca', 'gasolinera', 19.8300, -99.2000, 'Arco Norte Km 165', 'arco-norte', 165, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Caseta Tepeji del Río', 'caseta', 19.9000, -99.3400, 'Conexión 57D Km 195', 'arco-norte', 195, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),

-- CORREDOR 6: CEM (circuito-exterior-mexiquense)
('Pemex La Paz EdoMex', 'gasolinera', 19.3600, -98.9600, 'CEM Km 5', 'circuito-exterior-mexiquense', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Chalco CEM', 'tienda', 19.2700, -98.8900, 'CEM Km 20', 'circuito-exterior-mexiquense', 20, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Caseta Texcoco', 'caseta', 19.5100, -98.8800, 'CEM Km 40', 'circuito-exterior-mexiquense', 40, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Ecatepec CEM', 'gasolinera', 19.6100, -99.0100, 'CEM Km 60', 'circuito-exterior-mexiquense', 60, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR 7: Querétaro-León-Irapuato (queretaro-leon-irapuato)
('Pemex Querétaro Norte', 'gasolinera', 20.6300, -100.3800, 'Carr. 45 Norte Km 5', 'queretaro-leon-irapuato', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta San Juan del Río', 'caseta', 20.3900, -99.9900, 'Autopista 57D Km 40', 'queretaro-leon-irapuato', 40, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Celaya', 'gasolinera', 20.5200, -100.8100, 'Carr. 45D Km 80', 'queretaro-leon-irapuato', 80, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Base GN Celaya', 'base_gn', 20.5300, -100.8200, 'Blvd. López Mateos Celaya', 'queretaro-leon-irapuato', 82, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Oxxo Salamanca', 'tienda', 20.5700, -101.1900, 'Carr. 45D Km 110', 'queretaro-leon-irapuato', 110, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Irapuato', 'gasolinera', 20.6700, -101.3500, 'Blvd Irapuato Km 130', 'queretaro-leon-irapuato', 130, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Silao', 'caseta', 20.9500, -101.4200, 'Autopista 45D Km 160', 'queretaro-leon-irapuato', 160, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex León Norte', 'gasolinera', 21.1200, -101.6800, 'Blvd López Mateos León', 'queretaro-leon-irapuato', 190, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Base GN León', 'base_gn', 21.1300, -101.6900, 'Periférico León Km 195', 'queretaro-leon-irapuato', 195, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),

-- CORREDOR 8: Puebla-Veracruz (puebla-veracruz)
('Pemex Puebla Oriente', 'gasolinera', 19.0200, -98.1500, 'Autopista Puebla-Orizaba Km 10', 'puebla-veracruz', 10, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Amozoc', 'caseta', 19.0300, -98.0500, 'Autopista 150D Km 25', 'puebla-veracruz', 25, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Oxxo Tepeaca', 'tienda', 18.9600, -97.8100, 'Carr. 150 Km 50', 'puebla-veracruz', 50, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Esperanza', 'gasolinera', 18.8500, -97.3700, 'Carr. 150D Km 100', 'puebla-veracruz', 100, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Caseta Orizaba', 'caseta', 18.8500, -97.1000, 'Autopista 150D Km 130', 'puebla-veracruz', 130, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Base GN Córdoba', 'base_gn', 18.8800, -96.9300, 'Carr. 150D Km 155', 'puebla-veracruz', 155, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Córdoba', 'gasolinera', 18.8900, -96.9200, 'Blvd Córdoba Km 160', 'puebla-veracruz', 160, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Fortín de las Flores', 'tienda', 18.9000, -97.0000, 'Carr. 150D Km 145', 'puebla-veracruz', 145, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Veracruz Puerto', 'gasolinera', 19.1800, -96.1500, 'Av. Salvador Díaz Mirón Veracruz', 'puebla-veracruz', 300, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', true),

-- CORREDOR 9: Veracruz-Villahermosa (veracruz-villahermosa)
('Pemex Boca del Río', 'gasolinera', 19.1100, -96.1000, 'Blvd Costero Km 10', 'veracruz-villahermosa', 10, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Alvarado', 'caseta', 18.7700, -95.7600, 'Autopista Km 60', 'veracruz-villahermosa', 60, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex San Andrés Tuxtla', 'gasolinera', 18.4500, -95.2100, 'Carr. 180 Km 130', 'veracruz-villahermosa', 130, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Oxxo Acayucan', 'tienda', 17.9500, -94.9100, 'Carr. 180 Km 200', 'veracruz-villahermosa', 200, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Minatitlán', 'gasolinera', 17.9800, -94.5500, 'Carr. 185 Km 250', 'veracruz-villahermosa', 250, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Base GN Coatzacoalcos', 'base_gn', 18.1400, -94.4500, 'Carr. Trans-Ístmica Km 280', 'veracruz-villahermosa', 280, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Cárdenas Tab', 'gasolinera', 18.0000, -93.3700, 'Carr. 180 Km 370', 'veracruz-villahermosa', 370, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'verified', true),
('Pemex Villahermosa', 'gasolinera', 17.9900, -92.9300, 'Periférico Villahermosa Km 440', 'veracruz-villahermosa', 440, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR 10: CDMX-Querétaro (mexico-queretaro)
('Pemex Tlalnepantla', 'gasolinera', 19.5400, -99.2000, 'Autopista 57D Km 15', 'mexico-queretaro', 15, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Tepotzotlán', 'caseta', 19.7100, -99.2200, 'Autopista 57D Km 40', 'mexico-queretaro', 40, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Jilotepec', 'gasolinera', 19.9500, -99.5300, 'Autopista 57D Km 90', 'mexico-queretaro', 90, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Oxxo Polotitlán', 'tienda', 20.2200, -99.8100, 'Carr. 57 Km 130', 'mexico-queretaro', 130, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Caseta Palmillas', 'caseta', 20.3500, -99.8800, 'Autopista 57D Km 155', 'mexico-queretaro', 155, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Base GN San Juan del Río', 'base_gn', 20.3900, -100.0000, 'Carr. 57D Km 170', 'mexico-queretaro', 170, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Querétaro Sur', 'gasolinera', 20.5600, -100.3800, 'Constituyentes Qro Km 210', 'mexico-queretaro', 210, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR 11: Monterrey-Nuevo Laredo (monterrey-nuevo-laredo)
('Pemex MTY Norte', 'gasolinera', 25.7600, -100.3100, 'Carr. 85 Norte Km 10', 'monterrey-nuevo-laredo', 10, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Base GN Ciénega de Flores', 'base_gn', 25.9500, -100.1700, 'Carr. 85 Km 30', 'monterrey-nuevo-laredo', 30, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Caseta Sabinas Hidalgo', 'caseta', 26.5100, -100.1800, 'Autopista 85D Km 90', 'monterrey-nuevo-laredo', 90, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Sabinas Hidalgo', 'gasolinera', 26.5300, -100.1800, 'Carr. 85 Km 92', 'monterrey-nuevo-laredo', 92, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Oxxo Lampazos', 'tienda', 27.0200, -100.5200, 'Carr. 85 Km 140', 'monterrey-nuevo-laredo', 140, false, true, false, false, true, true, false, true, false, false, true, false, 5, 'bronce', 'verified', true),
('Pemex Nuevo Laredo Sur', 'gasolinera', 27.4200, -99.5500, 'Carr. 85 Km 210', 'monterrey-nuevo-laredo', 210, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', true),
('Base Militar Nuevo Laredo', 'base_gn', 27.4800, -99.5200, 'Puente Internacional Km 220', 'monterrey-nuevo-laredo', 220, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),

-- CORREDOR 12: GDL-Manzanillo (guadalajara-manzanillo)
('Pemex GDL Sur Periférico', 'gasolinera', 20.5800, -103.3400, 'Periférico Sur GDL Km 5', 'guadalajara-manzanillo', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Acatlán', 'caseta', 20.3500, -103.5200, 'Autopista 54D Km 30', 'guadalajara-manzanillo', 30, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Sayula', 'gasolinera', 19.8800, -103.6000, 'Carr. 54 Km 90', 'guadalajara-manzanillo', 90, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Oxxo Autlán', 'tienda', 19.7700, -104.3700, 'Carr. 80 Km 160', 'guadalajara-manzanillo', 160, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Cihuatlán', 'gasolinera', 19.2400, -104.5700, 'Carr. 200 Km 230', 'guadalajara-manzanillo', 230, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'verified', true),

-- CORREDOR 13: México-Toluca (mexico-toluca)
('Pemex Santa Fe CDMX', 'gasolinera', 19.3600, -99.2600, 'Autopista Mex-Tol Km 5', 'mexico-toluca', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta La Marquesa', 'caseta', 19.3000, -99.3600, 'Autopista 15D Km 25', 'mexico-toluca', 25, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Lerma', 'gasolinera', 19.2800, -99.5100, 'Autopista 15D Km 45', 'mexico-toluca', 45, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Toluca Centro', 'tienda', 19.2900, -99.6500, 'Paseo Tollocan Km 60', 'mexico-toluca', 60, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),

-- CORREDOR 14: Altiplano-Bajío (altiplano-bajio)
('Pemex San Luis de la Paz', 'gasolinera', 21.3000, -100.5100, 'Carr. 57 Km 30', 'altiplano-bajio', 30, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Caseta Dolores Hidalgo', 'caseta', 21.1600, -100.9300, 'Carr. 110 Km 60', 'altiplano-bajio', 60, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Base GN Dolores Hidalgo', 'base_gn', 21.1500, -100.9400, 'Carr. 110 Km 62', 'altiplano-bajio', 62, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex San Miguel de Allende', 'gasolinera', 20.9100, -100.7400, 'Carr. 51 Km 90', 'altiplano-bajio', 90, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Comonfort', 'tienda', 20.7200, -100.7600, 'Carr. 51 Km 115', 'altiplano-bajio', 115, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),

-- CORREDOR 15: Guadalajara-León (guadalajara-leon)
('Pemex GDL Norte Zapopan', 'gasolinera', 20.7200, -103.3800, 'Periférico Norte GDL Km 5', 'guadalajara-leon', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Tepatitlán', 'caseta', 20.8200, -102.7600, 'Autopista 80D Km 60', 'guadalajara-leon', 60, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Arandas', 'gasolinera', 20.6900, -102.3400, 'Carr. 80 Km 100', 'guadalajara-leon', 100, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Oxxo Lagos de Moreno', 'tienda', 21.3600, -102.0100, 'Carr. 80 Km 140', 'guadalajara-leon', 140, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex León Oriente', 'gasolinera', 21.1200, -101.6500, 'Blvd López Mateos Km 190', 'guadalajara-leon', 190, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR 16: Monterrey-Saltillo (monterrey-saltillo)
('Pemex MTY Oeste', 'gasolinera', 25.6700, -100.4200, 'Carr. 40 Km 10', 'monterrey-saltillo', 10, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Santa Catarina', 'caseta', 25.6700, -100.4800, 'Autopista 40D Km 20', 'monterrey-saltillo', 20, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Oxxo Los Chorros', 'tienda', 25.4800, -100.6500, 'Carr. 40 Km 45', 'monterrey-saltillo', 45, false, true, false, false, true, true, false, true, false, false, true, false, 5, 'bronce', 'verified', true),
('Pemex Saltillo Oriente', 'gasolinera', 25.4200, -100.9500, 'Periférico Saltillo Km 80', 'monterrey-saltillo', 80, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Base GN Saltillo', 'base_gn', 25.4100, -100.9800, 'Blvd Venustiano Carranza Km 85', 'monterrey-saltillo', 85, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),

-- CORREDOR 17: Chihuahua-Juárez (chihuahua-juarez)
('Pemex Chihuahua Norte', 'gasolinera', 28.6600, -106.0900, 'Carr. 45 Norte Km 10', 'chihuahua-juarez', 10, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Ávalos', 'caseta', 28.7500, -106.1200, 'Autopista 45D Km 25', 'chihuahua-juarez', 25, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Villa Ahumada', 'gasolinera', 30.6200, -106.5100, 'Carr. 45 Km 180', 'chihuahua-juarez', 180, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Oxxo Samalayuca', 'tienda', 31.3500, -106.4800, 'Carr. 45 Km 280', 'chihuahua-juarez', 280, false, true, false, false, true, true, false, false, false, false, true, false, 4, 'precaucion', 'verified', true),
('Base Militar Juárez', 'base_gn', 31.6900, -106.4200, 'Carr. 45 Km 350', 'chihuahua-juarez', 350, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Pemex Juárez Oriente', 'gasolinera', 31.6900, -106.4000, 'Av. Tecnológico Juárez Km 355', 'chihuahua-juarez', 355, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR 18: Mazatlán-Durango (mazatlan-durango)
('Pemex Mazatlán Norte', 'gasolinera', 23.2600, -106.4200, 'Carr. 15 Norte Km 5', 'mazatlan-durango', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Concordia', 'caseta', 23.2900, -105.8300, 'Autopista 40D Km 40', 'mazatlan-durango', 40, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Espinazo del Diablo', 'gasolinera', 23.6400, -105.6500, 'Carr. 40D Km 100', 'mazatlan-durango', 100, true, true, false, false, true, true, false, false, true, false, true, false, 6, 'bronce', 'verified', true),
('Base GN Espinazo', 'base_gn', 23.6800, -105.5800, 'Autopista 40D Km 110', 'mazatlan-durango', 110, true, true, true, true, true, false, true, false, true, true, false, false, 8, 'plata', 'verified', true),
('Oxxo El Salto Durango', 'tienda', 23.7800, -105.3600, 'Carr. 40 Km 140', 'mazatlan-durango', 140, false, true, false, false, true, true, false, true, false, false, true, false, 5, 'bronce', 'verified', true),
('Pemex Durango Poniente', 'gasolinera', 24.0200, -104.7000, 'Blvd Durango Km 200', 'mazatlan-durango', 200, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),

-- CORREDOR EXTRA: León-Aguascalientes (leon-aguascalientes)
('Pemex León Sur', 'gasolinera', 21.0800, -101.6700, 'Blvd Aeropuerto León Km 5', 'leon-aguascalientes', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Lagos Moreno Sur', 'caseta', 21.3500, -101.9200, 'Autopista 45D Km 60', 'leon-aguascalientes', 60, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Encarnación de Díaz', 'gasolinera', 21.5200, -102.2300, 'Carr. 45 Km 100', 'leon-aguascalientes', 100, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Oxxo Aguascalientes Sur', 'tienda', 21.8200, -102.2900, 'Av. Aguascalientes Sur Km 130', 'leon-aguascalientes', 130, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),

-- CORREDOR EXTRA: Querétaro-SLP (queretaro-slp)
('Pemex Querétaro Oriente', 'gasolinera', 20.6100, -100.3500, 'Carr. 57 Norte Km 5', 'queretaro-slp', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Pedro Escobedo', 'caseta', 20.7500, -100.1500, 'Autopista 57D Km 30', 'queretaro-slp', 30, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex San Luis de la Paz QSP', 'gasolinera', 21.3100, -100.5000, 'Carr. 57 Km 100', 'queretaro-slp', 100, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'verified', true),
('Oxxo Matehuala', 'tienda', 23.6500, -100.6400, 'Carr. 57 Km 200', 'queretaro-slp', 200, false, true, true, false, true, true, false, true, false, false, true, false, 6, 'bronce', 'verified', true),
('Pemex Matehuala', 'gasolinera', 23.6600, -100.6300, 'Carr. 57 Km 202', 'queretaro-slp', 202, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),

-- EXTRA PUNTOS: Densificación corredores principales
('Pemex Rio Frío', 'gasolinera', 19.3500, -98.6800, 'Autopista 150D Km 55', 'mexico-puebla', 55, true, true, false, false, true, true, false, true, true, false, true, false, 7, 'plata', 'verified', true),
('Oxxo Tlaxcala Entrada', 'tienda', 19.3100, -98.2400, 'Carr. 117 Km 70', 'mexico-puebla', 70, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Apizaco', 'gasolinera', 19.4200, -98.1400, 'Carr. 136 Km 35', 'mexico-puebla', 35, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Caseta Rinconada', 'caseta', 19.0100, -97.3400, 'Autopista 150D Km 110', 'puebla-veracruz', 110, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Cotaxtla', 'gasolinera', 18.9800, -96.3700, 'Carr. 180 Km 250', 'puebla-veracruz', 250, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'verified', true),
('Oxxo Tierra Blanca', 'tienda', 18.4500, -96.3400, 'Carr. 175 Km 200', 'veracruz-villahermosa', 200, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Coatzacoalcos Centro', 'gasolinera', 18.1500, -94.4300, 'Blvd Trans-Ístmica Km 285', 'veracruz-villahermosa', 285, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Huimanguillo', 'caseta', 17.8400, -93.3900, 'Autopista 180D Km 350', 'veracruz-villahermosa', 350, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Tepotzotlán Libre', 'gasolinera', 19.7200, -99.2100, 'Carr. 57 Libre Km 42', 'mexico-queretaro', 42, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Oxxo Tula de Allende', 'tienda', 20.0500, -99.3400, 'Carr. 57 Km 85', 'mexico-queretaro', 85, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Pedro Escobedo', 'gasolinera', 20.5100, -100.1400, 'Carr. 57D Km 190', 'mexico-queretaro', 190, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo García NL', 'tienda', 25.7800, -100.5900, 'Carr. 40 Km 25', 'monterrey-saltillo', 25, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Ramos Arizpe', 'gasolinera', 25.5500, -100.9500, 'Carr. 40D Km 65', 'monterrey-saltillo', 65, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Chihuahua Sur', 'tienda', 28.6100, -106.0800, 'Periférico Chihuahua Km 5', 'chihuahua-juarez', 5, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Caseta Ojo Laguna', 'caseta', 29.8500, -106.5500, 'Autopista 45D Km 140', 'chihuahua-juarez', 140, true, true, true, false, true, false, true, true, true, false, true, false, 8, 'plata', 'verified', true),
('Pemex Guadalupe Bravos', 'gasolinera', 31.3200, -106.5100, 'Carr. 45 Km 290', 'chihuahua-juarez', 290, true, true, false, true, true, true, false, true, true, false, true, false, 8, 'plata', 'verified', true),
('Oxxo Mazatlán Centro', 'tienda', 23.2400, -106.4300, 'Av. del Mar Km 3', 'mazatlan-durango', 3, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Caseta El Palmito', 'caseta', 23.5500, -105.8200, 'Autopista 40D Km 70', 'mazatlan-durango', 70, true, true, true, false, true, false, true, true, true, false, true, false, 8, 'plata', 'verified', true),
('Pemex Nombre de Dios', 'gasolinera', 23.8400, -104.8200, 'Carr. 40 Km 170', 'mazatlan-durango', 170, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'verified', true),
('Oxxo GDL Periférico Sur', 'tienda', 20.5900, -103.4100, 'Anillo Periférico Km 5', 'guadalajara-manzanillo', 5, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex Tala Jalisco', 'gasolinera', 20.6500, -103.7000, 'Carr. 15 Km 40', 'guadalajara-manzanillo', 40, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'oro', 'verified', true),
('Caseta Barra de Navidad', 'caseta', 19.2000, -104.6800, 'Carr. 200 Km 250', 'guadalajara-manzanillo', 250, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Pemex Tepatitlán Centro', 'gasolinera', 20.8100, -102.7700, 'Carr. 80 Km 62', 'guadalajara-leon', 62, true, true, true, false, true, true, false, true, true, true, true, true, 10, 'oro', 'verified', true),
('Base GN Lagos Moreno', 'base_gn', 21.3600, -102.0200, 'Carr. 80 Km 142', 'guadalajara-leon', 142, true, true, true, true, true, false, true, false, true, true, true, true, 10, 'oro', 'verified', true),
('Caseta Guanajuato', 'caseta', 21.0200, -101.2500, 'Autopista 45D Km 175', 'queretaro-leon-irapuato', 175, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Oxxo Apaseo el Grande', 'tienda', 20.5400, -100.6800, 'Carr. 45D Km 90', 'queretaro-leon-irapuato', 90, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'plata', 'verified', true),
('Pemex MTY Ciénega', 'gasolinera', 25.9200, -100.1800, 'Carr. 85 Km 28', 'monterrey-nuevo-laredo', 28, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Oxxo Villaldama', 'tienda', 26.5000, -100.4300, 'Carr. 85 Km 100', 'monterrey-nuevo-laredo', 100, false, true, false, false, true, true, false, true, false, false, true, false, 5, 'bronce', 'verified', true),
('Caseta Colombia NL', 'caseta', 27.1200, -100.3600, 'Autopista 85D Km 160', 'monterrey-nuevo-laredo', 160, true, true, true, true, true, false, true, true, true, false, true, true, 10, 'oro', 'verified', true),

-- CORREDOR EXTRA: Pachuca-Tuxpan (pachuca-tuxpan)
('Pemex Pachuca Norte', 'gasolinera', 20.1300, -98.7300, 'Carr. 85 Norte Km 5', 'pachuca-tuxpan', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Tulancingo', 'caseta', 20.0800, -98.3800, 'Autopista 130D Km 40', 'pachuca-tuxpan', 40, true, true, true, false, true, false, true, true, true, false, true, true, 9, 'oro', 'verified', true),
('Oxxo Huauchinango', 'tienda', 20.1800, -98.0500, 'Carr. 130 Km 80', 'pachuca-tuxpan', 80, false, true, false, false, true, true, false, true, false, false, true, false, 5, 'bronce', 'verified', true),
('Pemex Poza Rica', 'gasolinera', 20.5300, -97.4600, 'Carr. 180 Km 160', 'pachuca-tuxpan', 160, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Pemex Tuxpan Puerto', 'gasolinera', 20.9600, -97.4000, 'Blvd Costero Tuxpan Km 200', 'pachuca-tuxpan', 200, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', true),

-- CORREDOR EXTRA: Aguascalientes-SLP (aguascalientes-slp)
('Pemex Aguascalientes Norte', 'gasolinera', 21.9200, -102.2800, 'Carr. 45 Norte Km 5', 'aguascalientes-slp', 5, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true),
('Caseta Pinos', 'caseta', 22.2800, -101.5800, 'Autopista 70D Km 60', 'aguascalientes-slp', 60, true, true, true, false, true, false, true, true, true, false, true, false, 8, 'plata', 'verified', true),
('Oxxo Salinas de Hidalgo', 'tienda', 22.6300, -101.7100, 'Carr. 49 Km 100', 'aguascalientes-slp', 100, false, true, false, false, true, true, false, false, false, false, true, false, 4, 'precaucion', 'verified', true),
('Pemex SLP Oriente', 'gasolinera', 22.1600, -100.9300, 'Carr. 70 Km 135', 'aguascalientes-slp', 135, true, true, true, false, true, true, true, true, true, true, true, true, 11, 'oro', 'verified', true);