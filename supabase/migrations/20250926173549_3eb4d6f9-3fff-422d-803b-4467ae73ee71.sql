-- Insertar personal de prueba para proveedores armados

-- Personal para Seguridad Integral México
INSERT INTO personal_proveedor_armados (
  proveedor_id,
  nombre_completo,
  cedula_rfc,
  telefono_personal,
  email_personal,
  licencia_portacion,
  vigencia_licencia,
  documento_identidad,
  estado_verificacion,
  activo,
  disponible_para_servicios,
  observaciones
) VALUES 
(
  '59f5c729-b42f-44ae-a9ac-672212fb032f',
  'Roberto García Martínez',
  'GAMR850315H3A',
  '+52 55 1234 5678',
  'roberto.garcia@seguridadintegral.mx',
  'LIC-SIM-001-2024',
  '2025-06-15',
  'INE-001234567',
  'verificado',
  true,
  true,
  'Personal con 8 años de experiencia en seguridad ejecutiva'
),
(
  '59f5c729-b42f-44ae-a9ac-672212fb032f',
  'Ana Patricia Hernández',
  'HEPA900822M7B',
  '+52 55 9876 5432',
  'ana.hernandez@seguridadintegral.mx',
  'LIC-SIM-002-2024',
  '2025-11-20',
  'INE-007654321',
  'verificado',
  true,
  true,
  'Especialista en custodia de valores y documentos'
),
(
  '59f5c729-b42f-44ae-a9ac-672212fb032f',
  'Carlos Eduardo López',
  'LOCE801205H1C',
  '+52 55 2468 1357',
  'carlos.lopez@seguridadintegral.mx',
  'LIC-SIM-003-2023',
  '2025-01-10',
  'INE-003456789',
  'verificado',
  true,
  true,
  'Personal de alta experiencia - Licencia próxima a vencer'
);

-- Personal para Protección Elite
INSERT INTO personal_proveedor_armados (
  proveedor_id,
  nombre_completo,
  cedula_rfc,
  telefono_personal,
  email_personal,
  licencia_portacion,
  vigencia_licencia,
  documento_identidad,
  estado_verificacion,
  activo,
  disponible_para_servicios,
  observaciones
) VALUES 
(
  '77d8b23d-6b0d-4607-bfe0-cb84721f621c',
  'Miguel Ángel Rodríguez',
  'ROMA751020H2D',
  '+52 55 3691 2580',
  'miguel.rodriguez@proteccionelite.com',
  'LIC-PE-101-2024',
  '2025-09-30',
  'INE-004567890',
  'verificado',
  true,
  true,
  'Jefe de equipo con certificación internacional'
),
(
  '77d8b23d-6b0d-4607-bfe0-cb84721f621c',
  'Sandra Beatriz Morales',
  'MOBS860314M4E',
  '+52 55 7410 8520',
  'sandra.morales@proteccionelite.com',
  'LIC-PE-102-2024',
  '2025-03-25',
  'INE-005678901',
  'verificado',
  true,
  true,
  'Especialista en traslado de ejecutivos'
),
(
  '77d8b23d-6b0d-4607-bfe0-cb84721f621c',
  'José Luis Ramírez',
  'RAJL790918H6F',
  '+52 55 8529 6374',
  'jose.ramirez@proteccionelite.com',
  'LIC-PE-103-2022',
  '2024-12-05',
  'INE-006789012',
  'en_revision',
  true,
  false,
  'Licencia vencida - En proceso de renovación'
);