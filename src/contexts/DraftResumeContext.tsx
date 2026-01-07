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
