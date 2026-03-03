-- Fix siniestros_historico with real service volumes from servicios_custodia
UPDATE siniestros_historico SET servicios_solicitados = 686, servicios_completados = 686 WHERE fecha = '2024-01-01';
UPDATE siniestros_historico SET servicios_solicitados = 785, servicios_completados = 785 WHERE fecha = '2024-02-01';
UPDATE siniestros_historico SET servicios_solicitados = 926, servicios_completados = 926 WHERE fecha = '2024-03-01';
UPDATE siniestros_historico SET servicios_solicitados = 902, servicios_completados = 902 WHERE fecha = '2024-04-01';
UPDATE siniestros_historico SET servicios_solicitados = 943, servicios_completados = 943 WHERE fecha = '2024-05-01';
UPDATE siniestros_historico SET servicios_solicitados = 933, servicios_completados = 933 WHERE fecha = '2024-06-01';
UPDATE siniestros_historico SET servicios_solicitados = 837, servicios_completados = 837 WHERE fecha = '2024-07-01';
UPDATE siniestros_historico SET servicios_solicitados = 1014, servicios_completados = 1014 WHERE fecha = '2024-08-01';
UPDATE siniestros_historico SET servicios_solicitados = 906, servicios_completados = 906 WHERE fecha = '2024-09-01';
UPDATE siniestros_historico SET servicios_solicitados = 1024, servicios_completados = 1024 WHERE fecha = '2024-10-01';
UPDATE siniestros_historico SET servicios_solicitados = 919, servicios_completados = 919 WHERE fecha = '2024-11-01';
UPDATE siniestros_historico SET servicios_solicitados = 841, servicios_completados = 841 WHERE fecha = '2024-12-01';
UPDATE siniestros_historico SET servicios_solicitados = 627, servicios_completados = 627 WHERE fecha = '2025-01-01';
UPDATE siniestros_historico SET servicios_solicitados = 486, servicios_completados = 486 WHERE fecha = '2025-02-01';
UPDATE siniestros_historico SET servicios_solicitados = 794, servicios_completados = 794 WHERE fecha = '2025-03-01';
UPDATE siniestros_historico SET servicios_solicitados = 730, servicios_completados = 730 WHERE fecha = '2025-04-01';
UPDATE siniestros_historico SET servicios_solicitados = 786, servicios_completados = 786 WHERE fecha = '2025-05-01';
UPDATE siniestros_historico SET servicios_solicitados = 794, servicios_completados = 794 WHERE fecha = '2025-06-01';
UPDATE siniestros_historico SET servicios_solicitados = 950, servicios_completados = 950 WHERE fecha = '2025-07-01';
UPDATE siniestros_historico SET servicios_solicitados = 935, servicios_completados = 935 WHERE fecha = '2025-08-01';
UPDATE siniestros_historico SET servicios_solicitados = 1028, servicios_completados = 1028 WHERE fecha = '2025-09-01';
UPDATE siniestros_historico SET servicios_solicitados = 1312, servicios_completados = 1312 WHERE fecha = '2025-10-01';
UPDATE siniestros_historico SET servicios_solicitados = 965, servicios_completados = 965 WHERE fecha = '2025-11-01';
UPDATE siniestros_historico SET servicios_solicitados = 856, servicios_completados = 856 WHERE fecha = '2025-12-01';
UPDATE siniestros_historico SET servicios_solicitados = 694, servicios_completados = 694 WHERE fecha = '2026-01-01';
UPDATE siniestros_historico SET servicios_solicitados = 850, servicios_completados = 850, eventos_no_criticos = 9 WHERE fecha = '2026-02-01';

-- Reclassify agresion incident: secuestro sin robo de carga != siniestro
UPDATE incidentes_operativos SET es_siniestro = false WHERE id = 'a61ccffe-42a4-4cae-a7be-079e72065929';