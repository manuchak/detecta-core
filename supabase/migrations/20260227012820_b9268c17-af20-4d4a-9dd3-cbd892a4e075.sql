
-- =============================================
-- PASO 1: Actualizar v1.3.0 a released
-- =============================================
UPDATE system_versions 
SET status = 'released', updated_at = now() 
WHERE id = '4472a442-95d8-4f37-a8d2-443296e8e137';

-- =============================================
-- PASO 2: Insertar 7 nuevas versiones (v1.4.0 - v2.0.0)
-- =============================================

-- v1.4.0 - LMS Platform
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '1.4.0', 'LMS Platform', '2025-11-15', 'minor', 'released',
  'Plataforma completa de Learning Management System con creación de cursos, generación de contenido con IA, visor multimedia, quizzes, certificados PDF, gamificación y reportes de adopción.',
  E'## LMS Platform v1.4.0\n\n### Nuevas funcionalidades\n- Wizard de creación de cursos multi-paso\n- Generación de contenido con IA (flashcards, quizzes, texto enriquecido)\n- Visor de contenido multimedia (video, texto, SCORM, embeds, interactivos)\n- Sistema de quizzes con múltiples tipos de pregunta\n- Certificados con generación PDF y verificación pública\n- Gamificación con badges y sistema de puntos\n- Reportes de adopción, rendimiento y progreso\n- Inscripciones masivas de usuarios\n- Prompt personalizado para IA (AIPromptPopover)\n- Botón manual de completado en texto enriquecido',
  '2025-11-15T10:00:00Z', '2025-11-15T10:00:00Z'
);

-- v1.5.0 - Facturacion Hub
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '1.5.0', 'Facturación Hub', '2025-12-01', 'minor', 'released',
  'Hub completo de facturación con dashboard de KPIs, cuentas por cobrar/pagar, workflow de cobranza, gastos extraordinarios, gestión de clientes y reportes financieros.',
  E'## Facturación Hub v1.5.0\n\n### Nuevas funcionalidades\n- Dashboard de facturación con KPIs en tiempo real\n- Consulta y detalle de servicios facturables\n- Generación de facturas\n- Cuentas por cobrar con aging, cobranza y estados de cuenta\n- Cuentas por pagar a proveedores\n- Workflow de cobranza (etapas, promesas de pago, acciones)\n- Gastos extraordinarios\n- Gestión de clientes (crédito, detalle)\n- Reportes financieros (cash flow, DSO, collection efficiency)\n- Incidencias de facturación',
  '2025-12-01T10:00:00Z', '2025-12-01T10:00:00Z'
);

-- v1.6.0 - Customer Success
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '1.6.0', 'Customer Success', '2025-12-20', 'minor', 'released',
  'Suite completa de Customer Success con NPS, CSAT, Voice of Customer, quejas, health scores, CAPA Kanban, touchpoints, playbooks y retención.',
  E'## Customer Success v1.6.0\n\n### Nuevas funcionalidades\n- Dashboard panorámico de salud de clientes\n- Sistema NPS con campañas y encuestas\n- CSAT surveys\n- Voice of Customer (VoC) con análisis IA\n- Quejas (CRUD, detalle, seguimiento)\n- Cartera de clientes con health scores\n- CAPA Kanban (acciones correctivas)\n- Touchpoints tracking\n- Loyalty funnel\n- Playbooks operativos\n- Retención dashboard\n- Staff performance\n- Asignación masiva de CSMs',
  '2025-12-20T10:00:00Z', '2025-12-20T10:00:00Z'
);

-- v1.7.0 - SIERCP & Evaluaciones
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '1.7.0', 'SIERCP & Evaluaciones', '2026-01-10', 'minor', 'released',
  'Sistema de Evaluación de Riesgo Candidato-Puesto (SIERCP) con entrevista estructurada, dashboard de resultados, reportes PDF e integración con IA.',
  E'## SIERCP & Evaluaciones v1.7.0\n\n### Nuevas funcionalidades\n- Entrevista estructurada con formulario guiado\n- Dashboard de resultados con radar, gauge y semáforo\n- Generación de reporte imprimible/PDF\n- Integración con IA para análisis\n- Panel de validación y decisión\n- Persistencia y normalización de datos',
  '2026-01-10T10:00:00Z', '2026-01-10T10:00:00Z'
);

-- v1.8.0 - Recruitment Pipeline
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '1.8.0', 'Recruitment Pipeline', '2026-01-25', 'minor', 'released',
  'Pipeline de reclutamiento expandido con evaluaciones psicométricas, toxicología, referencias con edición/eliminación, contratos, documentos y estudio socioeconómico.',
  E'## Recruitment Pipeline v1.8.0\n\n### Nuevas funcionalidades\n- Evaluaciones psicométricas con panel SIERCP\n- Toxicología (tab completo con formulario y badge)\n- Referencias (formulario, validación, progreso, edición/eliminación)\n- Contratos (generación, firma, preview, upload, progreso)\n- Documentos (upload, preview, progreso)\n- Estudio socioeconómico\n- Entrevistas con análisis IA\n- Análisis de riesgo del candidato',
  '2026-01-25T10:00:00Z', '2026-01-25T10:00:00Z'
);

-- v1.9.0 - Monitoring & Operations
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '1.9.0', 'Monitoring & Operations', '2026-02-10', 'minor', 'released',
  'Monitoreo expandido con Modo TV para sala de operaciones, dashboard de adopción digital, checklists con auditoría e incidentes en tiempo real.',
  E'## Monitoring & Operations v1.9.0\n\n### Nuevas funcionalidades\n- Modo TV para pantallas de sala de monitoreo\n- Dashboard de adopción digital\n- Checklists de monitoreo con auditoría\n- Panel de incidentes en tiempo real\n- Detalle de servicios activos con mapa',
  '2026-02-10T10:00:00Z', '2026-02-10T10:00:00Z'
);

-- v2.0.0 - Platform Maturity
INSERT INTO system_versions (id, version_number, version_name, release_date, version_type, status, description, release_notes, created_at, updated_at)
VALUES (
  gen_random_uuid(), '2.0.0', 'Platform Maturity', '2026-02-27', 'major', 'released',
  'Madurez de plataforma: WMS expandido con GPS, compras, recepciones, desechos, RMA; módulo Legal con templates y compliance; mejoras globales de IA y UX.',
  E'## Platform Maturity v2.0.0\n\n### Nuevas funcionalidades\n- WMS: Catálogo GPS con investigación\n- WMS: Compras y órdenes de compra\n- WMS: Recepciones de mercancía\n- WMS: Desechos (wizard)\n- WMS: Devoluciones a proveedor (wizard)\n- WMS: Stock con edición\n- WMS: RMA (devoluciones/garantías)\n- Legal: Templates de contratos con editor\n- Legal: Historial de versiones de templates\n- Legal: Catálogo de variables\n- Legal: Compliance checklist\n- AI: Prompts personalizados en generación de contenido\n- UX: Mejoras globales de interfaz y navegación',
  '2026-02-27T10:00:00Z', '2026-02-27T10:00:00Z'
);
