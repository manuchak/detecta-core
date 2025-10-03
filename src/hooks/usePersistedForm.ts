import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Sanitizes draft data before persisting to localStorage
 * Removes undefined values and non-serializable objects
 */
const sanitizeDraft = <T,>(data: T): T => {
  if (data === null || data === undefined) return data;
  
  if (typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDraft(item)) as T;
  }
  
  const sanitized: any = {};
  for (const key in data) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      sanitized[key] = sanitizeDraft(value);
    }
  }
  return sanitized;
};

// Utility to compare meaningfulness of two drafts (higher score = more complete)
function compareMeaningfulness<T>(dataA: T, dataB: T): number {
  const scoreA = countDefinedValues(dataA);
  const scoreB = countDefinedValues(dataB);
  return scoreA - scoreB; // positive if A is more complete
}

function countDefinedValues(data: any): number {
  if (data === null || data === undefined) return 0;
  if (typeof data !== 'object') return 1;
  if (Array.isArray(data)) {
    return data.reduce((sum: number, item: any) => sum + countDefinedValues(item), 0);
  }
  return (Object.values(data) as any[]).reduce((sum: number, value: any) => sum + countDefinedValues(value), 0);
}

interface PersistedFormOptions<T> {
  key: string;
  initialData: T;
  ttl?: number;
  autoSaveInterval?: number;
  saveOnChangeDebounceMs?: number;
  isMeaningfulDraft?: (data: T) => boolean;
  onRestore?: (data: T) => void;
  onSave?: (data: T) => void;
  hydrateOnMount?: boolean; // Early hydration before first render
}

interface PersistedData<T> {
  data: T;
  timestamp: number;
  userId: string;
}

