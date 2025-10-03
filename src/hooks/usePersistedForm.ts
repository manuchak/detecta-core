import { useState, useEffect, useCallback, useRef } from 'react';
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

interface PersistedFormOptions<T> {
  key: string;
  initialData: T;
  ttl?: number;
  autoSaveInterval?: number;
  saveOnChangeDebounceMs?: number;
  isMeaningfulDraft?: (data: T) => boolean;
  onRestore?: (data: T) => void;
  onSave?: (data: T) => void;
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
  
  // CRITICAL: Sync formDataRef whenever formData state changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const storageKey = user ? `${key}_${user.id}` : key;

  // Load persisted data on mount
  useEffect(() => {
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
  }, [storageKey, ttl, user?.id, isMeaningfulDraft]);

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

  // Save on visibility change, page hide, or before unload - using formDataRef
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasChangesRef.current) {
        console.log('📱 App moving to background - saving immediately');
        saveToStorage(formDataRef.current, true);
      }
    };

    const handlePageHide = () => {
      if (hasChangesRef.current) {
        console.log('👋 Page hiding - saving immediately');
        saveToStorage(formDataRef.current, true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        console.log('🚪 Page unloading - saving immediately');
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
  }, [saveToStorage]);

  // CRITICAL: Save on unmount for SPA navigation
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (hasChangesRef.current) {
        console.log('💾 [usePersistedForm] Component unmounting - performing final save');
        
        // Perform synchronous save on unmount
        try {
          const sanitized = sanitizeDraft(formDataRef.current);
          const persistedData: PersistedData<T> = {
            data: sanitized,
            timestamp: Date.now(),
            userId: user?.id || '',
          };
          
          localStorage.setItem(storageKey, JSON.stringify(persistedData));
          console.log('✅ [usePersistedForm] Unmount save successful');
        } catch (error) {
          console.error('❌ [usePersistedForm] Unmount save failed:', error);
        }
      }
    };
  }, [storageKey, user?.id]);

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
