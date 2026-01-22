import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
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

// Static catalog of all known draft types in the application
const DRAFT_CATALOG: DraftInfo[] = [
  // Service Creation
  {
    id: 'service-creation',
    storageKey: 'service_creation_workflow',
    moduleName: 'Creación de Servicio',
    resumePath: '/planeacion',
    isMeaningful: (data) => {
      return data && (data.routeData || data.serviceData || data.assignmentData);
    },
    previewText: 'Continúa creando tu servicio',
  },
  // Leads
  {
    id: 'lead-form',
    storageKey: 'lead_form_draft',
    moduleName: 'Formulario de Lead',
    resumePath: '/leads',
    isMeaningful: (data) => {
      return data && (data.nombre || data.email || data.telefono);
    },
    previewText: 'Continúa editando el lead',
  },
  // LMS
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
  // WMS - Desecho
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
  // WMS - Devolución RMA
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
  // WMS - Orden de Compra
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
  // Instaladores - Registro
  {
    id: 'installer-registration',
    storageKey: 'installer_registration_form',
    moduleName: 'Registro de Instalador',
    resumePath: '/installers',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.nombre_completo || d.telefono || d.email);
    },
    previewText: 'Continúa el registro de instalador',
  },
  // Instaladores - Programación
  {
    id: 'installer-programacion',
    storageKey: 'installer_programacion',
    moduleName: 'Programación de Instalación',
    resumePath: '/installers',
    isMeaningful: (data) => {
      const d = data?.data || data;
      return d && (d.servicio_id || d.fecha_programada);
    },
    previewText: 'Continúa la programación',
  },
  // Planeación - Importación de Matriz de Precios
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
  // Recruitment - Entrevista Estructurada
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
  // Recruitment - Entrevista Manual de Lead
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
  // Recruitment - Referencias
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
  // Recruitment - Risk Checklist
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
];

interface DraftResumeContextType {
  getActiveDrafts: () => DraftInfo[];
  getMostRecentDraft: () => DraftInfo | null;
  clearDraft: (storageKey: string) => void;
  getDraftCatalog: () => DraftInfo[];
}

const DraftResumeContext = createContext<DraftResumeContextType | undefined>(undefined);

export function DraftResumeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const getDraftCatalog = useCallback((): DraftInfo[] => {
    return DRAFT_CATALOG;
  }, []);

  const getActiveDrafts = useCallback((): DraftInfo[] => {
    const activeDrafts: DraftInfo[] = [];
    
    DRAFT_CATALOG.forEach((info) => {
      try {
        const userSpecificKey = user ? `${info.storageKey}_${user.id}` : info.storageKey;
        const stored = localStorage.getItem(userSpecificKey);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          const data = parsed.data || parsed;
          
          if (info.isMeaningful(data)) {
            activeDrafts.push({
              ...info,
              lastModified: parsed.timestamp || Date.now(),
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
