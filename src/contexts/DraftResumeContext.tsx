import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface DraftInfo {
  storageKey: string;
  moduleName: string;
  resumePath: string;
  isMeaningful: (data: any) => boolean;
  lastModified?: number;
  previewText?: string;
}

interface DraftResumeContextType {
  registerDraft: (info: DraftInfo) => void;
  unregisterDraft: (storageKey: string) => void;
  getActiveDrafts: () => DraftInfo[];
  getMostRecentDraft: () => DraftInfo | null;
  clearDraft: (storageKey: string) => void;
}

const DraftResumeContext = createContext<DraftResumeContextType | undefined>(undefined);

export function DraftResumeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [registeredDrafts, setRegisteredDrafts] = useState<Map<string, DraftInfo>>(new Map());

  const registerDraft = useCallback((info: DraftInfo) => {
    setRegisteredDrafts(prev => {
      const newMap = new Map(prev);
      newMap.set(info.storageKey, info);
      return newMap;
    });
    console.log('📝 Draft registered:', info.moduleName);
  }, []);

  const unregisterDraft = useCallback((storageKey: string) => {
    setRegisteredDrafts(prev => {
      const newMap = new Map(prev);
      newMap.delete(storageKey);
      return newMap;
    });
    console.log('🗑️ Draft unregistered:', storageKey);
  }, []);

  const getActiveDrafts = useCallback((): DraftInfo[] => {
    const activeDrafts: DraftInfo[] = [];
    
    registeredDrafts.forEach((info) => {
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
  }, [registeredDrafts, user]);

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
        registerDraft,
        unregisterDraft,
        getActiveDrafts,
        getMostRecentDraft,
        clearDraft,
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
