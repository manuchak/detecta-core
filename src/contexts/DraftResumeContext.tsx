import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface DraftInfo {
  id: string; // Unique identifier for the draft type
  storageKey: string;
  moduleName: string;
  resumePath: string;
  isMeaningful: (data: any) => boolean;
  lastModified?: number;
  previewText?: string;
}

// =============================================================================
// COMPLETE DRAFT CATALOG - ALL 47 FORMS
// =============================================================================

const DRAFT_CATALOG: DraftInfo[] = [
  // ===========================================================================
  // CATEGORY 1: Multi-Step Wizards (CRITICAL - robust level)
  // ===========================================================================
  {
    id: 'service-creation',
    storageKey: 'service_creation_workflow',
    moduleName: 'Creación de Servicio',
    resumePath: '/planeacion/nuevo-servicio',
    isMeaningful: (data) => {
      return data && (data.routeData || data.serviceData || data.assignmentData);
    },
    previewText: 'Continúa creando tu servicio',
  },
  {
    id: 'request-creation-workflow',
    storageKey: 'request_creation_workflow',
    moduleName: 'Solicitud de Servicio (Legacy)',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.cliente || data.origen || data.destino),
  },
  {
    id: 'lms-course-wizard',
    storageKey: 'lms_curso_wizard',
    moduleName: 'Creación de Curso LMS',
    resumePath: '/lms/admin/cursos/nuevo',
    isMeaningful: (data) => {
      return data && (data.formValues?.titulo || data.modulos?.length > 0);
    },
    previewText: 'Continúa creando tu curso',
  },
  {
    id: 'wms-devolucion-wizard',
    storageKey: 'wms_devolucion_wizard',
    moduleName: 'Devolución a Proveedor (RMA)',
    resumePath: '/wms',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (Object.keys(d.seleccion || {}).length > 0 || d.numeroRMA || d.proveedorId);
    },
    previewText: 'Continúa la devolución RMA',
  },
  {
    id: 'import-wizard',
    storageKey: 'import_wizard',
    moduleName: 'Importación de Datos',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.step > 0 || data.parsedData?.length > 0),
  },
  {
    id: 'import-wizard-enhanced',
    storageKey: 'import_wizard_enhanced',
    moduleName: 'Importación de Datos (Mejorado)',
    resumePath: '/maintenance',
    isMeaningful: (data) => data && (data.step > 0 || data.mappings),
  },
  {
    id: 'excel-import-wizard',
    storageKey: 'excel_import_wizard',
    moduleName: 'Importación Excel',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.columns?.length > 0 || data.mapping),
  },
  {
    id: 'checklist-wizard',
    storageKey: 'checklist_wizard',
    moduleName: 'Checklist de Servicio',
    resumePath: '/custodian',
    isMeaningful: (data) => data && (data.items?.some((i: any) => i.checked) || data.fotos?.length > 0),
  },

  // ===========================================================================
  // CATEGORY 2: Registration/Creation Forms (standard level)
  // ===========================================================================
  {
    id: 'enhanced-lead-form',
    storageKey: 'enhanced_lead_form',
    moduleName: 'Formulario de Lead (Mejorado)',
    resumePath: '/leads',
    isMeaningful: (data) => data && (data.nombre || data.email || data.telefono),
  },
  {
    id: 'lead-form',
    storageKey: 'lead_form_draft',
    moduleName: 'Formulario de Lead',
    resumePath: '/leads',
    isMeaningful: (data) => data && (data.nombre || data.email || data.telefono),
    previewText: 'Continúa editando el lead',
  },
  {
    id: 'installer-registration-robust',
    storageKey: 'installer_registration_form',
    moduleName: 'Registro de Instalador',
    resumePath: '/installers',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.nombre_completo || d.telefono || d.email);
    },
    previewText: 'Continúa el registro de instalador',
  },
  {
    id: 'installer-registration-dialog',
    storageKey: 'installer_registration_dialog',
    moduleName: 'Registro de Instalador (Dialog)',
    resumePath: '/installers',
    isMeaningful: (data) => data && (data.nombre_completo || data.telefono),
  },
  {
    id: 'programar-instalacion',
    storageKey: 'programar_instalacion',
    moduleName: 'Programación de Instalación',
    resumePath: '/installers',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.servicio_id || d.fecha_programada);
    },
    previewText: 'Continúa la programación',
  },
  {
    id: 'servicio-form',
    storageKey: 'servicio_form',
    moduleName: 'Formulario de Servicio',
    resumePath: '/services',
    isMeaningful: (data) => data && (data.cliente || data.origen || data.destino),
  },
  {
    id: 'servicio-completo-form',
    storageKey: 'servicio_completo_form',
    moduleName: 'Servicio Completo',
    resumePath: '/services',
    isMeaningful: (data) => data && (data.cliente_id || data.ruta_id),
  },
  {
    id: 'custodio-dialog',
    storageKey: 'custodio_dialog',
    moduleName: 'Nuevo Custodio',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.nombre || data.telefono),
  },
  {
    id: 'cliente-dialog',
    storageKey: 'cliente_dialog',
    moduleName: 'Nuevo Cliente',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.nombre || data.razon_social),
  },
  {
    id: 'servicio-dialog',
    storageKey: 'servicio_dialog',
    moduleName: 'Nuevo Servicio',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.cliente || data.ruta),
  },

  // ===========================================================================
  // CATEGORY 3: Evaluation/Interview Forms (standard level)
  // ===========================================================================
  {
    id: 'manual-interview',
    storageKey: 'manual_interview',
    moduleName: 'Entrevista Manual',
    resumePath: '/leads',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.interviewNotes || d.decision);
    },
    previewText: 'Continúa la entrevista',
  },
  {
    id: 'structured-interview',
    storageKey: 'structured_interview',
    moduleName: 'Entrevista Estructurada',
    resumePath: '/recruitment',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.notas || d.fortalezas?.length > 0 || d.decision !== 'pendiente');
    },
    previewText: 'Continúa la entrevista',
  },
  {
    id: 'reference-form',
    storageKey: 'reference',
    moduleName: 'Agregar Referencia',
    resumePath: '/recruitment',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.nombre || d.telefono || d.email);
    },
    previewText: 'Continúa agregando referencia',
  },
  {
    id: 'toxicology-result',
    storageKey: 'toxicology_result',
    moduleName: 'Resultado Toxicológico',
    resumePath: '/recruitment',
    isMeaningful: (data) => data && (data.resultado || data.laboratorio),
  },
  {
    id: 'risk-checklist',
    storageKey: 'risk_checklist',
    moduleName: 'Checklist de Riesgo',
    resumePath: '/recruitment',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.notas || Object.values(d.factors || {}).some(v => v));
    },
    previewText: 'Continúa evaluación de riesgo',
  },
  {
    id: 'candidate-evaluation',
    storageKey: 'candidate_evaluation',
    moduleName: 'Evaluación de Candidato',
    resumePath: '/recruitment',
    isMeaningful: (data) => data && (data.notas || data.decision),
  },

  // ===========================================================================
  // CATEGORY 4: Operative Forms (light level)
  // ===========================================================================
  {
    id: 'edit-operative-profile',
    storageKey: 'edit_operative_profile',
    moduleName: 'Editar Perfil Operativo',
    resumePath: '/perfiles-operativos',
    isMeaningful: (data) => data && Object.keys(data).length > 0,
  },
  {
    id: 'cambio-estatus',
    storageKey: 'cambio_estatus',
    moduleName: 'Cambio de Estatus',
    resumePath: '/operatives',
    isMeaningful: (data) => data && (data.motivo || data.nuevo_estatus),
  },
  {
    id: 'aplicar-sancion',
    storageKey: 'aplicar_sancion',
    moduleName: 'Aplicar Sanción',
    resumePath: '/operatives',
    isMeaningful: (data) => data && (data.tipo_sancion || data.descripcion),
  },
  {
    id: 'report-unavailability',
    storageKey: 'report_unavailability',
    moduleName: 'Reportar Indisponibilidad',
    resumePath: '/custodian',
    isMeaningful: (data) => data && (data.motivo || data.fecha_inicio),
  },
  {
    id: 'record-maintenance',
    storageKey: 'record_maintenance',
    moduleName: 'Registro de Mantenimiento',
    resumePath: '/custodian',
    isMeaningful: (data) => data && (data.tipo || data.descripcion),
  },

  // ===========================================================================
  // CATEGORY 5: Administrative/Config Forms (light level - optional)
  // ===========================================================================
  {
    id: 'prices-manager',
    storageKey: 'prices_manager',
    moduleName: 'Gestión de Precios',
    resumePath: '/admin',
    isMeaningful: (data) => data && Object.keys(data).length > 0,
  },

  // ===========================================================================
  // CATEGORY 6: WMS Forms (standard level)
  // ===========================================================================
  {
    id: 'wms-desecho-wizard',
    storageKey: 'wms_desecho_wizard',
    moduleName: 'Desecho de Inventario',
    resumePath: '/wms',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && d.item?.producto_id;
    },
    previewText: 'Continúa registrando el desecho',
  },
  {
    id: 'wms-orden-compra',
    storageKey: 'wms_orden_compra',
    moduleName: 'Orden de Compra',
    resumePath: '/wms',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.detalles?.length > 0 || d.proveedor_id);
    },
    previewText: 'Continúa la orden de compra',
  },
  {
    id: 'recepcion-dialog',
    storageKey: 'recepcion_dialog',
    moduleName: 'Recepción de Inventario',
    resumePath: '/wms',
    isMeaningful: (data) => data && (data.items?.length > 0 || data.proveedor_id),
  },
  {
    id: 'asignar-gps',
    storageKey: 'asignar_gps',
    moduleName: 'Asignar GPS',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.dispositivo_id || data.vehiculo_id),
  },
  {
    id: 'devolucion-dialog',
    storageKey: 'devolucion_dialog',
    moduleName: 'Devolución de Equipo',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.motivo || data.items?.length > 0),
  },

  // ===========================================================================
  // CATEGORY 7: Billing/Collections Forms (standard level)
  // ===========================================================================
  {
    id: 'registrar-pago',
    storageKey: 'facturacion_registrar_pago',
    moduleName: 'Registro de Pago',
    resumePath: '/facturacion',
    isMeaningful: (data) => data && (data.monto || data.tipo_pago),
  },
  {
    id: 'seguimiento-cobranza',
    storageKey: 'cobranza_seguimiento',
    moduleName: 'Seguimiento de Cobranza',
    resumePath: '/facturacion',
    isMeaningful: (data) => data && (data.notas || data.tipo_accion),
  },
  {
    id: 'promesa-pago',
    storageKey: 'promesa_pago',
    moduleName: 'Promesa de Pago',
    resumePath: '/facturacion',
    isMeaningful: (data) => data && (data.fecha_promesa || data.monto_prometido),
  },

  // ===========================================================================
  // CATEGORY 8: Planning Forms (standard/light level)
  // ===========================================================================
  {
    id: 'price-matrix-import',
    storageKey: 'price_matrix_import',
    moduleName: 'Importación de Matriz',
    resumePath: '/planeacion',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.columns?.length > 0 || d.mapping);
    },
    previewText: 'Continúa la importación Excel',
  },
  {
    id: 'meeting-points-config',
    storageKey: 'meeting_points_config',
    moduleName: 'Puntos de Encuentro',
    resumePath: '/planeacion/configuracion',
    isMeaningful: (data) => data && data.points?.length > 0,
  },
  {
    id: 'registrar-pago-armado',
    storageKey: 'registrar_pago_armado',
    moduleName: 'Pago a Armado',
    resumePath: '/planeacion/configuracion',
    isMeaningful: (data) => data && (data.monto || data.concepto),
  },
  {
    id: 'pending-assignment',
    storageKey: 'pending_assignment',
    moduleName: 'Asignación Pendiente',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && (data.custodio_id || data.armado_id),
  },
  {
    id: 'edit-service',
    storageKey: 'edit_service',
    moduleName: 'Editar Servicio',
    resumePath: '/planeacion',
    isMeaningful: (data) => data && Object.keys(data).length > 0,
  },

  // ===========================================================================
  // CATEGORY 9: LMS Forms (standard/light level)
  // ===========================================================================
  {
    id: 'lms-curso-form',
    storageKey: 'lms_curso_form',
    moduleName: 'Formulario de Curso',
    resumePath: '/lms/admin',
    isMeaningful: (data) => data && (data.titulo || data.descripcion),
  },
  {
    id: 'lms-modulo-form',
    storageKey: 'lms_modulo_form',
    moduleName: 'Formulario de Módulo',
    resumePath: '/lms/admin',
    isMeaningful: (data) => data && (data.titulo || data.contenido),
  },

  // ===========================================================================
  // CATEGORY 10: Liberación/Onboarding
  // ===========================================================================
  {
    id: 'liberacion-checklist',
    storageKey: 'liberacion_checklist',
    moduleName: 'Liberación de Custodio',
    resumePath: '/leads/liberacion',
    isMeaningful: (data) => {
      const d = data?.data || data;
      const lib = d?.liberacion;
      return lib && (
        lib.documentacion_ine ||
        lib.documentacion_licencia ||
        lib.psicometricos_completado ||
        lib.toxicologicos_completado ||
        lib.vehiculo_capturado ||
        lib.instalacion_gps_completado
      );
    },
    previewText: 'Continúa el checklist de liberación',
  },
];

