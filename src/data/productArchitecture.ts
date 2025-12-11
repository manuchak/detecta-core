// Centralized Product Architecture Data
// Update this file to keep documentation in sync with development

export type ProcessStatus = 'complete' | 'in-progress' | 'pending' | 'feature-flag';
export type DomainType = 'config' | 'operation' | 'control' | 'integration';
export type RACIType = 'R' | 'A' | 'C' | 'I';

export interface SubProcess {
  id: string;
  name: string;
  description: string;
  status: ProcessStatus;
  featureFlag?: string;
}

export interface RACIEntry {
  role: string;
  type: RACIType;
  notes?: string;
}

export interface ProcessPhase {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  status: ProcessStatus;
  sla?: string;
  slaMinutes?: number;
  responsible: string[];
  featureFlag?: string;
  subprocesses?: SubProcess[];
  outputs?: string[];
  gates?: string[];
  documents?: string[];
  domain?: DomainType;
  raci?: RACIEntry[];
}

export interface ModuleConnection {
  targetModule: string;
  type: 'sync' | 'trigger' | 'query' | 'event';
  description: string;
  dataFlow: string;
}

export interface Module {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  description: string;
  domain: 'supply' | 'operations' | 'monitoring' | 'admin' | 'analytics' | 'integrations';
  phases: ProcessPhase[];
  connections: ModuleConnection[];
  edgeFunctions?: string[];
  tables?: string[];
  externalServices?: string[];
  lastUpdated: string;
}

export interface GlobalConnection {
  from: string;
  to: string;
  label: string;
  type: 'data' | 'event' | 'trigger';
  description: string;
}

// Swimlane data structures
export interface SwimlaneLane {
  id: string;
  name: string;
  actor: string;
  color: string;
}

export interface SwimlaneNode {
  id: string;
  phaseId: string;
  phaseName: string;
  lane: string;
  position: number;
  nextNodes: string[];
  sla?: string;
  status: ProcessStatus;
}

// SLA Metrics
export interface SLAMetric {
  phaseId: string;
  phaseName: string;
  module: string;
  targetSLA: string;
  targetMinutes: number;
  avgActual: number;
  complianceRate: number;
  trend: 'up' | 'down' | 'stable';
  sampleSize: number;
}

export interface ProductArchitecture {
  version: string;
  lastUpdated: string;
  modules: Record<string, Module>;
  globalConnections: GlobalConnection[];
  swimlanes: SwimlaneLane[];
  swimlaneFlow: SwimlaneNode[];
  slaMetrics: SLAMetric[];
  roles: string[];
}

