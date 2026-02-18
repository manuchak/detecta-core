
INSERT INTO public.safe_points (name, type, lat, lng, address, corridor_id, km_marker, has_security_guard, has_employees_24h, has_visible_cctv, has_military_nearby, is_well_lit, is_recognized_chain, has_perimeter_barrier, has_commercial_activity, truck_fits_inside, has_alternate_exit, has_restrooms, has_cell_signal, total_score, certification_level, verification_status, notes, is_active) VALUES
-- Corredor México-Querétaro
('Oxxo Tepotzotlán (Caseta)', 'tienda_conveniencia', 19.7145, -99.2239, 'Autopista México-Querétaro km 38, Tepotzotlán, Edo. Méx.', 'mex-qro', 38, true, true, true, false, true, true, false, true, false, false, true, true, 9, 'oro', 'verified', 'Punto frecuente de parada, buena iluminación nocturna', true),
('Gasolinera Palmillas', 'gasolinera', 20.3812, -99.9543, 'Autopista México-Querétaro km 152, Palmillas, Qro.', 'mex-qro', 152, true, true, true, false, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', 'Amplio estacionamiento para tráileres, zona segura', true),
('Estacionamiento La Marquesa', 'estacionamiento', 19.3187, -99.3654, 'Carretera México-Toluca km 28, La Marquesa, Edo. Méx.', 'mex-tol', 28, false, false, false, false, false, false, true, false, true, true, false, true, 4, 'precaucion', 'pending', 'Solo usar de día, sin vigilancia nocturna', true),

-- Corredor Querétaro-SLP
('Hotel City Express SLP', 'hotel', 22.1495, -100.9737, 'Carretera Central km 420, San Luis Potosí, SLP', 'qro-slp', 420, true, true, true, false, true, true, true, true, true, false, true, true, 11, 'oro', 'verified', 'Estacionamiento cerrado con acceso controlado', true),
('Gasolinera San Juan del Río', 'gasolinera', 20.3877, -99.9961, 'Autopista 57D km 165, San Juan del Río, Qro.', 'qro-slp', 165, true, true, true, false, true, true, false, true, true, false, true, true, 10, 'plata', 'verified', 'Cadena reconocida, buen flujo vehicular', true),

-- Corredor CDMX-Puebla
('Gasolinera Río Frío', 'gasolinera', 19.3502, -98.6734, 'Autopista México-Puebla km 55, Río Frío, Edo. Méx.', 'cdmx-pue', 55, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'verified', 'Zona de niebla frecuente, precaución nocturna', true),
('Caseta Amozoc', 'caseta_peaje', 19.0472, -97.9968, 'Autopista Puebla-Veracruz km 135, Amozoc, Pue.', 'pue-ver', 135, true, true, true, true, true, false, true, true, false, false, true, true, 10, 'plata', 'verified', 'Presencia militar frecuente en caseta', true),

-- Corredor Puebla-Veracruz
('Oxxo Perote', 'tienda_conveniencia', 19.5662, -97.2422, 'Carretera Perote-Xalapa km 25, Perote, Ver.', 'pue-ver', 200, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'bronce', 'verified', 'Zona fría, parada corta recomendada', true),
('Gasolinera Fortín de las Flores', 'gasolinera', 18.9048, -96.9981, 'Autopista Orizaba-Córdoba km 310, Fortín, Ver.', 'pue-ver', 310, true, true, true, false, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', 'Punto seguro certificado, excelente infraestructura', true),

-- Corredor Guadalajara-Manzanillo
('Base Militar Colima', 'base_militar', 19.2433, -103.7250, 'Carretera Colima-Manzanillo km 45, Colima, Col.', 'gdl-mzl', 45, true, true, true, true, true, false, true, false, true, true, true, true, 11, 'oro', 'verified', 'Base militar activa 24/7, máxima seguridad', true),
('Gasolinera Tecomán', 'gasolinera', 18.9108, -103.8777, 'Carretera Tecomán-Manzanillo km 80, Tecomán, Col.', 'gdl-mzl', 80, true, true, false, false, true, true, false, true, true, false, true, true, 8, 'plata', 'pending', 'Verificación pendiente de CCTV', true),

-- Corredor Monterrey-Nuevo Laredo
('Estación Sabinas Hidalgo', 'gasolinera', 26.5094, -100.1783, 'Carretera 85 km 100, Sabinas Hidalgo, NL', 'mty-nld', 100, true, true, true, true, true, true, true, true, true, true, true, true, 12, 'oro', 'verified', 'Corredor industrial vigilado, punto estratégico', true),
('Oxxo Ciénega de Flores', 'tienda_conveniencia', 25.9551, -100.1649, 'Autopista Monterrey-Laredo km 35, Ciénega de Flores, NL', 'mty-nld', 35, false, true, true, false, true, true, false, true, false, false, true, true, 7, 'bronce', 'verified', 'Zona urbana, tráfico constante', true),

-- Corredor León-Aguascalientes
('Hotel Fiesta Inn Aguascalientes', 'hotel', 21.8818, -102.2916, 'Blvd. José María Chávez 1919, Aguascalientes, Ags.', 'leon-ags', 120, true, true, true, false, true, true, true, true, true, false, true, true, 11, 'oro', 'verified', 'Estacionamiento subterráneo vigilado', true),
('Gasolinera Lagos de Moreno', 'gasolinera', 21.3548, -101.9296, 'Carretera León-Aguascalientes km 60, Lagos de Moreno, Jal.', 'leon-ags', 60, true, true, false, false, true, true, false, true, true, true, true, true, 9, 'plata', 'legacy', 'Punto histórico, requiere re-verificación', true),

-- Corredor Veracruz-Villahermosa
('Caseta Acayucan', 'caseta_peaje', 17.9489, -94.9145, 'Autopista Veracruz-Villahermosa km 250, Acayucan, Ver.', 'ver-vhsa', 250, true, true, true, true, true, false, true, true, true, false, true, true, 11, 'oro', 'verified', 'Presencia GN permanente, zona crítica controlada', true),
('Gasolinera Coatzacoalcos', 'gasolinera', 18.1341, -94.4587, 'Carretera Trans-Ístmica km 290, Coatzacoalcos, Ver.', 'ver-vhsa', 290, true, true, true, false, true, true, false, true, true, false, true, true, 9, 'plata', 'pending', 'Zona industrial, buena actividad comercial', true);
