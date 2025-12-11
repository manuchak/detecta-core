// Centralized Product Architecture Data
// Update this file to keep documentation in sync with development

export type ProcessStatus = 'complete' | 'in-progress' | 'pending' | 'feature-flag';

export interface SubProcess {
  id: string;
  name: string;
  description: string;
  status: ProcessStatus;
  featureFlag?: string;
}

export interface ProcessPhase {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  status: ProcessStatus;
  sla?: string;
  responsible: string[];
  featureFlag?: string;
  subprocesses?: SubProcess[];
  outputs?: string[];
  gates?: string[];
  documents?: string[];
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
  domain: 'supply' | 'operations' | 'monitoring' | 'admin' | 'analytics';
  phases: ProcessPhase[];
  connections: ModuleConnection[];
  edgeFunctions?: string[];
  tables?: string[];
  lastUpdated: string;
}

export interface GlobalConnection {
  from: string;
  to: string;
  label: string;
  type: 'data' | 'event' | 'trigger';
  description: string;
}

export interface ProductArchitecture {
  version: string;
  lastUpdated: string;
  modules: Record<string, Module>;
  globalConnections: GlobalConnection[];
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
          responsible: ['Supply Lead', 'Supply Admin'],
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
          responsible: ['Supply Lead'],
          outputs: ['session_scheduled', 'initial_interest'],
          gates: ['Candidato interesado', 'Disponibilidad confirmada']
        },
        {
          id: 'supply_phase_3',
          phaseNumber: 3,
          name: 'Entrevista Estructurada',
          description: 'Evaluación formal con ratings 1-5 en 6 dimensiones + checklist de riesgo.',
          status: 'complete',
          sla: '3 días',
          responsible: ['Supply Lead', 'Coordinación Operativa'],
          featureFlag: 'REQUIRE_STRUCTURED_INTERVIEW',
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
            { id: 'semaphore_calc', name: 'Cálculo Semáforo', description: 'Verde ≥70% auto-aprueba, Ámbar 50-69% requiere aval, Rojo <50% rechaza', status: 'complete' }
          ],
          gates: ['Verde: Auto-aprobación', 'Ámbar: Aval Coordinación', 'Rojo: Rechazo automático'],
          outputs: ['psychometric_score', 'semaphore_result']
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
        { targetModule: 'wms', type: 'query', description: 'Asignación de kits GPS', dataFlow: 'kit_assignment → productos_inventario' }
      ],
      edgeFunctions: ['ocr-documento', 'generar-contrato-pdf'],
      tables: ['candidatos_custodios', 'leads', 'entrevistas_estructuradas', 'candidato_risk_checklist', 'evaluaciones_psicometricas', 'evaluaciones_toxicologicas', 'referencias_candidato', 'documentos_candidato', 'contratos_candidato', 'progreso_capacitacion', 'custodio_liberacion']
    },
    planeacion: {
      id: 'planeacion',
      name: 'Planeación - Gestión de Servicios',
      shortName: 'Planeación',
      icon: 'Calendar',
      color: '#8B5CF6',
      description: 'Programación y asignación de servicios de custodia a custodios operativos.',
      domain: 'operations',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'planning_phase_1',
          phaseNumber: 1,
          name: 'Recepción de Solicitud',
          description: 'Ingreso de solicitud de servicio por cliente o sistema.',
          status: 'complete',
          sla: '1 hora',
          responsible: ['Planeación'],
          outputs: ['servicio_planificado']
        },
        {
          id: 'planning_phase_2',
          phaseNumber: 2,
          name: 'Asignación de Custodio',
          description: 'Selección y asignación de custodio basado en proximidad, disponibilidad y score.',
          status: 'complete',
          sla: '2 horas',
          responsible: ['Planeación'],
          subprocesses: [
            { id: 'proximity_search', name: 'Búsqueda por Proximidad', description: 'Query geoespacial de custodios disponibles', status: 'complete' },
            { id: 'score_ranking', name: 'Ranking por Score', description: 'Ordenamiento por desempeño histórico', status: 'complete' },
            { id: 'assignment', name: 'Asignación', description: 'Confirmación de custodio para el servicio', status: 'complete' }
          ],
          outputs: ['custodio_asignado']
        },
        {
          id: 'planning_phase_3',
          phaseNumber: 3,
          name: 'Asignación de Armado',
          description: 'Asignación de personal armado si el servicio lo requiere.',
          status: 'complete',
          sla: '2 horas',
          responsible: ['Planeación', 'Coordinación Armados'],
          subprocesses: [
            { id: 'armado_search', name: 'Búsqueda de Armado', description: 'Disponibilidad en zona', status: 'complete' },
            { id: 'provider_selection', name: 'Selección de Proveedor', description: 'Interno vs externo según disponibilidad', status: 'complete' },
            { id: 'armado_confirmation', name: 'Confirmación', description: 'Punto de encuentro y hora', status: 'complete' }
          ],
          outputs: ['armado_asignado']
        },
        {
          id: 'planning_phase_4',
          phaseNumber: 4,
          name: 'Ejecución del Servicio',
          description: 'Seguimiento en tiempo real del servicio en curso.',
          status: 'complete',
          responsible: ['Monitoreo', 'Planeación'],
          outputs: ['servicio_en_curso']
        },
        {
          id: 'planning_phase_5',
          phaseNumber: 5,
          name: 'Cierre del Servicio',
          description: 'Registro de hora fin, incidencias y captura de duración real.',
          status: 'complete',
          responsible: ['Planeación', 'Custodio'],
          subprocesses: [
            { id: 'end_capture', name: 'Captura Fin', description: 'Registro de hora_fin_real', status: 'complete' },
            { id: 'duration_calc', name: 'Cálculo Duración', description: 'Duración real para métricas', status: 'complete' },
            { id: 'incidents', name: 'Registro Incidencias', description: 'Documentación de novedades', status: 'complete' }
          ],
          outputs: ['servicio_completado', 'duracion_real']
        }
      ],
      connections: [
        { targetModule: 'monitoring', type: 'event', description: 'Servicios activos para monitoreo', dataFlow: 'servicio_en_curso → monitoreo_activo' },
        { targetModule: 'reportes', type: 'query', description: 'Datos para dashboards', dataFlow: 'servicios_custodia → métricas' }
      ],
      edgeFunctions: ['estimar-duracion-servicio'],
      tables: ['servicios_planificados', 'servicios_custodia', 'pc_custodios', 'custodios_operativos', 'asignacion_armados']
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
      description: 'Dashboards ejecutivos, proyecciones y análisis de rendimiento.',
      domain: 'analytics',
      lastUpdated: '2025-12-11',
      phases: [
        {
          id: 'reports_phase_1',
          phaseNumber: 1,
          name: 'Dashboard Ejecutivo',
          description: 'KPIs principales y proyecciones GMV.',
          status: 'complete',
          responsible: ['BI', 'Dirección'],
          subprocesses: [
            { id: 'gmv_projection', name: 'Proyección GMV', description: 'Ensemble forecasting con ajuste por días festivos', status: 'complete' },
            { id: 'forecast_tracking', name: 'Tracking Forecast', description: 'Comparación diaria forecast vs real', status: 'complete' },
            { id: 'confidence_bands', name: 'Bandas de Confianza', description: 'Intervalos 80% con cono de incertidumbre', status: 'complete' }
          ],
          outputs: ['executive_dashboard']
        },
        {
          id: 'reports_phase_2',
          phaseNumber: 2,
          name: 'Control de Proveedores',
          description: 'Análisis de utilización y costos de proveedores externos.',
          status: 'complete',
          responsible: ['BI', 'Operaciones'],
          subprocesses: [
            { id: 'external_providers', name: 'Proveedores Externos', description: 'Utilización 12h, revenue leakage', status: 'complete' },
            { id: 'armados_internos', name: 'Armados Internos', description: 'Modelo km-escalonado', status: 'complete' },
            { id: 'fairness_audit', name: 'Auditoría Equidad', description: 'Gini, entropía, z-scores', status: 'complete' }
          ],
          outputs: ['provider_analysis']
        },
        {
          id: 'reports_phase_3',
          phaseNumber: 3,
          name: 'Adopción de Plataforma',
          description: 'Métricas de digitalización y adopción.',
          status: 'complete',
          responsible: ['BI'],
          outputs: ['adoption_metrics']
        }
      ],
      connections: [
        { targetModule: 'planeacion', type: 'query', description: 'Datos de servicios', dataFlow: 'servicios_custodia → métricas' },
        { targetModule: 'supply', type: 'query', description: 'Pipeline de candidatos', dataFlow: 'candidatos → funnel_metrics' }
      ],
      tables: ['servicios_custodia', 'servicios_planificados']
    },
    configuracion: {
      id: 'configuracion',
      name: 'Configuración - Administración',
      shortName: 'Config',
      icon: 'Settings',
      color: '#64748B',
      description: 'Gestión de usuarios, roles, catálogos y configuración del sistema.',
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
          name: 'Catálogos',
          description: 'Gestión de catálogos del sistema (vehículos, zonas, etc.).',
          status: 'complete',
          responsible: ['Admin'],
          outputs: ['catalog_updated']
        },
        {
          id: 'config_phase_3',
          phaseNumber: 3,
          name: 'Feature Flags',
          description: 'Control de activación de funcionalidades.',
          status: 'complete',
          responsible: ['Tech', 'Admin'],
          outputs: ['flag_configured']
        }
      ],
      connections: [],
      tables: ['profiles', 'user_roles', 'supply_feature_flags']
    }
  },
  globalConnections: [
    { from: 'supply', to: 'planeacion', label: 'Custodios Liberados', type: 'data', description: 'Los custodios aprobados en Supply se sincronizan a Planeación para asignación de servicios.' },
    { from: 'supply', to: 'instaladores', label: 'Programar Instalación', type: 'trigger', description: 'Al llegar a fase 10, se programa instalación GPS del candidato.' },
    { from: 'instaladores', to: 'wms', label: 'Consumo de Kits', type: 'data', description: 'Las instalaciones consumen kits GPS del inventario WMS.' },
    { from: 'instaladores', to: 'supply', label: 'Instalación Completada', type: 'trigger', description: 'Trigger automático actualiza checklist de liberación cuando instalación se completa.' },
    { from: 'planeacion', to: 'monitoring', label: 'Servicios Activos', type: 'event', description: 'Servicios en curso se envían a monitoreo en tiempo real.' },
    { from: 'monitoring', to: 'reportes', label: 'Incidentes', type: 'data', description: 'Incidentes clasificados alimentan dashboards de inteligencia.' },
    { from: 'planeacion', to: 'reportes', label: 'Métricas Servicio', type: 'data', description: 'Datos de servicios alimentan proyecciones y dashboards.' }
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