export const productArchitecture: ProductArchitecture = {
  version: '1.0.0',
  lastUpdated: '2025-12-11',
  modules: {
    supply: {
      id: 'supply',
      name: 'Supply - Reclutamiento de Custodios',
      shortName: 'Supply',
      icon: 'UserCheck',
      color: '#10B981',
      description: 'Gestión completa del proceso de reclutamiento, evaluación y liberación de custodios operativos.',
      domain: 'supply',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'supply_phase_1',
          phaseNumber: 1,
          name: 'Generación de Lead',
          description: 'Captura inicial de candidatos a través de múltiples canales de reclutamiento.',
          status: 'complete',
          sla: '15 minutos',
          slaMinutes: 15,
          responsible: ['Supply Lead', 'Supply Admin'],
          domain: 'config',
          raci: [
            { role: 'Supply Lead', type: 'R' },
            { role: 'Supply Admin', type: 'A' },
            { role: 'BI Director', type: 'I' }
          ],
          outputs: ['lead_record'],
          gates: ['Datos de contacto válidos', 'Zona de operación definida'],
          documents: ['Solicitud inicial']
        },
        {
          id: 'supply_phase_2',
          phaseNumber: 2,
          name: 'Contacto Inicial / Sesión Informativa',
          description: 'Primer contacto con el candidato para explicar el proceso y requisitos.',
          status: 'complete',
          sla: '24 horas',
          slaMinutes: 1440,
          responsible: ['Supply Lead'],
          domain: 'config',
          raci: [
            { role: 'Supply Lead', type: 'R' },
            { role: 'Coordinación Operativa', type: 'I' }
          ],
          outputs: ['session_scheduled', 'initial_interest'],
          gates: ['Candidato interesado', 'Disponibilidad confirmada']
        },
        {
          id: 'supply_phase_2b',
          phaseNumber: 2.5,
          name: 'Entrevista AI por Voz (VAPI)',
          description: 'Entrevista automatizada mediante inteligencia artificial por voz.',
          status: 'complete',
          sla: '15 minutos',
          slaMinutes: 15,
          responsible: ['Supply Lead', 'Tech'],
          domain: 'operation',
          raci: [
            { role: 'Supply Lead', type: 'A' },
            { role: 'Tech', type: 'R' },
            { role: 'Coordinación Operativa', type: 'I' }
          ],
          subprocesses: [
            { id: 'vapi_call', name: 'Llamada VAPI', description: 'Iniciación de llamada automatizada al candidato', status: 'complete' },
            { id: 'vapi_webhook', name: 'Webhook Receiver', description: 'Recepción de resultados end-of-call-report', status: 'complete' },
            { id: 'structured_data', name: 'Datos Estructurados', description: 'Extracción de respuestas con schema JSON', status: 'complete' },
            { id: 'auto_decision', name: 'Auto-Decisión', description: 'Aprobar/Segunda entrevista/Rechazar basado en score', status: 'complete' },
            { id: 'red_flags', name: 'Detección Red Flags', description: 'Identificación automática de banderas rojas', status: 'complete' }
          ],
          gates: ['Score ≥8.5 auto-aprueba', 'Red flags críticos → rechaza', 'Resto → segunda entrevista humana'],
          outputs: ['vapi_call_log', 'auto_decision', 'analysis_score']
        },
        {
          id: 'supply_phase_3',
          phaseNumber: 3,
          name: 'Entrevista Estructurada',
          description: 'Evaluación formal con ratings 1-5 en 6 dimensiones + checklist de riesgo.',
          status: 'complete',
          sla: '3 días',
          slaMinutes: 4320,
          responsible: ['Supply Lead', 'Coordinación Operativa'],
          domain: 'operation',
          featureFlag: 'REQUIRE_STRUCTURED_INTERVIEW',
          raci: [
            { role: 'Supply Lead', type: 'R' },
            { role: 'Coordinación Operativa', type: 'A' },
            { role: 'BI Director', type: 'C' }
          ],
          subprocesses: [
            { id: 'interview_ratings', name: 'Ratings 1-5', description: 'Comunicación, actitud, experiencia, disponibilidad, motivación, profesionalismo', status: 'complete' },
            { id: 'risk_checklist', name: 'Checklist de Riesgo', description: '9 factores de riesgo con score automático', status: 'complete' }
          ],
          gates: ['Rating promedio ≥3.5/5', 'Risk score <50 (bajo/medio)'],
          outputs: ['entrevista_record', 'risk_assessment']
        },
        {
          id: 'supply_phase_4',
          phaseNumber: 4,
          name: 'Evaluación Psicométrica',
          description: 'Pruebas MIDOT + Psicotest con sistema de semáforo Verde/Ámbar/Rojo.',
          status: 'complete',
          sla: '3 días',
          responsible: ['Supply Lead'],
          featureFlag: 'REQUIRE_PSYCHOMETRIC_EVALUATION',
          subprocesses: [
            { id: 'midot_test', name: 'MIDOT', description: 'Evaluación de integridad y confiabilidad', status: 'complete' },
            { id: 'psicotest', name: 'Psicotest', description: 'Evaluación de perfil psicológico', status: 'complete' },
            { id: 'siercp_assistant', name: 'SIERCP AI Assistant', description: 'Análisis con OpenAI GPT-4.1 para evaluación psico-criminológica', status: 'complete' },
            { id: 'semaphore_calc', name: 'Cálculo Semáforo', description: 'Verde ≥70% auto-aprueba, Ámbar 50-69% requiere aval, Rojo <50% rechaza', status: 'complete' }
          ],
          gates: ['Verde: Auto-aprobación', 'Ámbar: Aval Coordinación', 'Rojo: Rechazo automático'],
          outputs: ['psychometric_score', 'semaphore_result', 'ai_insights']
        },
        {
          id: 'supply_phase_4b',
          phaseNumber: 4.5,
          name: 'Análisis AI de Reclutamiento',
          description: 'Insights estratégicos generados por GPT-4.1 sobre métricas de reclutamiento.',
          status: 'complete',
          responsible: ['BI Director', 'Supply Lead'],
          subprocesses: [
            { id: 'recruitment_analysis', name: 'Análisis Estratégico', description: 'Patrones ocultos, ROI por canal, predicciones de conversión', status: 'complete' },
            { id: 'interview_analysis', name: 'Análisis de Entrevistas', description: 'Scoring forense con clasificación y recomendaciones', status: 'complete' },
            { id: 'risk_analysis', name: 'Análisis de Riesgo', description: 'Evaluación psicológica y criminológica automatizada', status: 'complete' }
          ],
          outputs: ['ai_insights', 'risk_classification', 'recommendations']
        },
        {
          id: 'supply_phase_5',
          phaseNumber: 5,
          name: 'Prueba Toxicológica',
          description: 'Evaluación de sustancias controladas con resultado binario.',
          status: 'complete',
          sla: '5 días',
          responsible: ['Supply Lead'],
          featureFlag: 'REQUIRE_TOXICOLOGY_NEGATIVE',
          gates: ['Resultado NEGATIVO requerido'],
          outputs: ['toxicology_result']
        },
        {
          id: 'supply_phase_6',
          phaseNumber: 6,
          name: 'Validación de Referencias',
          description: 'Verificación de 2 referencias laborales + 2 personales.',
          status: 'complete',
          sla: '5 días',
          responsible: ['Supply Lead'],
          featureFlag: 'REQUIRE_REFERENCES_VALIDATION',
          subprocesses: [
            { id: 'labor_refs', name: 'Referencias Laborales', description: 'Mínimo 2 positivas requeridas', status: 'complete' },
            { id: 'personal_refs', name: 'Referencias Personales', description: 'Mínimo 2 positivas requeridas', status: 'complete' }
          ],
          gates: ['4 referencias positivas mínimo (2 laborales + 2 personales)'],
          outputs: ['references_validated']
        },
        {
          id: 'supply_phase_7',
          phaseNumber: 7,
          name: 'Validación de Documentos',
          description: 'Carga y validación OCR de documentos oficiales mexicanos.',
          status: 'complete',
          sla: '3 días',
          responsible: ['Supply Lead'],
          featureFlag: 'REQUIRE_DOCUMENTS_VALIDATED',
          subprocesses: [
            { id: 'doc_upload', name: 'Carga de Documentos', description: 'Portal de candidato para subir archivos', status: 'complete' },
            { id: 'ocr_extraction', name: 'Extracción OCR', description: 'Lovable AI Vision + Gemini 2.5 Flash', status: 'complete' },
            { id: 'data_validation', name: 'Validación de Datos', description: 'Verificación de campos extraídos', status: 'complete' }
          ],
          documents: ['INE', 'Licencia de conducir', 'CURP', 'Comprobante de domicilio', 'Antecedentes no penales', 'RFC'],
          gates: ['6 documentos validados'],
          outputs: ['documents_validated', 'ocr_data']
        },
        {
          id: 'supply_phase_8',
          phaseNumber: 8,
          name: 'Firma de Contrato',
          description: 'Generación y firma electrónica del contrato de custodia.',
          status: 'complete',
          sla: '2 días',
          responsible: ['Supply Lead', 'Admin'],
          featureFlag: 'REQUIRE_CONTRACTS_SIGNED',
          subprocesses: [
            { id: 'contract_gen', name: 'Generación de Contrato', description: 'Interpolación de plantilla con datos del candidato', status: 'complete' },
            { id: 'e_signature', name: 'Firma Electrónica', description: 'Canvas signature + SHA-256 hash + timestamp', status: 'complete' },
            { id: 'pdf_gen', name: 'Generación PDF', description: 'Edge function para crear PDF firmado', status: 'complete' }
          ],
          gates: ['Contrato firmado electrónicamente'],
          outputs: ['signed_contract_pdf']
        },
        {
          id: 'supply_phase_9',
          phaseNumber: 9,
          name: 'Capacitación Administrativa',
          description: 'Módulos de capacitación con quiz de comprensión (80% mínimo).',
          status: 'complete',
          sla: '7 días',
          responsible: ['Supply Lead', 'Capacitación'],
          featureFlag: 'REQUIRE_TRAINING_COMPLETED',
          subprocesses: [
            { id: 'training_modules', name: 'Módulos de Capacitación', description: 'Contenido formativo por temas', status: 'complete' },
            { id: 'quiz', name: 'Quiz de Comprensión', description: 'Evaluación con 80% mínimo para aprobar', status: 'complete' }
          ],
          gates: ['Quiz aprobado ≥80%'],
          outputs: ['training_completed']
        },
        {
          id: 'supply_phase_10',
          phaseNumber: 10,
          name: 'Instalación Técnica',
          description: 'Programación e instalación de GPS y equipo en vehículo del custodio.',
          status: 'complete',
          sla: '5 días',
          responsible: ['Coordinación Técnica', 'Instaladores'],
          featureFlag: 'REQUIRE_INSTALLATION_VALIDATED',
          subprocesses: [
            { id: 'schedule_install', name: 'Programación', description: 'Asignación de instalador y fecha', status: 'complete' },
            { id: 'kit_assignment', name: 'Asignación de Kit', description: 'Integración con WMS para kits GPS', status: 'complete' },
            { id: 'installation', name: 'Instalación Física', description: 'Ejecución por técnico certificado', status: 'complete' },
            { id: 'verification', name: 'Verificación', description: 'Pruebas de funcionamiento GPS', status: 'complete' }
          ],
          gates: ['GPS instalado y verificado', 'Evidencias fotográficas'],
          outputs: ['installation_complete', 'gps_active']
        },
        {
          id: 'supply_phase_11',
          phaseNumber: 11,
          name: 'Liberación Final',
          description: 'Gate final que valida todos los requisitos y libera al custodio a Planeación.',
          status: 'complete',
          sla: '1 día',
          responsible: ['Supply Lead', 'Coordinación Operativa'],
          subprocesses: [
            { id: 'checklist_validation', name: 'Validación Checklist', description: 'Verificación de todos los requisitos completados', status: 'complete' },
            { id: 'liberation', name: 'Liberación', description: 'Creación de registro en pc_custodios y custodios_operativos', status: 'complete' },
            { id: 'planning_sync', name: 'Sincronización a Planeación', description: 'Custodio disponible para asignación de servicios', status: 'complete' }
          ],
          gates: ['Todos los feature flags cumplidos o forzar liberación'],
          outputs: ['custodio_liberado', 'pc_custodio_record']
        }
      ],
      connections: [
        { targetModule: 'planeacion', type: 'sync', description: 'Liberación de custodios', dataFlow: 'custodio_liberado → pc_custodios + custodios_operativos' },
        { targetModule: 'instaladores', type: 'trigger', description: 'Programación de instalación GPS', dataFlow: 'candidato_id → programacion_instalaciones' },
        { targetModule: 'wms', type: 'query', description: 'Asignación de kits GPS', dataFlow: 'kit_assignment → productos_inventario' },
        { targetModule: 'integraciones', type: 'trigger', description: 'Entrevistas AI por voz', dataFlow: 'candidato → vapi_call' }
      ],
      edgeFunctions: [
        'ocr-documento', 'generar-contrato-pdf',
        'vapi-call', 'vapi-call-test', 'vapi-webhook-receiver',
        'analyze-interview', 'ai-recruitment-analysis', 'siercp-ai-assistant',
        'dialfire-webhook'
      ],
      externalServices: ['VAPI', 'OpenAI GPT-4.1', 'Lovable AI (Gemini)', 'Dialfire'],
      tables: ['candidatos_custodios', 'leads', 'entrevistas_estructuradas', 'candidato_risk_checklist', 'evaluaciones_psicometricas', 'evaluaciones_toxicologicas', 'referencias_candidato', 'documentos_candidato', 'contratos_candidato', 'progreso_capacitacion', 'custodio_liberacion', 'vapi_call_logs']
    },
    planeacion: {
      id: 'planeacion',
      name: 'Planeación - Gestión de Servicios',
      shortName: 'Planeación',
      icon: 'Calendar',
      color: '#8B5CF6',
      description: 'Programación y asignación de servicios de custodia. Incluye configuración de maestros, operación diaria, gestión de proveedores externos y control de excepciones.',
      domain: 'operations',
      lastUpdated: '2025-12-11',
      phases: [
        // DOMINIO 1: CONFIGURACIÓN
        {
          id: 'planning_config',
          phaseNumber: 1,
          name: 'Configuración de Maestros',
          description: 'Gestión de datos maestros necesarios para la operación del sistema.',
          status: 'complete',
          responsible: ['Planeación', 'Admin'],
          domain: 'config',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'Admin', type: 'A' },
            { role: 'Tech', type: 'C' }
          ],
          subprocesses: [
            { id: 'clientes', name: 'Gestión de Clientes', description: 'CRUD de clientes con SLAs personalizados', status: 'complete' },
            { id: 'custodios', name: 'Custodios Operativos', description: 'Visualización y gestión de custodios liberados', status: 'complete' },
            { id: 'ubicaciones', name: 'Ubicaciones Favoritas', description: 'Puntos de encuentro contextuales por cliente/ruta', status: 'complete' },
            { id: 'precios', name: 'Matriz de Precios', description: 'Tarifas por cliente, tipo de servicio y zona', status: 'complete' }
          ],
          outputs: ['clientes_configurados', 'custodios_disponibles', 'matriz_precios']
        },
        {
          id: 'planning_providers',
          phaseNumber: 2,
          name: 'Gestión de Proveedores Armados',
          description: 'Administración completa de proveedores externos de seguridad armada.',
          status: 'complete',
          responsible: ['Planeación', 'Finanzas'],
          domain: 'config',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'Coordinación Operativa', type: 'A' },
            { role: 'BI Director', type: 'I' }
          ],
          subprocesses: [
            { id: 'proveedores_crud', name: 'Registro de Proveedores', description: 'CRUD con zonas de cobertura, capacidad y documentación', status: 'complete' },
            { id: 'personal_proveedor', name: 'Personal por Proveedor', description: 'Registro de elementos armados por empresa', status: 'complete' },
            { id: 'verificacion_personal', name: 'Verificación On-the-fly', description: 'Modal para asignar/crear personal durante servicio', status: 'complete' },
            { id: 'pagos_proveedores', name: 'Pagos y Auditoría', description: 'Registro de pagos individuales y masivos, resumen financiero', status: 'complete' },
            { id: 'validacion_docs', name: 'Validación de Documentación', description: 'Control de licencias vigentes y documentos completos', status: 'complete' }
          ],
          outputs: ['proveedores_configurados', 'personal_registrado']
        },
        // DOMINIO 2: OPERACIÓN DIARIA
        {
          id: 'planning_reception',
          phaseNumber: 3,
          name: 'Recepción de Solicitud',
          description: 'Ingreso de solicitud de servicio por cliente o sistema.',
          status: 'complete',
          sla: '1 hora',
          slaMinutes: 60,
          responsible: ['Planeación'],
          domain: 'operation',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'Coordinación Operativa', type: 'I' }
          ],
          subprocesses: [
            { id: 'captura_manual', name: 'Captura Manual', description: 'Formulario de alta de servicio con validaciones', status: 'complete' },
            { id: 'importacion', name: 'Importación Masiva', description: 'Carga de servicios desde Excel', status: 'complete' },
            { id: 'validacion_cliente', name: 'Validación de Cliente', description: 'Verificar que cliente existe y está activo', status: 'complete' }
          ],
          outputs: ['servicio_planificado']
        },
        {
          id: 'planning_custodio',
          phaseNumber: 4,
          name: 'Asignación de Custodio',
          description: 'Selección y asignación basada en proximidad, disponibilidad y score.',
          status: 'complete',
          sla: '15 minutos',
          slaMinutes: 15,
          responsible: ['Planeación'],
          domain: 'operation',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'C4/Monitoreo', type: 'I' }
          ],
          subprocesses: [
            { id: 'busqueda_proximidad', name: 'Búsqueda por Proximidad', description: 'Query geoespacial de custodios cercanos al origen', status: 'complete' },
            { id: 'verificacion_disponibilidad', name: 'Verificación de Disponibilidad', description: 'Check de indisponibilidades y servicios asignados', status: 'complete' },
            { id: 'scoring', name: 'Scoring de Custodio', description: 'Ranking por historial, rating y proximidad', status: 'complete' },
            { id: 'oferta_servicio', name: 'Oferta de Servicio', description: 'Envío de propuesta al custodio', status: 'complete' }
          ],
          gates: ['Custodio acepta servicio'],
          outputs: ['custodio_asignado']
        },
        {
          id: 'planning_armado',
          phaseNumber: 5,
          name: 'Asignación de Armado',
          description: 'Asignación de personal armado si el servicio lo requiere.',
          status: 'complete',
          responsible: ['Planeación'],
          domain: 'operation',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'Coordinación Operativa', type: 'A' }
          ],
          subprocesses: [
            { id: 'armado_interno', name: 'Armado Interno', description: 'Asignación de armado operativo con modelo km-escalonado', status: 'complete' },
            { id: 'proveedor_externo', name: 'Proveedor Externo', description: 'Selección de proveedor con modelo 12h contratado', status: 'complete' },
            { id: 'verificacion_personal', name: 'Verificación de Personal', description: 'Asignación y registro de elemento específico', status: 'complete' },
            { id: 'compliance_check', name: 'Verificación de Cumplimiento', description: 'Dashboard de armados sin personal verificado', status: 'complete' }
          ],
          outputs: ['armado_asignado', 'personal_verificado']
        },
        {
          id: 'planning_exceptions',
          phaseNumber: 6,
          name: 'Gestión de Excepciones',
          description: 'Manejo de cambios, rechazos y situaciones especiales durante la operación.',
          status: 'complete',
          responsible: ['Planeación'],
          domain: 'operation',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'Coordinación Operativa', type: 'C' }
          ],
          subprocesses: [
            { id: 'reasignacion', name: 'Reasignación de Custodio', description: 'Cambio de custodio con motivo documentado', status: 'complete' },
            { id: 'tipificacion_rechazo', name: 'Tipificación de Rechazo', description: 'Clasificación de motivos de rechazo para análisis', status: 'complete' },
            { id: 'indisponibilidades', name: 'Gestión de Indisponibilidades', description: 'Registro de ausencias, vacaciones, incapacidades', status: 'complete' },
            { id: 'edicion_inteligente', name: 'Edición Inteligente', description: 'Modificación de servicios con sugerencias contextuales', status: 'complete' },
            { id: 'cancelacion', name: 'Cancelación de Servicio', description: 'Proceso de cancelación con motivo y liberación de recursos', status: 'complete' }
          ],
          outputs: ['servicio_modificado', 'indisponibilidad_registrada']
        },
        // DOMINIO 3: CONTROL Y MONITOREO
        {
          id: 'planning_execution',
          phaseNumber: 7,
          name: 'Ejecución y Tracking',
          description: 'Seguimiento en tiempo real del servicio en curso.',
          status: 'complete',
          responsible: ['Planeación', 'Monitoreo'],
          domain: 'control',
          raci: [
            { role: 'C4/Monitoreo', type: 'R' },
            { role: 'Planeación', type: 'C' },
            { role: 'Coordinación Operativa', type: 'I' }
          ],
          subprocesses: [
            { id: 'tracking_realtime', name: 'Tracking en Tiempo Real', description: 'Dashboard de servicios activos con posición GPS', status: 'complete' },
            { id: 'alertas', name: 'Alertas de Desviación', description: 'Notificaciones automáticas por retrasos o incidentes', status: 'complete' },
            { id: 'compliance_armados', name: 'Dashboard Compliance Armados', description: 'Servicios con armado sin personal verificado', status: 'complete' }
          ],
          outputs: ['tracking_activo', 'alertas_generadas']
        },
        {
          id: 'planning_closure',
          phaseNumber: 8,
          name: 'Cierre del Servicio',
          description: 'Registro de hora fin, incidencias y captura de duración real.',
          status: 'complete',
          responsible: ['Planeación', 'Operaciones'],
          domain: 'control',
          raci: [
            { role: 'Planeación', type: 'R' },
            { role: 'BI Director', type: 'I' }
          ],
          subprocesses: [
            { id: 'captura_fin', name: 'Captura de Hora Fin', description: 'Registro de finalización con evidencias', status: 'complete' },
            { id: 'incidencias', name: 'Registro de Incidencias', description: 'Documentación de eventos durante el servicio', status: 'complete' },
            { id: 'duracion_real', name: 'Cálculo de Duración Real', description: 'Para métricas de utilización de proveedores', status: 'complete' },
            { id: 'estimacion_duracion', name: 'Estimación de Duración', description: 'Híbrida: km_teorico + Mapbox API para servicios sin registro', status: 'complete' }
          ],
          outputs: ['servicio_cerrado', 'duracion_real']
        }
      ],
      connections: [
        { targetModule: 'supply', type: 'sync', description: 'Recibe custodios liberados', dataFlow: 'pc_custodios ← liberar_custodio_a_planeacion' },
        { targetModule: 'monitoring', type: 'event', description: 'Servicios activos para monitoreo', dataFlow: 'servicios_custodia → tracking_dashboard' },
        { targetModule: 'reportes', type: 'query', description: 'Datos para dashboards de utilización', dataFlow: 'servicios_custodia → bi_dashboards' },
        { targetModule: 'integraciones', type: 'query', description: 'Mapbox para geocoding y rutas', dataFlow: 'direcciones → mapbox_api' }
      ],
      edgeFunctions: ['estimar-duracion-servicio', 'mapbox-token'],
      externalServices: ['Mapbox'],
      tables: ['servicios_custodia', 'servicios_planificados', 'pc_custodios', 'custodios_operativos', 'pc_clientes', 'proveedores_armados', 'personal_proveedor_armados', 'asignacion_armados', 'indisponibilidades_custodio', 'matriz_precios_rutas']
    },
    instaladores: {
      id: 'instaladores',
      name: 'Instaladores - Gestión Técnica',
      shortName: 'Instaladores',
      icon: 'Wrench',
      color: '#F59E0B',
      description: 'Gestión de técnicos instaladores, programación de instalaciones y seguimiento.',
      domain: 'operations',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'install_phase_1',
          phaseNumber: 1,
          name: 'Gestión de Instaladores',
          description: 'Alta, baja y actualización de técnicos instaladores.',
          status: 'complete',
          responsible: ['Coordinación Técnica'],
          outputs: ['instalador_activo']
        },
        {
          id: 'install_phase_2',
          phaseNumber: 2,
          name: 'Programación de Instalación',
          description: 'Asignación de fecha, hora, instalador y kit para cada instalación.',
          status: 'complete',
          sla: '24 horas',
          responsible: ['Coordinación Técnica'],
          subprocesses: [
            { id: 'schedule', name: 'Programación', description: 'Fecha y hora acordada', status: 'complete' },
            { id: 'installer_assign', name: 'Asignación Instalador', description: 'Técnico disponible en zona', status: 'complete' },
            { id: 'kit_reserve', name: 'Reserva de Kit', description: 'Integración WMS para kit GPS', status: 'complete' }
          ],
          outputs: ['instalacion_programada']
        },
        {
          id: 'install_phase_3',
          phaseNumber: 3,
          name: 'Ejecución de Instalación',
          description: 'Instalación física del equipo GPS en el vehículo.',
          status: 'complete',
          responsible: ['Instalador'],
          subprocesses: [
            { id: 'arrival', name: 'Llegada a Punto', description: 'Check-in del instalador', status: 'complete' },
            { id: 'installation', name: 'Instalación Física', description: 'Montaje del equipo', status: 'complete' },
            { id: 'testing', name: 'Pruebas', description: 'Verificación de funcionamiento', status: 'complete' },
            { id: 'evidence', name: 'Evidencias', description: 'Fotos antes/después', status: 'complete' }
          ],
          outputs: ['instalacion_completada']
        },
        {
          id: 'install_phase_4',
          phaseNumber: 4,
          name: 'Auditoría de Calidad',
          description: 'Revisión de calidad de instalaciones realizadas.',
          status: 'complete',
          responsible: ['Coordinación Técnica', 'QA'],
          outputs: ['auditoria_aprobada']
        }
      ],
      connections: [
        { targetModule: 'wms', type: 'sync', description: 'Consumo de kits de inventario', dataFlow: 'kit_used → productos_inventario' },
        { targetModule: 'supply', type: 'trigger', description: 'Actualiza estado de candidato', dataFlow: 'instalacion_completada → custodio_liberacion' }
      ],
      tables: ['instaladores', 'programacion_instalaciones', 'auditoria_instalaciones']
    },
    wms: {
      id: 'wms',
      name: 'WMS - Gestión de Inventario',
      shortName: 'WMS',
      icon: 'Package',
      color: '#6366F1',
      description: 'Warehouse Management System para control de inventario de equipos GPS y accesorios.',
      domain: 'operations',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'wms_phase_1',
          phaseNumber: 1,
          name: 'Gestión de Productos',
          description: 'Alta y mantenimiento de catálogo de productos.',
          status: 'complete',
          responsible: ['WMS Admin'],
          outputs: ['producto_activo']
        },
        {
          id: 'wms_phase_2',
          phaseNumber: 2,
          name: 'Control de Stock',
          description: 'Monitoreo de niveles de inventario y alertas de reorden.',
          status: 'complete',
          responsible: ['WMS Admin'],
          subprocesses: [
            { id: 'stock_tracking', name: 'Tracking de Stock', description: 'Niveles actuales por ubicación', status: 'complete' },
            { id: 'min_alerts', name: 'Alertas Mínimos', description: 'Notificación de stock bajo', status: 'complete' }
          ],
          outputs: ['stock_levels', 'reorder_alerts']
        },
        {
          id: 'wms_phase_3',
          phaseNumber: 3,
          name: 'Movimientos de Inventario',
          description: 'Registro de entradas, salidas y transferencias.',
          status: 'complete',
          responsible: ['WMS Admin'],
          outputs: ['movement_record']
        },
        {
          id: 'wms_phase_4',
          phaseNumber: 4,
          name: 'Comodatos GPS',
          description: 'Gestión de préstamos de equipos GPS a custodios.',
          status: 'complete',
          responsible: ['WMS Admin', 'Coordinación Técnica'],
          outputs: ['comodato_activo']
        }
      ],
      connections: [
        { targetModule: 'instaladores', type: 'query', description: 'Kits disponibles para instalación', dataFlow: 'productos_inventario → kit_assignment' }
      ],
      tables: ['productos_inventario', 'movimientos_inventario', 'comodatos_gps', 'categorias_productos']
    },
    monitoring: {
      id: 'monitoring',
      name: 'Monitoreo - Centro de Control',
      shortName: 'Monitoreo',
      icon: 'Radio',
      color: '#EF4444',
      description: 'Monitoreo en tiempo real de servicios, activos y análisis de incidentes.',
      domain: 'monitoring',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'mon_phase_1',
          phaseNumber: 1,
          name: 'Monitoreo en Tiempo Real',
          description: 'Seguimiento GPS de vehículos y custodios en servicio.',
          status: 'complete',
          responsible: ['C4', 'Monitoreo'],
          outputs: ['tracking_activo']
        },
        {
          id: 'mon_phase_2',
          phaseNumber: 2,
          name: 'Gestión de Alertas',
          description: 'Detección y respuesta a alertas de seguridad.',
          status: 'complete',
          responsible: ['C4'],
          subprocesses: [
            { id: 'alert_detection', name: 'Detección', description: 'Geofences, botón pánico, desconexión', status: 'complete' },
            { id: 'alert_response', name: 'Respuesta', description: 'Protocolo de acción según tipo', status: 'complete' }
          ],
          outputs: ['alerta_gestionada']
        },
        {
          id: 'mon_phase_3',
          phaseNumber: 3,
          name: 'Incidentes RRSS',
          description: 'Mining y clasificación de incidentes de seguridad desde redes sociales.',
          status: 'complete',
          responsible: ['Inteligencia'],
          subprocesses: [
            { id: 'apify_mining', name: 'Mining Apify', description: 'Scraping de Twitter con actor apidojo/tweet-scraper', status: 'complete' },
            { id: 'ai_classification', name: 'Clasificación AI', description: 'Lovable AI (Gemini 2.0 Flash) con 12 categorías', status: 'complete' },
            { id: 'geocoding', name: 'Geocodificación', description: 'Híbrido diccionario local + Mapbox API', status: 'complete' }
          ],
          outputs: ['incidente_clasificado']
        },
        {
          id: 'mon_phase_4',
          phaseNumber: 4,
          name: 'Auditoría Forense',
          description: 'Análisis post-incidente y documentación.',
          status: 'in-progress',
          responsible: ['Auditoría', 'Legal'],
          outputs: ['reporte_forense']
        }
      ],
      connections: [
        { targetModule: 'planeacion', type: 'event', description: 'Alertas que afectan servicios', dataFlow: 'alerta → servicio_afectado' }
      ],
      edgeFunctions: ['apify-data-fetcher', 'procesar-incidente-rrss'],
      tables: ['incidentes_rrss', 'alertas_sistema_nacional', 'activos_monitoreo']
    },
    reportes: {
      id: 'reportes',
      name: 'Reportes - Business Intelligence',
      shortName: 'Reportes',
      icon: 'BarChart3',
      color: '#06B6D4',
      description: 'Dashboards ejecutivos, proyecciones GMV, control de proveedores y análisis de rendimiento.',
      domain: 'analytics',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'reports_phase_1',
          phaseNumber: 1,
          name: 'Dashboard Ejecutivo',
          description: 'KPIs principales, proyecciones GMV y tracking de forecast.',
          status: 'complete',
          responsible: ['BI Director', 'Dirección'],
          subprocesses: [
            { id: 'gmv_projection', name: 'Proyección GMV', description: 'Ensemble forecasting con 3 escenarios (Pesimista/Realista/Optimista)', status: 'complete' },
            { id: 'forecast_tracking', name: 'Tracking Forecast vs Real', description: 'Gráficos diario y acumulado con gaps', status: 'complete' },
            { id: 'confidence_bands', name: 'Bandas de Confianza', description: 'Intervalos 80% con cono de incertidumbre expandible', status: 'complete' },
            { id: 'scenario_cards', name: 'Escenarios', description: 'Tarjetas con probabilidades y deltas', status: 'complete' },
            { id: 'yoy_comparison', name: 'Comparación YoY', description: 'Análisis año vs año con tendencias', status: 'complete' },
            { id: 'december_validation', name: 'Validación Histórica', description: 'Dashboard Dic 2023-2024 para calibración', status: 'complete' }
          ],
          outputs: ['executive_dashboard', 'forecast_metrics']
        },
        {
          id: 'reports_phase_2',
          phaseNumber: 2,
          name: 'Control de Proveedores',
          description: 'Análisis de utilización, costos y equidad en asignaciones.',
          status: 'complete',
          responsible: ['BI Director', 'Operaciones'],
          subprocesses: [
            { id: 'external_providers', name: 'Proveedores Externos', description: 'Utilización 12h (13%), revenue leakage ($124K MXN)', status: 'complete' },
            { id: 'armados_internos', name: 'Armados Internos', description: 'Modelo km-escalonado: 2,151 servicios, $2.9M costo', status: 'complete' },
            { id: 'fairness_audit', name: 'Auditoría Equidad', description: 'Gini 0.35, Z-scores, Palma Ratio 2.1x', status: 'complete' },
            { id: 'bi_strategic', name: 'BI Estratégico', description: 'Dashboard multi-periodo con radar y treemap concentración', status: 'complete' },
            { id: 'seicsa_estimation', name: 'Estimación SEICSA', description: 'Duración híbrida: km_teorico + Mapbox + histórico', status: 'complete' }
          ],
          outputs: ['provider_analysis', 'fairness_report']
        },
        {
          id: 'reports_phase_3',
          phaseNumber: 3,
          name: 'Adopción de Plataforma',
          description: 'Métricas de digitalización y ROI de adopción.',
          status: 'complete',
          responsible: ['BI Director'],
          subprocesses: [
            { id: 'adoption_tracking', name: 'Tracking Adopción', description: 'Comparación planificados vs ejecutados históricos', status: 'complete' },
            { id: 'adoption_trend', name: 'Tendencia Mensual', description: 'Evolución 46.9% → 84.4% adopción', status: 'complete' }
          ],
          outputs: ['adoption_metrics']
        },
        {
          id: 'reports_phase_4',
          phaseNumber: 4,
          name: 'Forecasting Predictivo',
          description: 'Sistema avanzado de proyecciones con validación histórica y ajustes dinámicos.',
          status: 'in-progress',
          sla: 'Ongoing',
          responsible: ['BI Director', 'Tech'],
          subprocesses: [
            { id: 'holiday_adjustment', name: 'Ajuste Festivos MX', description: 'Factores por día festivo mexicano validados vs 2023-2024', status: 'complete' },
            { id: 'weekday_patterns', name: 'Patrones Semanales', description: 'Factores por día: Dom -59%, Jue +29%', status: 'complete' },
            { id: 'day_by_day_calc', name: 'Cálculo Día a Día', description: 'Proyección granular vs multiplicador global', status: 'complete' },
            { id: 'dynamic_adjustment', name: 'Ajuste Dinámico', description: 'Corrección por varianza observada MTD con pesos recientes', status: 'complete' },
            { id: 'probability_calc', name: 'Probabilidad Target', description: 'P(alcanzar objetivo) via distribución normal', status: 'complete' },
            { id: 'mape_tracking', name: 'MAPE Baseline', description: 'Tracking de precisión del modelo via backtesting', status: 'in-progress', featureFlag: 'ENABLE_MAPE_TRACKING' },
            { id: 'auto_calibration', name: 'Auto-Calibración', description: 'Feedback loop automático para mejorar precisión', status: 'pending' }
          ],
          featureFlag: 'ENABLE_ADVANCED_FORECASTING',
          gates: ['MAPE <15%', 'Validación histórica 6 meses'],
          outputs: ['forecast_calibration', 'accuracy_metrics']
        }
      ],
      connections: [
        { targetModule: 'planeacion', type: 'query', description: 'Datos de servicios', dataFlow: 'servicios_custodia → métricas GMV' },
        { targetModule: 'supply', type: 'query', description: 'Pipeline de candidatos', dataFlow: 'candidatos → funnel_metrics' },
        { targetModule: 'monitoring', type: 'query', description: 'Incidentes para análisis', dataFlow: 'incidentes_rrss → intelligence_dashboard' }
      ],
      edgeFunctions: ['estimar-duracion-servicio'],
      tables: ['servicios_custodia', 'servicios_planificados', 'asignacion_armados', 'calendario_feriados_mx']
    },
    configuracion: {
      id: 'configuracion',
      name: 'Configuración - Administración',
      shortName: 'Config',
      icon: 'Settings',
      color: '#64748B',
      description: 'Gestión de usuarios, roles, permisos granulares, catálogos y configuración del sistema.',
      domain: 'admin',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'config_phase_1',
          phaseNumber: 1,
          name: 'Gestión de Usuarios',
          description: 'Alta, baja, archivado y asignación de roles.',
          status: 'complete',
          responsible: ['Admin'],
          subprocesses: [
            { id: 'user_crud', name: 'CRUD Usuarios', description: 'Crear, editar, archivar usuarios', status: 'complete' },
            { id: 'role_assignment', name: 'Asignación Roles', description: 'Permisos por rol', status: 'complete' },
            { id: 'archival', name: 'Archivado', description: 'Sistema de egresados con reactivación', status: 'complete' }
          ],
          outputs: ['user_managed']
        },
        {
          id: 'config_phase_2',
          phaseNumber: 2,
          name: 'Gestión de Permisos',
          description: 'Sistema granular de permisos por rol, módulo y acción.',
          status: 'complete',
          responsible: ['Admin', 'Tech'],
          subprocesses: [
            { id: 'role_crud', name: 'CRUD de Roles', description: 'Crear, editar, eliminar roles personalizados', status: 'complete' },
            { id: 'permission_assign', name: 'Asignación Permisos', description: 'Permisos por página, acción y componente', status: 'complete' },
            { id: 'readonly_access', name: 'Acceso Read-Only', description: 'Creación de accesos de solo lectura para auditores', status: 'complete' },
            { id: 'permission_groups', name: 'Grupos de Permisos', description: 'Agrupación por tipo: página, acción, datos', status: 'complete' }
          ],
          outputs: ['roles_configured', 'permissions_assigned']
        },
        {
          id: 'config_phase_3',
          phaseNumber: 3,
          name: 'Catálogos',
          description: 'Gestión de catálogos del sistema (vehículos, zonas, etc.).',
          status: 'complete',
          responsible: ['Admin'],
          subprocesses: [
            { id: 'vehicles_catalog', name: 'Catálogo Vehículos', description: '200+ modelos de 15+ marcas mexicanas', status: 'complete' },
            { id: 'zones_catalog', name: 'Catálogo Zonas', description: 'Zonas operativas con geocercas', status: 'complete' },
            { id: 'channels_catalog', name: 'Canales Reclutamiento', description: 'Fuentes de leads para análisis ROI', status: 'complete' }
          ],
          outputs: ['catalog_updated']
        },
        {
          id: 'config_phase_4',
          phaseNumber: 4,
          name: 'Feature Flags',
          description: 'Control de activación de funcionalidades y validaciones.',
          status: 'complete',
          responsible: ['Tech', 'Admin'],
          subprocesses: [
            { id: 'supply_flags', name: 'Flags Supply', description: 'Control de gates de liberación', status: 'complete' },
            { id: 'forecast_flags', name: 'Flags Forecasting', description: 'Activación de features predictivos', status: 'complete' }
          ],
          outputs: ['flag_configured']
        }
      ],
      connections: [
        { targetModule: 'supply', type: 'query', description: 'Feature flags para liberación', dataFlow: 'supply_feature_flags → liberation_gate' }
      ],
      edgeFunctions: ['add-permission', 'create-role', 'update-role', 'delete-role', 'assign-role', 'create-readonly-access'],
      tables: ['profiles', 'user_roles', 'permissions', 'supply_feature_flags']
    },
    integraciones: {
      id: 'integraciones',
      name: 'Integraciones Externas',
      shortName: 'APIs',
      icon: 'Plug',
      color: '#EC4899',
      description: 'Conexiones con servicios externos de AI, geocoding, comunicación y web scraping.',
      domain: 'integrations',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'int_ai',
          phaseNumber: 1,
          name: 'AI & Machine Learning',
          description: 'Servicios de inteligencia artificial para análisis y automatización.',
          status: 'complete',
          responsible: ['Tech'],
          subprocesses: [
            { id: 'vapi', name: 'VAPI (Voice AI)', description: 'Entrevistas automatizadas por voz con assistant configs', status: 'complete' },
            { id: 'openai', name: 'OpenAI GPT-4.1', description: 'Análisis forense, scoring psicológico, insights estratégicos', status: 'complete' },
            { id: 'lovable_ai', name: 'Lovable AI (Gemini 2.0 Flash)', description: 'Clasificación de incidentes, OCR de documentos', status: 'complete' }
          ],
          outputs: ['ai_responses', 'classifications', 'insights']
        },
        {
          id: 'int_geo',
          phaseNumber: 2,
          name: 'Geocoding & Mapas',
          description: 'Servicios de geolocalización, mapas y cálculo de rutas.',
          status: 'complete',
          responsible: ['Tech'],
          subprocesses: [
            { id: 'mapbox_geocoding', name: 'Mapbox Geocoding', description: 'Conversión de direcciones a coordenadas', status: 'complete' },
            { id: 'mapbox_directions', name: 'Mapbox Directions', description: 'Cálculo de rutas y duraciones estimadas', status: 'complete' },
            { id: 'mapbox_maps', name: 'Mapbox GL', description: 'Visualización de mapas interactivos', status: 'complete' },
            { id: 'local_dictionary', name: 'Diccionario Local MX', description: '50+ ciudades mexicanas para geocoding zero-cost', status: 'complete' }
          ],
          outputs: ['coordinates', 'routes', 'durations']
        },
        {
          id: 'int_scraping',
          phaseNumber: 3,
          name: 'Web Scraping & Data Mining',
          description: 'Extracción de datos de fuentes externas para inteligencia.',
          status: 'complete',
          responsible: ['Inteligencia', 'Tech'],
          subprocesses: [
            { id: 'apify', name: 'Apify (Tweet Scraper)', description: 'Mining de incidentes de Twitter/X con actor apidojo/tweet-scraper', status: 'complete' },
            { id: 'data_enrichment', name: 'Enriquecimiento', description: 'Extracción de hashtags, menciones, media URLs', status: 'complete' }
          ],
          outputs: ['raw_incidents', 'social_data']
        },
        {
          id: 'int_comm',
          phaseNumber: 4,
          name: 'Comunicación',
          description: 'Canales de comunicación con candidatos y operadores.',
          status: 'in-progress',
          responsible: ['Supply', 'Tech'],
          subprocesses: [
            { id: 'dialfire', name: 'Dialfire', description: 'Integración con call center para llamadas salientes', status: 'complete' },
            { id: 'whatsapp', name: 'WhatsApp Business', description: 'Bot de comunicación con candidatos (en desarrollo)', status: 'in-progress' }
          ],
          outputs: ['call_logs', 'messages']
        }
      ],
      connections: [
        { targetModule: 'supply', type: 'trigger', description: 'VAPI y análisis AI', dataFlow: 'vapi_call → candidato_evaluation' },
        { targetModule: 'monitoring', type: 'trigger', description: 'Apify → incidentes RRSS', dataFlow: 'apify_scrape → incidentes_rrss' },
        { targetModule: 'planeacion', type: 'query', description: 'Mapbox para geocoding y rutas', dataFlow: 'direcciones → coordinates/durations' },
        { targetModule: 'reportes', type: 'query', description: 'Estimación duración con Mapbox', dataFlow: 'mapbox_directions → duracion_estimada' }
      ],
      edgeFunctions: [
        'vapi-call', 'vapi-call-test', 'vapi-webhook-receiver',
        'analyze-interview', 'ai-recruitment-analysis', 'siercp-ai-assistant',
        'apify-data-fetcher', 'procesar-incidente-rrss',
        'mapbox-token', 'estimar-duracion-servicio',
        'dialfire-webhook'
      ],
      externalServices: ['VAPI', 'OpenAI GPT-4.1', 'Lovable AI (Gemini)', 'Mapbox', 'Apify', 'Dialfire', 'WhatsApp Business'],
      tables: ['vapi_call_logs', 'incidentes_rrss']
    }
  },
  globalConnections: [
    { from: 'supply', to: 'planeacion', label: 'Custodios Liberados', type: 'data', description: 'Los custodios aprobados en Supply se sincronizan a Planeación para asignación de servicios.' },
    { from: 'supply', to: 'instaladores', label: 'Programar Instalación', type: 'trigger', description: 'Al llegar a fase 10, se programa instalación GPS del candidato.' },
    { from: 'instaladores', to: 'wms', label: 'Consumo de Kits', type: 'data', description: 'Las instalaciones consumen kits GPS del inventario WMS.' },
    { from: 'instaladores', to: 'supply', label: 'Instalación Completada', type: 'trigger', description: 'Trigger automático actualiza checklist de liberación cuando instalación se completa.' },
    { from: 'planeacion', to: 'monitoring', label: 'Servicios Activos', type: 'event', description: 'Servicios en curso se envían a monitoreo en tiempo real.' },
    { from: 'monitoring', to: 'reportes', label: 'Incidentes', type: 'data', description: 'Incidentes clasificados alimentan dashboards de inteligencia.' },
    { from: 'planeacion', to: 'reportes', label: 'Métricas Servicio', type: 'data', description: 'Datos de servicios alimentan proyecciones y dashboards.' },
    { from: 'integraciones', to: 'supply', label: 'VAPI + OpenAI', type: 'trigger', description: 'Entrevistas AI por voz y análisis forense alimentan el pipeline de reclutamiento.' },
    { from: 'integraciones', to: 'monitoring', label: 'Apify Scraping', type: 'data', description: 'Mining de Twitter alimenta la base de incidentes de seguridad.' },
    { from: 'integraciones', to: 'planeacion', label: 'Mapbox APIs', type: 'data', description: 'Geocoding y direcciones para servicios y estimación de duraciones.' },
    { from: 'configuracion', to: 'supply', label: 'Feature Flags', type: 'data', description: 'Flags controlan gates de validación en liberación de custodios.' }
  ],
  
  // Swimlane lanes definition
  swimlanes: [
    { id: 'supply', name: 'Supply', actor: 'Supply Team', color: '#10B981' },
    { id: 'coordinacion', name: 'Coordinación', actor: 'Coord. Operativa', color: '#8B5CF6' },
    { id: 'instaladores', name: 'Instaladores', actor: 'Técnicos', color: '#F59E0B' },
    { id: 'planeacion', name: 'Planeación', actor: 'Planificadores', color: '#6366F1' },
    { id: 'monitoreo', name: 'Monitoreo', actor: 'C4', color: '#EF4444' }
  ],

  // Swimlane flow nodes - Candidate journey from Lead to Service
  swimlaneFlow: [
    // Supply phases
    { id: 'node_1', phaseId: 'supply_phase_1', phaseName: 'Lead', lane: 'supply', position: 1, nextNodes: ['node_2'], sla: '15 min', status: 'complete' },
    { id: 'node_2', phaseId: 'supply_phase_2', phaseName: 'Contacto', lane: 'supply', position: 2, nextNodes: ['node_3'], sla: '24h', status: 'complete' },
    { id: 'node_3', phaseId: 'supply_phase_2b', phaseName: 'VAPI', lane: 'supply', position: 3, nextNodes: ['node_4'], sla: '15 min', status: 'complete' },
    { id: 'node_4', phaseId: 'supply_phase_3', phaseName: 'Entrevista', lane: 'supply', position: 4, nextNodes: ['node_5'], sla: '3 días', status: 'complete' },
    { id: 'node_5', phaseId: 'supply_phase_4', phaseName: 'Psicométricos', lane: 'supply', position: 5, nextNodes: ['node_5b'], sla: '3 días', status: 'complete' },
    { id: 'node_5b', phaseId: 'supply_phase_5', phaseName: 'Toxicología', lane: 'supply', position: 6, nextNodes: ['node_6'], sla: '5 días', status: 'complete' },
    { id: 'node_6', phaseId: 'supply_phase_6', phaseName: 'Referencias', lane: 'supply', position: 7, nextNodes: ['node_7'], sla: '5 días', status: 'complete' },
    { id: 'node_7', phaseId: 'supply_phase_7', phaseName: 'Documentos', lane: 'supply', position: 8, nextNodes: ['node_8'], sla: '3 días', status: 'complete' },
    { id: 'node_8', phaseId: 'supply_phase_8', phaseName: 'Contrato', lane: 'supply', position: 9, nextNodes: ['node_9'], sla: '2 días', status: 'complete' },
    { id: 'node_9', phaseId: 'supply_phase_9', phaseName: 'Capacitación', lane: 'supply', position: 10, nextNodes: ['node_10'], sla: '7 días', status: 'complete' },
    // Handoff to Instaladores
    { id: 'node_10', phaseId: 'supply_phase_10', phaseName: 'Instalación', lane: 'instaladores', position: 11, nextNodes: ['node_11'], sla: '5 días', status: 'complete' },
    // Return to Supply for liberation
    { id: 'node_11', phaseId: 'supply_phase_11', phaseName: 'Liberación', lane: 'supply', position: 12, nextNodes: ['node_12'], sla: '1 día', status: 'complete' },
    // Handoff to Planeación
    { id: 'node_12', phaseId: 'planning_reception', phaseName: 'Recepción', lane: 'planeacion', position: 13, nextNodes: ['node_13'], sla: '1h', status: 'complete' },
    { id: 'node_13', phaseId: 'planning_custodio', phaseName: 'Asignación', lane: 'planeacion', position: 14, nextNodes: ['node_14'], sla: '15 min', status: 'complete' },
    { id: 'node_14', phaseId: 'planning_armado', phaseName: 'Armado', lane: 'planeacion', position: 15, nextNodes: ['node_15'], status: 'complete' },
    // Execution with Monitoreo
    { id: 'node_15', phaseId: 'planning_execution', phaseName: 'Ejecución', lane: 'monitoreo', position: 16, nextNodes: ['node_16'], status: 'complete' },
    { id: 'node_16', phaseId: 'planning_closure', phaseName: 'Cierre', lane: 'planeacion', position: 17, nextNodes: [], status: 'complete' }
  ],

  // SLA Compliance Metrics (mock data - to be connected to real DB)
  slaMetrics: [
    { phaseId: 'supply_phase_1', phaseName: 'Generación Lead', module: 'Supply', targetSLA: '15 min', targetMinutes: 15, avgActual: 12, complianceRate: 94, trend: 'up', sampleSize: 156 },
    { phaseId: 'supply_phase_2', phaseName: 'Contacto Inicial', module: 'Supply', targetSLA: '24h', targetMinutes: 1440, avgActual: 1320, complianceRate: 87, trend: 'stable', sampleSize: 142 },
    { phaseId: 'supply_phase_2b', phaseName: 'Entrevista VAPI', module: 'Supply', targetSLA: '15 min', targetMinutes: 15, avgActual: 8, complianceRate: 99, trend: 'up', sampleSize: 89 },
    { phaseId: 'supply_phase_3', phaseName: 'Entrevista Estructurada', module: 'Supply', targetSLA: '3 días', targetMinutes: 4320, avgActual: 2880, complianceRate: 91, trend: 'up', sampleSize: 78 },
    { phaseId: 'supply_phase_11', phaseName: 'Liberación', module: 'Supply', targetSLA: '1 día', targetMinutes: 1440, avgActual: 960, complianceRate: 88, trend: 'stable', sampleSize: 45 },
    { phaseId: 'planning_reception', phaseName: 'Recepción Solicitud', module: 'Planeación', targetSLA: '1h', targetMinutes: 60, avgActual: 42, complianceRate: 92, trend: 'up', sampleSize: 645 },
    { phaseId: 'planning_custodio', phaseName: 'Asignación Custodio', module: 'Planeación', targetSLA: '15 min', targetMinutes: 15, avgActual: 18, complianceRate: 76, trend: 'down', sampleSize: 589 },
    { phaseId: 'install_phase_2', phaseName: 'Programación Instalación', module: 'Instaladores', targetSLA: '24h', targetMinutes: 1440, avgActual: 1080, complianceRate: 85, trend: 'stable', sampleSize: 67 }
  ],

  // Roles for RACI matrix
  roles: [
    'Supply Lead',
    'Supply Admin', 
    'Coordinación Operativa',
    'Coordinación Técnica',
    'Planeación',
    'BI Director',
    'C4/Monitoreo',
    'Instaladores',
    'Admin',
    'Tech'
  ]
};

export const getModuleById = (id: string): Module | undefined => {
  return productArchitecture.modules[id];
};

export const getModuleConnections = (moduleId: string): GlobalConnection[] => {
  return productArchitecture.globalConnections.filter(
    c => c.from === moduleId || c.to === moduleId
  );
};

export const getStatusColor = (status: ProcessStatus): string => {
  switch (status) {
    case 'complete': return '#10B981';
    case 'in-progress': return '#F59E0B';
    case 'pending': return '#EF4444';
    case 'feature-flag': return '#3B82F6';
    default: return '#64748B';
  }
};

export const getStatusLabel = (status: ProcessStatus): string => {
  switch (status) {
    case 'complete': return 'Completado';
    case 'in-progress': return 'En Desarrollo';
    case 'pending': return 'Pendiente';
    case 'feature-flag': return 'Feature Flag';
    default: return 'Desconocido';
  }
};