export function usePersistedForm<T>({
  key,
  initialData,
  ttl = 24 * 60 * 60 * 1000,
  autoSaveInterval = 10000,
  saveOnChangeDebounceMs = 700,
  isMeaningfulDraft,
  onRestore,
  onSave,
  hydrateOnMount = false,
}: PersistedFormOptions<T>) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<T>(initialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Ref that always holds the latest formData to avoid stale closures
  const formDataRef = useRef<T>(initialData);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const immediateSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);
  const mountedRef = useRef(true);
  const hydratedRef = useRef(false);
  
  // CRITICAL: Sync formDataRef whenever formData state changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const storageKey = user ? `${key}_${user.id}` : key;

  // Early hydration: Load draft BEFORE first render if hydrateOnMount is true
  useLayoutEffect(() => {
    if (!hydrateOnMount || hydratedRef.current) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);
        const now = Date.now();
        
        if (now - parsed.timestamp < ttl && parsed.userId === user?.id) {
          const isMeaningful = isMeaningfulDraft 
            ? isMeaningfulDraft(parsed.data)
            : JSON.stringify(parsed.data) !== JSON.stringify(initialData);
          
          if (isMeaningful) {
            console.log(`🔄 [usePersistedForm] Early hydration (key=${key}):`, parsed.data);
            setFormData(parsed.data);
            formDataRef.current = parsed.data;
            setLastSaved(new Date(parsed.timestamp));
            setHasDraft(true);
            hydratedRef.current = true;
          }
        }
      }
    } catch (error) {
      console.error(`❌ [usePersistedForm] Early hydration failed (key=${key}):`, error);
    }
  }, [storageKey, ttl, user?.id, isMeaningfulDraft, initialData, key, hydrateOnMount]);

  // Load persisted data on mount (skip if hydrateOnMount already loaded it)
  useEffect(() => {
    if (hydrateOnMount && hydratedRef.current) {
      console.log(`⏭️ [usePersistedForm] Skipping mount load (already hydrated, key=${key})`);
      return;
    }
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);
        
        const now = Date.now();
        if (now - parsed.timestamp < ttl && parsed.userId === user?.id) {
          const isMeaningful = isMeaningfulDraft 
            ? isMeaningfulDraft(parsed.data)
            : JSON.stringify(parsed.data) !== JSON.stringify(initialData);
          
          if (isMeaningful) {
            setHasDraft(true);
            setLastSaved(new Date(parsed.timestamp));
          } else {
            localStorage.removeItem(storageKey);
          }
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Error loading persisted form data:', error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, ttl, user?.id, isMeaningfulDraft, hydrateOnMount, key]);

  // Auto-save function with sanitization
  const saveToStorage = useCallback((data: T, silent = false) => {
    try {
      const isMeaningful = isMeaningfulDraft 
        ? isMeaningfulDraft(data)
        : JSON.stringify(data) !== JSON.stringify(initialData);
      
      if (!isMeaningful) {
        return;
      }
      
      const sanitized = sanitizeDraft(data);
      const persistedData: PersistedData<T> = {
        data: sanitized,
        timestamp: Date.now(),
        userId: user?.id || '',
      };
      localStorage.setItem(storageKey, JSON.stringify(persistedData));
      const savedTime = new Date();
      setLastSaved(savedTime);
      setHasDraft(true);
      hasChangesRef.current = false;
      
      if (!silent && onSave) {
        onSave(sanitized);
      }
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [storageKey, user?.id, onSave, isMeaningfulDraft, initialData]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        if (hasChangesRef.current) {
          saveToStorage(formDataRef.current, true);
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, saveToStorage]);

  // Set up immediate save on change with debounce
  useEffect(() => {
    if (saveOnChangeDebounceMs > 0 && hasChangesRef.current) {
      if (immediateSaveTimerRef.current) {
        clearTimeout(immediateSaveTimerRef.current);
      }
      
      immediateSaveTimerRef.current = setTimeout(() => {
        saveToStorage(formDataRef.current, true);
      }, saveOnChangeDebounceMs);

      return () => {
        if (immediateSaveTimerRef.current) {
          clearTimeout(immediateSaveTimerRef.current);
        }
      };
    }
  }, [formData, saveOnChangeDebounceMs, saveToStorage]);

  // Save on visibility change AND reconcile on foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasChangesRef.current) {
        console.log(`📱 [usePersistedForm] App moving to background - saving (key=${key})`);
        saveToStorage(formDataRef.current, true);
      } else if (document.visibilityState === 'visible') {
        // Reconcile: check if storage has a more complete draft
        console.log(`👁️ [usePersistedForm] Tab visible - reconciling (key=${key})`);
        try {
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            const parsed: PersistedData<T> = JSON.parse(stored);
            const now = Date.now();
            
            if (now - parsed.timestamp < ttl && parsed.userId === user?.id) {
              const isMeaningful = isMeaningfulDraft 
                ? isMeaningfulDraft(parsed.data)
                : JSON.stringify(parsed.data) !== JSON.stringify(initialData);
              
              if (isMeaningful) {
                // Compare: is storage more complete than current memory?
                const comparison = compareMeaningfulness(parsed.data, formDataRef.current);
                
                if (comparison > 0) {
                  console.log(`🔄 [usePersistedForm] Storage more complete, rehydrating (key=${key})`);
                  setFormData(parsed.data);
                  formDataRef.current = parsed.data;
                  setLastSaved(new Date(parsed.timestamp));
                  
                  if (onRestore) {
                    onRestore(parsed.data);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ [usePersistedForm] Foreground reconciliation failed (key=${key}):`, error);
        }
      }
    };

    const handlePageHide = () => {
      if (hasChangesRef.current) {
        console.log(`👋 [usePersistedForm] Page hiding - saving (key=${key})`);
        saveToStorage(formDataRef.current, true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        console.log(`🚪 [usePersistedForm] Page unloading - saving (key=${key})`);
        saveToStorage(formDataRef.current, true);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveToStorage, storageKey, ttl, user?.id, isMeaningfulDraft, initialData, onRestore, key]);

  // CRITICAL: Safe save on unmount - only save if meaningful AND more complete
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (hasChangesRef.current) {
        console.log(`💾 [usePersistedForm] Component unmounting - checking save (key=${key})`);
        
        try {
          const current = formDataRef.current;
          
          // 1. Check if current draft is meaningful
          const isMeaningful = isMeaningfulDraft 
            ? isMeaningfulDraft(current)
            : JSON.stringify(current) !== JSON.stringify(initialData);
          
          if (!isMeaningful) {
            console.log(`🚫 [usePersistedForm] Unmount save skipped - not meaningful (key=${key})`);
            return;
          }
          
          // 2. Read existing draft from storage
          const stored = localStorage.getItem(storageKey);
          
          if (stored) {
            const parsed: PersistedData<T> = JSON.parse(stored);
            
            // 3. Compare: only save if current is more complete
            const comparison = compareMeaningfulness(current, parsed.data);
            
            if (comparison <= 0) {
              console.log(`⏭️ [usePersistedForm] Unmount save skipped - existing is more/equally complete (key=${key})`);
              return;
            }
          }
          
          // 4. Current is meaningful and more complete - save it
          const sanitized = sanitizeDraft(current);
          const persistedData: PersistedData<T> = {
            data: sanitized,
            timestamp: Date.now(),
            userId: user?.id || '',
          };
          
          localStorage.setItem(storageKey, JSON.stringify(persistedData));
          console.log(`✅ [usePersistedForm] Unmount save successful (key=${key})`);
        } catch (error) {
          console.error(`❌ [usePersistedForm] Unmount save failed (key=${key}):`, error);
        }
      }
    };
  }, [storageKey, user?.id, isMeaningfulDraft, initialData, key]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);
        setFormData(parsed.data);
        formDataRef.current = parsed.data;
        setIsRestoring(true);
        
        if (onRestore) {
          onRestore(parsed.data);
        }
        
        setTimeout(() => setIsRestoring(false), 100);
      }
    } catch (error) {
      console.error('Error restoring draft:', error);
    }
  }, [storageKey, onRestore]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (immediateSaveTimerRef.current) {
        clearTimeout(immediateSaveTimerRef.current);
      }
      
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
      hasChangesRef.current = false;
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [storageKey]);

  // Manual save
  const saveDraft = useCallback(() => {
    saveToStorage(formDataRef.current, false);
  }, [saveToStorage]);

  // Update form data and mark as changed - keeping ref in sync
  const updateFormData = useCallback((data: T | ((prev: T) => T)) => {
    setFormData(prev => {
      const newData = typeof data === 'function' ? (data as (prev: T) => T)(prev) : data;
      formDataRef.current = newData;
      hasChangesRef.current = true;
      return newData;
    });
  }, []);

  // Get time since last save
  const getTimeSinceSave = useCallback(() => {
    if (!lastSaved) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'hace unos segundos';
    if (diffMins === 1) return 'hace 1 minuto';
    if (diffMins < 60) return `hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'hace 1 hora';
    if (diffHours < 24) return `hace ${diffHours} horas`;
    
    return lastSaved.toLocaleDateString();
  }, [lastSaved]);

  return {
    formData,
    updateFormData,
    hasDraft,
    lastSaved,
    isRestoring,
    restoreDraft,
    clearDraft,
    saveDraft,
    getTimeSinceSave,
  };
}
