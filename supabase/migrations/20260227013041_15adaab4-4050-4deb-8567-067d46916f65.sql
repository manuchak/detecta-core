
-- =============================================
-- CAMBIOS v1.4.0 - LMS Platform (81528c96-b7c0-435b-8a83-56b6c6cbfe75)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Wizard de creación de cursos multi-paso', 'Sistema completo de creación de cursos con pasos: información general, módulos, lecciones, contenido y publicación.', 'high', 'Componentes wizard con estado persistente entre pasos, validación por paso y preview antes de publicar.', ARRAY['CourseWizard', 'CourseModuleEditor', 'CourseLessonEditor']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Generación de contenido con IA', 'Motor de generación automática de flashcards, quizzes y texto enriquecido usando IA con prompts configurables.', 'critical', 'Integración con edge functions de IA, componentes InlineFlashcardEditor, InlineQuizEditor, QuickContentCreator con streaming de respuestas.', ARRAY['InlineFlashcardEditor', 'InlineQuizEditor', 'QuickContentCreator', 'ContentEditor']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Visor de contenido multimedia', 'Visor unificado para video, texto enriquecido, SCORM, embeds e interactivos con tracking de progreso.', 'high', 'Componente ContentViewer con renderizado condicional por tipo, tracking de tiempo y completado automático/manual.', ARRAY['ContentViewer', 'TextoEnriquecidoViewer', 'VideoViewer', 'ScormViewer']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Sistema de quizzes avanzado', 'Quizzes con múltiples tipos de pregunta: opción múltiple, verdadero/falso, respuesta corta, ordenamiento.', 'high', 'Engine de evaluación con scoring configurable, retroalimentación por pregunta y reportes de resultados.', ARRAY['QuizEngine', 'QuestionRenderer', 'QuizResults']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Certificados PDF con verificación pública', 'Generación de certificados en PDF con código QR para verificación pública sin autenticación.', 'high', 'Generación con @react-pdf/renderer, página pública de verificación por token, diseño personalizable.', ARRAY['CertificateGenerator', 'CertificateVerification', 'PublicCertificatePage']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Gamificación con badges y puntos', 'Sistema de badges por logros y puntos acumulables por completar cursos, quizzes y actividades.', 'medium', 'Tablas de badges y puntos con triggers automáticos, UI de perfil con badges obtenidos.', ARRAY['BadgeSystem', 'PointsTracker', 'GamificationProfile']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Reportes de adopción y rendimiento', 'Dashboards con métricas de adopción (usuarios activos, completados), rendimiento (scores, tiempo) y progreso por curso.', 'medium', 'Queries agregados con recharts, filtros por periodo, exportación a Excel.', ARRAY['AdoptionReport', 'PerformanceReport', 'ProgressReport']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Inscripciones masivas', 'Herramienta para inscribir múltiples usuarios a cursos simultáneamente desde CSV o selección manual.', 'medium', 'Procesamiento batch con feedback de progreso, validación de duplicados, notificaciones.', ARRAY['BulkEnrollment', 'EnrollmentManager']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'feature', 'LMS', 'Prompt personalizado para IA (AIPromptPopover)', 'Componente reutilizable que permite al usuario escribir instrucciones personalizadas antes de generar contenido con IA.', 'medium', 'Popover con textarea persistente por sesión, integrado en todos los editores de contenido IA.', ARRAY['AIPromptPopover', 'InlineFlashcardEditor', 'InlineQuizEditor', 'RichTextEditor']),

('81528c96-b7c0-435b-8a83-56b6c6cbfe75', 'bugfix', 'LMS', 'Botón manual de completado en texto enriquecido', 'Reemplazado el auto-completado por temporizador (3s) por un botón manual "He terminado de leer" con feedback visual.', 'medium', 'Eliminado useEffect con setTimeout, agregado botón con estado disabled post-click y icono CheckCircle.', ARRAY['TextoEnriquecidoViewer']);