interface DraftResumeContextType {
  getActiveDrafts: () => DraftInfo[];
  getMostRecentDraft: () => DraftInfo | null;
  clearDraft: (storageKey: string) => void;
  getDraftCatalog: () => DraftInfo[];
  getDraftByKey: (storageKey: string) => DraftInfo | undefined;
}

const DraftResumeContext = createContext<DraftResumeContextType | undefined>(undefined);

export function DraftResumeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const getDraftCatalog = useCallback((): DraftInfo[] => {
    return DRAFT_CATALOG;
  }, []);

  const getDraftByKey = useCallback((storageKey: string): DraftInfo | undefined => {
    return DRAFT_CATALOG.find(d => d.storageKey === storageKey);
  }, []);

  const getActiveDrafts = useCallback((): DraftInfo[] => {
    const activeDrafts: DraftInfo[] = [];
    
    DRAFT_CATALOG.forEach((info) => {
      try {
        const userSpecificKey = user ? `${info.storageKey}_${user.id}` : info.storageKey;
        const stored = localStorage.getItem(userSpecificKey);
        
        // Also check sessionStorage backup
        const sessionBackup = sessionStorage.getItem(`${userSpecificKey}_session_backup`);
        const finalStored = stored || sessionBackup;
        
        if (finalStored) {
          const parsed = JSON.parse(finalStored);
          const data = parsed.data || parsed;
          
          if (info.isMeaningful(data)) {
            activeDrafts.push({
              ...info,
              lastModified: parsed.timestamp || parsed.savedAt ? new Date(parsed.savedAt).getTime() : Date.now(),
            });
          }
        }
      } catch (error) {
        console.error('Error checking draft:', info.storageKey, error);
      }
    });

    return activeDrafts.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
  }, [user]);

  const getMostRecentDraft = useCallback((): DraftInfo | null => {
    const drafts = getActiveDrafts();
    return drafts.length > 0 ? drafts[0] : null;
  }, [getActiveDrafts]);

  const clearDraft = useCallback((storageKey: string) => {
    try {
      const userSpecificKey = user ? `${storageKey}_${user.id}` : storageKey;
      localStorage.removeItem(userSpecificKey);
      sessionStorage.removeItem(`${userSpecificKey}_session_backup`);
      console.log('🗑️ Draft cleared:', userSpecificKey);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [user]);

  return (
    <DraftResumeContext.Provider
      value={{
        getActiveDrafts,
        getMostRecentDraft,
        clearDraft,
        getDraftCatalog,
        getDraftByKey,
      }}
    >
      {children}
    </DraftResumeContext.Provider>
  );
}

export function useDraftResume() {
  const context = useContext(DraftResumeContext);
  if (!context) {
    throw new Error('useDraftResume must be used within DraftResumeProvider');
  }
  return context;
}
