
-- Insert 13 historical siniestros
INSERT INTO public.incidentes_operativos (fecha_incidente, tipo, severidad, descripcion, zona, ubicacion_lat, ubicacion_lng, cliente_nombre, atribuible_operacion, es_siniestro, estado, acciones_tomadas)
VALUES
('2024-02-06', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2024-02-10', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2024-03-05', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2024-04-27', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2024-08-14', 'robo', 'critica', 'Robo Benotto — Custodio Sergio Iván Hernández Archundia evaluado por polígrafo. Resultado: DI (engaño detectado). Se determinó participación del custodio en el robo.', 'Edo. México', NULL, NULL, 'Benotto', true, true, 'cerrado', 'Evaluación poligráfica aplicada. Custodio removido del servicio.'),
('2024-09-07', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2024-10-09', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2024-11-30', 'robo', 'critica', 'Siniestro — robo de carga (sin detalle adicional)', NULL, NULL, NULL, NULL, true, true, 'cerrado', NULL),
('2025-07-09', 'asalto', 'critica', 'Robo Monterosa — Ruta Lázaro Cárdenas a Tultepec. Operador interceptado por 3 vehículos con personas armadas. Despojan carga completa. Protocolo de reacción activado.', 'Edo. México — Lázaro Cárdenas / Tultepec', 19.6847, -99.1687, 'Monterosa', true, true, 'cerrado', 'Protocolo de reacción activado. Llamada 911. Notificación inmediata al cliente. Rastreo GPS post-evento.'),
('2025-09-03', 'asalto', 'critica', 'Intento de robo Doraldent/Benotto — Custodio secuestrado temporalmente. Sujetos armados interceptaron unidad. Custodio liberado horas después.', 'Edo. México', 19.4326, -99.1332, 'Doraldent', true, true, 'cerrado', 'Protocolo de emergencia. Llamada 911. Coordinación con autoridades. Denuncia MP.'),
('2025-11-05', 'robo', 'critica', 'Robo unidad Monterosa — Servicio local. Despojan carga completa.', 'CDMX / Edo. México', NULL, NULL, 'Monterosa', true, true, 'cerrado', NULL),
('2025-11-27', 'robo', 'critica', 'Robo Suave-Fácil — Ruta Naucalpan a Monterrey. Carga sustraída en tránsito foráneo.', 'Naucalpan — Monterrey', NULL, NULL, 'Suave-Facil', true, true, 'cerrado', NULL),
('2025-12-02', 'robo', 'critica', 'Robo CrossMotion — Entrando a GDL. Folio CRCSMTI-18. Carga sustraída.', 'Jalisco — GDL', NULL, NULL, 'CrossMotion', true, true, 'cerrado', NULL);

-- Reclassify existing non-critical events
UPDATE public.incidentes_operativos SET severidad = 'media' WHERE id = 'e7c7bb89-b560-4e2f-ba80-08e1ff0e46aa';
UPDATE public.incidentes_operativos SET severidad = 'media' WHERE id = 'd3590558-f3f2-4ad9-bab8-9e835c14d000';
UPDATE public.incidentes_operativos SET es_siniestro = true WHERE id = 'a61ccffe-42a4-4cae-a7be-079e72065929';

-- Insert Fill Rate monthly data
INSERT INTO public.siniestros_historico (fecha, servicios_solicitados, servicios_completados, siniestros, eventos_no_criticos, nota)
VALUES
('2024-01-01', 0, 0, 0, 0, 'Sin datos de siniestros'),
('2024-02-01', 0, 0, 2, 0, '2 siniestros registrados'),
('2024-03-01', 0, 0, 1, 0, '1 siniestro registrado'),
('2024-04-01', 0, 0, 1, 0, '1 siniestro registrado'),
('2024-05-01', 0, 0, 0, 0, 'Sin siniestros'),
('2024-06-01', 0, 0, 0, 0, 'Sin siniestros'),
('2024-07-01', 0, 0, 0, 0, 'Sin siniestros'),
('2024-08-01', 0, 0, 1, 0, '1 siniestro — Robo Benotto'),
('2024-09-01', 0, 0, 1, 0, '1 siniestro'),
('2024-10-01', 0, 0, 1, 0, '1 siniestro'),
('2024-11-01', 0, 0, 1, 0, '1 siniestro'),
('2024-12-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-01-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-02-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-03-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-04-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-05-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-06-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-07-01', 0, 0, 1, 0, '1 siniestro — Monterosa asalto'),
('2025-08-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-09-01', 0, 0, 1, 0, '1 siniestro — Doraldent intento robo + secuestro'),
('2025-10-01', 0, 0, 0, 0, 'Sin siniestros'),
('2025-11-01', 0, 0, 2, 0, '2 siniestros — Monterosa + Suave-Facil'),
('2025-12-01', 0, 0, 1, 0, '1 siniestro — CrossMotion'),
('2026-01-01', 0, 0, 0, 0, 'Sin siniestros'),
('2026-02-01', 0, 0, 0, 10, '10 eventos no críticos registrados')
ON CONFLICT (fecha) DO NOTHING;