-- =============================================
-- CAMBIOS v1.5.0 - Facturación Hub (5fa52a84-af35-49c8-96e5-2de3a5a6680c)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Dashboard de facturación con KPIs', 'Dashboard centralizado con indicadores clave: facturación mensual, pendientes, vencidos, collection rate.', 'high', 'Componentes KPI con queries agregados, gráficas de tendencia con recharts, filtros por periodo y cliente.', ARRAY['FacturacionDashboard', 'KPICards', 'TrendCharts']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Consulta y detalle de servicios facturables', 'Vista de servicios con filtros avanzados, detalle expandible y estados de facturación por servicio.', 'high', 'Tabla con @tanstack/react-table, filtros combinados, detalle modal con timeline de facturación.', ARRAY['ServiciosFacturacion', 'ServicioDetalle', 'FacturacionFilters']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Cuentas por cobrar con aging y cobranza', 'Módulo completo de CxC con aging buckets (30/60/90/120+ días), estados de cuenta y workflow de cobranza.', 'critical', 'Aging calculado en tiempo real, estados de cuenta generables en PDF, integración con workflow de cobranza.', ARRAY['CuentasPorCobrar', 'AgingReport', 'EstadoCuenta', 'CobranzaWorkflow']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Cuentas por pagar a proveedores', 'Gestión de CxP con registro de facturas de proveedores, programación de pagos y conciliación.', 'high', 'CRUD de facturas proveedor, calendario de pagos, alertas de vencimiento.', ARRAY['CuentasPorPagar', 'PagoProveedores']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Workflow de cobranza', 'Flujo estructurado de cobranza con etapas (preventiva, administrativa, prejurídica), promesas de pago y acciones.', 'high', 'Pipeline visual con drag-and-drop entre etapas, registro de promesas con seguimiento, acciones automatizadas.', ARRAY['CobranzaPipeline', 'PromesasPago', 'AccionesCobranza']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Gastos extraordinarios', 'Registro y aprobación de gastos no contemplados en la operación regular.', 'medium', 'Formulario con categorías, flujo de aprobación, integración con reportes financieros.', ARRAY['GastosExtraordinarios', 'GastoAprobacion']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Gestión de clientes (crédito y detalle)', 'Ficha de cliente con historial de crédito, límites, condiciones comerciales y detalle de cuenta.', 'medium', 'Perfil de cliente con tabs, historial de transacciones, configuración de crédito.', ARRAY['ClienteDetalle', 'CreditoCliente']),

('5fa52a84-af35-49c8-96e5-2de3a5a6680c', 'feature', 'Facturación', 'Reportes financieros', 'Cash flow, DSO (Days Sales Outstanding), collection efficiency y otros indicadores financieros.', 'high', 'Dashboards con recharts, cálculos en tiempo real, exportación a Excel con xlsx.', ARRAY['CashFlowReport', 'DSOReport', 'CollectionEfficiency']);

-- =============================================
-- CAMBIOS v1.6.0 - Customer Success (efff3d8d-716b-46a9-b5dc-536f09e44f1a)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'Dashboard panorámico de salud de clientes', 'Vista 360° de la salud de todos los clientes con scores agregados, alertas y tendencias.', 'high', 'Dashboard con health score compuesto, semáforos por cliente, tendencias históricas con recharts.', ARRAY['CSHealthDashboard', 'HealthScoreCard', 'ClientHealthTrend']),

('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'Sistema NPS con campañas y encuestas', 'Net Promoter Score completo: creación de campañas, envío de encuestas, recolección y análisis de respuestas.', 'high', 'Campañas programables, encuestas embebidas, cálculo de NPS con detractores/pasivos/promotores.', ARRAY['NPSCampaigns', 'NPSSurvey', 'NPSAnalysis']),

('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'CSAT surveys y Voice of Customer', 'Encuestas de satisfacción post-servicio y módulo VoC con análisis de sentimiento por IA.', 'high', 'Surveys configurables, análisis de texto con IA, dashboard de sentimiento agregado.', ARRAY['CSATSurveys', 'VoiceOfCustomer', 'SentimentAnalysis']),

('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'Quejas y seguimiento', 'CRUD completo de quejas con detalle, asignación, seguimiento de resolución y métricas.', 'medium', 'Formulario de registro, timeline de seguimiento, SLA tracking, reportes de resolución.', ARRAY['QuejasManager', 'QuejaDetalle', 'QuejaSeguimiento']),

('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'CAPA Kanban', 'Tablero Kanban para acciones correctivas y preventivas con flujo visual de estados.', 'medium', 'Kanban con dnd-kit, estados configurables, asignación de responsables, fechas límite.', ARRAY['CAPAKanban', 'CAPACard', 'CAPAForm']),

('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'Touchpoints tracking y Loyalty funnel', 'Registro de interacciones con clientes y funnel de lealtad para tracking de ciclo de vida.', 'medium', 'Timeline de touchpoints, funnel visual con etapas configurables, métricas de conversión.', ARRAY['TouchpointsTimeline', 'LoyaltyFunnel']),

('efff3d8d-716b-46a9-b5dc-536f09e44f1a', 'feature', 'Customer Success', 'Playbooks operativos y retención', 'Guías estructuradas para CSMs y dashboard de retención con churn analysis.', 'medium', 'Templates de playbooks, checklist de ejecución, predicción de churn, alertas tempranas.', ARRAY['Playbooks', 'RetentionDashboard', 'ChurnAnalysis']);

-- =============================================
-- CAMBIOS v1.7.0 - SIERCP (f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'feature', 'SIERCP', 'Entrevista estructurada con formulario guiado', 'Formulario multi-sección para evaluar riesgo candidato-puesto con preguntas categorizadas y scoring automático.', 'critical', 'Formulario con secciones: datos personales, historial laboral, evaluación psicológica, antecedentes. Scoring ponderado por categoría.', ARRAY['SIERCPInterview', 'InterviewForm', 'ScoringEngine']),

('f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'feature', 'SIERCP', 'Dashboard de resultados con radar y gauge', 'Visualización de resultados con gráfica radar por categoría, gauge de riesgo general y semáforo de decisión.', 'high', 'Recharts radar para dimensiones, gauge custom con gradiente, semáforo con lógica de umbrales configurables.', ARRAY['SIERCPDashboard', 'RadarChart', 'RiskGauge', 'TrafficLight']),

('f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'feature', 'SIERCP', 'Generación de reporte PDF imprimible', 'Reporte completo de evaluación exportable a PDF con todos los resultados, gráficas y recomendaciones.', 'high', 'Generación con jsPDF, layout optimizado para impresión, inclusión de gráficas como imágenes.', ARRAY['SIERCPReport', 'PDFGenerator']),

('f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'feature', 'SIERCP', 'Integración con IA para análisis de riesgo', 'Análisis automatizado por IA que genera observaciones y recomendaciones basadas en las respuestas del candidato.', 'high', 'Edge function con prompt especializado, análisis de patrones de respuesta, generación de narrativa.', ARRAY['AIRiskAnalysis', 'SIERCPAIPanel']),

('f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'feature', 'SIERCP', 'Panel de validación y decisión', 'Panel para que el evaluador valide resultados, agregue observaciones y tome decisión final (apto/no apto/condicional).', 'high', 'Flujo de aprobación con firma digital, comentarios por sección, historial de decisiones.', ARRAY['ValidationPanel', 'DecisionForm']),

('f1b24dbe-1a6d-4a1d-bf21-c180769c3b9a', 'enhancement', 'SIERCP', 'Persistencia y normalización de datos', 'Modelo de datos normalizado para almacenar evaluaciones con historial, comparación entre candidatos y auditoría.', 'medium', 'Tablas normalizadas con foreign keys, índices para consultas frecuentes, soft delete para historial.', ARRAY['SIERCPSchema', 'DataNormalization']);

-- =============================================
-- CAMBIOS v1.8.0 - Recruitment Pipeline (f25a964e-6cfc-4cc9-8f16-9536af01da29)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('f25a964e-6cfc-4cc9-8f16-9536af01da29', 'feature', 'Reclutamiento', 'Evaluaciones psicométricas con panel SIERCP', 'Integración de evaluaciones psicométricas dentro del pipeline de reclutamiento con vínculo directo al panel SIERCP.', 'high', 'Tab de psicométricas en candidato, lanzamiento de evaluación SIERCP, resultados inline.', ARRAY['PsychometricTab', 'SIERCPLauncher', 'EvaluationResults']),

('f25a964e-6cfc-4cc9-8f16-9536af01da29', 'feature', 'Reclutamiento', 'Toxicología', 'Tab completo para gestión de pruebas toxicológicas con formulario, resultados y badge de estado.', 'medium', 'Formulario de registro de prueba, estados (pendiente/en proceso/completado), badge visual en candidato.', ARRAY['ToxicologyTab', 'ToxicologyForm', 'ToxicologyBadge']),

('f25a964e-6cfc-4cc9-8f16-9536af01da29', 'feature', 'Reclutamiento', 'Referencias con edición y eliminación', 'Sistema de referencias laborales con formulario, validación, progreso y capacidad de editar/eliminar referencias existentes.', 'medium', 'Hook useUpdateReferencia, modo edición en ReferenceForm, AlertDialog de confirmación para eliminar.', ARRAY['ReferencesTab', 'ReferenceForm', 'ReferenceCard', 'useReferencias']),

('f25a964e-6cfc-4cc9-8f16-9536af01da29', 'feature', 'Reclutamiento', 'Contratos: generación, firma y upload', 'Pipeline completo de contratos desde generación desde template, preview, firma digital y upload de documento firmado.', 'high', 'Integración con módulo Legal para templates, preview PDF, upload con storage, tracking de progreso.', ARRAY['ContractTab', 'ContractGenerator', 'ContractSigner', 'ContractUpload']),

('f25a964e-6cfc-4cc9-8f16-9536af01da29', 'feature', 'Reclutamiento', 'Documentos con upload y preview', 'Gestión de documentos del candidato con upload múltiple, preview inline y barra de progreso de completitud.', 'medium', 'Storage de Supabase, preview por tipo (imagen/PDF), checklist de documentos requeridos.', ARRAY['DocumentsTab', 'DocumentUploader', 'DocumentPreview']),

('f25a964e-6cfc-4cc9-8f16-9536af01da29', 'feature', 'Reclutamiento', 'Entrevistas con análisis IA', 'Registro de entrevistas con transcripción, análisis de IA y scoring automatizado.', 'high', 'Formulario de entrevista, integración IA para análisis de respuestas, recomendaciones automáticas.', ARRAY['InterviewTab', 'InterviewForm', 'AIInterviewAnalysis']);

-- =============================================
-- CAMBIOS v1.9.0 - Monitoring & Operations (386f7fae-6388-48bf-a74b-ca1633231e85)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('386f7fae-6388-48bf-a74b-ca1633231e85', 'feature', 'Monitoreo', 'Modo TV para sala de monitoreo', 'Interfaz full-screen optimizada para pantallas grandes en sala de operaciones con rotación automática de vistas.', 'high', 'Layout full-screen sin sidebar, rotación configurable entre dashboards, tipografía grande para lectura a distancia.', ARRAY['TVMode', 'TVDashboard', 'TVRotation']),

('386f7fae-6388-48bf-a74b-ca1633231e85', 'feature', 'Monitoreo', 'Dashboard de adopción digital', 'Métricas de adopción del sistema de monitoreo: dispositivos integrados, cobertura GPS, uso por operador.', 'medium', 'KPIs de integración, gráficas de tendencia, comparativo por zona/cliente.', ARRAY['AdoptionDashboard', 'IntegrationMetrics']),

('386f7fae-6388-48bf-a74b-ca1633231e85', 'feature', 'Monitoreo', 'Checklists de monitoreo con auditoría', 'Listas de verificación para operadores con registro de cumplimiento y auditoría posterior.', 'medium', 'Templates de checklist, completado con timestamp, reportes de cumplimiento, auditoría por supervisor.', ARRAY['MonitoringChecklist', 'ChecklistAudit']),

('386f7fae-6388-48bf-a74b-ca1633231e85', 'feature', 'Monitoreo', 'Panel de incidentes en tiempo real', 'Vista en tiempo real de incidentes activos con priorización, asignación y timeline de resolución.', 'high', 'Realtime subscriptions de Supabase, priorización automática, notificaciones push.', ARRAY['IncidentPanel', 'IncidentTimeline', 'IncidentPrioritization']),

('386f7fae-6388-48bf-a74b-ca1633231e85', 'enhancement', 'Monitoreo', 'Detalle de servicios activos con mapa', 'Vista de detalle de servicios con ubicación en mapa Mapbox, estado del GPS y timeline de eventos.', 'medium', 'Integración Mapbox GL, markers dinámicos, popups con estado del servicio.', ARRAY['ServiceDetailMap', 'MapboxIntegration', 'ServiceTimeline']);

-- =============================================
-- CAMBIOS v2.0.0 - Platform Maturity (0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55)
-- =============================================

INSERT INTO system_changes (version_id, change_type, module, title, description, impact_level, technical_details, affected_components) VALUES
('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'WMS', 'Catálogo GPS con investigación', 'Gestión de dispositivos GPS con fichas técnicas, investigación de mercado y comparativas.', 'high', 'CRUD de dispositivos, comparador de specs, integración con proveedores.', ARRAY['GPSCatalog', 'GPSResearch', 'GPSComparator']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'WMS', 'Compras y órdenes de compra', 'Módulo de compras con requisiciones, órdenes de compra, aprobaciones y seguimiento.', 'high', 'Flujo requisición → aprobación → OC → recepción, integración con inventario.', ARRAY['PurchaseOrders', 'Requisitions', 'PurchaseApproval']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'WMS', 'Recepciones de mercancía', 'Registro de recepciones con verificación contra OC, control de calidad y actualización automática de stock.', 'high', 'Wizard de recepción, validación vs OC, fotos de evidencia, ajuste automático de inventario.', ARRAY['ReceptionWizard', 'QualityCheck', 'StockUpdate']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'WMS', 'Desechos y devoluciones a proveedor', 'Wizards para registro de desechos (baja de inventario) y devoluciones a proveedor con documentación.', 'medium', 'Wizards multi-paso, motivos categorizados, generación de documentos, ajuste de inventario.', ARRAY['DisposalWizard', 'ReturnToSupplierWizard']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'WMS', 'RMA (devoluciones y garantías)', 'Gestión de Return Merchandise Authorization con seguimiento de garantías y resolución.', 'medium', 'Flujo RMA con estados, tracking de envío, resolución (reemplazo/reparación/crédito).', ARRAY['RMAManager', 'RMAForm', 'RMATracking']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'WMS', 'Stock con edición y audit log', 'Vista de inventario con edición inline de cantidades, ajustes con justificación y log de auditoría completo.', 'high', 'Edición inline con validación, registro de ajustes con motivo, audit trail inmutable.', ARRAY['StockManager', 'StockEditor', 'AuditLog']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'Legal', 'Templates de contratos con editor', 'Editor de templates de contratos con variables dinámicas, versionamiento y preview en tiempo real.', 'high', 'Editor TipTap para templates, sistema de variables con autocompletado, preview con datos de prueba.', ARRAY['ContractTemplateEditor', 'VariableSystem', 'TemplatePreview']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'Legal', 'Historial de versiones y catálogo de variables', 'Versionamiento de templates con diff visual y catálogo centralizado de variables disponibles.', 'medium', 'Historial con diff, rollback a versiones anteriores, catálogo con categorías y validación.', ARRAY['TemplateVersionHistory', 'VariableCatalog']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'feature', 'Legal', 'Compliance checklist', 'Listas de verificación de cumplimiento legal por tipo de contrato con tracking de completitud.', 'medium', 'Templates de checklist por tipo, asignación de responsables, alertas de vencimiento.', ARRAY['ComplianceChecklist', 'ComplianceTracker']),

('0b5b3a59-22a0-4a8f-be50-7e91cfb5bd55', 'enhancement', 'Plataforma', 'Mejoras globales de IA y UX', 'Prompt personalizado en generación de contenido, mejoras de navegación, responsive design y performance.', 'medium', 'AIPromptPopover reutilizable, lazy loading de rutas, optimización de queries, mejoras de accesibilidad.', ARRAY['AIPromptPopover', 'LazyRoutes', 'QueryOptimization']);
