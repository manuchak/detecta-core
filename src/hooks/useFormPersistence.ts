import { useState, useEffect, useCallback, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type PersistenceLevel = 'light' | 'standard' | 'robust';

export interface FormPersistenceOptions<T extends FieldValues> {
  /** Unique key for localStorage */
  key: string;
  
  /** Initial/default data for the form */
  initialData: T;
  
  /** Persistence level - determines which features are enabled */
  level?: PersistenceLevel;
  
  /** Enable/disable persistence (useful for conditional persistence) */
  enabled?: boolean;
  
  /** Time-to-live in milliseconds (default: 24 hours) */
  ttl?: number;
  
  /** Debounce delay for autosave in ms (default: 800ms) */
  debounceMs?: number;
  
  /** Check if the current data has meaningful content worth saving */
  isMeaningful?: (data: T) => boolean;
  
  /** Validate and clean up inconsistent state during restore */
  validateConsistency?: (data: T) => T;
  
  /** Callback when data is restored from storage */
  onRestore?: (data: T) => void;
  
  /** Callback when data is saved */
  onSave?: (data: T) => void;
  
  /** Optional react-hook-form instance for automatic sync */
  form?: UseFormReturn<T>;
  
  /** Enable URL parameter for draft ID (robust level only) */
  enableUrlParams?: boolean;
  
  /** Calculate progress score for comparing drafts (robust level only) */
  calculateProgress?: (data: T) => number;
}

export interface FormPersistenceReturn<T> {
  /** Current persisted data */
  data: T;
  
  /** Update the data (triggers autosave based on level) */
  updateData: (updates: Partial<T>) => void;
  
  /** Replace all data */
  setData: (data: T) => void;
  
  /** Whether a draft exists in storage */
  hasDraft: boolean;
  
  /** Whether there are unsaved changes since last save */
  hasUnsavedChanges: boolean;
  
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  
  /** Manually trigger a save */
  saveDraft: () => void;
  
  /** Restore data from storage, returns the restored data or null */
  restoreDraft: () => T | null;
  
  /** Clear the draft from storage */
  clearDraft: (hard?: boolean) => void;
  
  /** Get human-readable time since last save */
  getTimeSinceSave: () => string;
  
  /** Show confirmation dialog before discarding changes */
  confirmDiscard: () => Promise<boolean>;
  
  /** Draft ID for URL tracking (robust level) */
  draftId: string | null;
  
  /** Progress score (robust level) */
  progressScore: number;
}

interface StoredDraft<T> {
  data: T;
  savedAt: string;
  draftId?: string;
  progressScore?: number;
  version: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_VERSION = 1;
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_DEBOUNCE = 800; // ms

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateDraftId(): string {
  return `${crypto.randomUUID()}`;
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 120) return 'hace 1 minuto';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} minutos`;
  if (seconds < 7200) return 'hace 1 hora';
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} horas`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

function isExpired(savedAt: string, ttl: number): boolean {
  const savedDate = new Date(savedAt);
  return Date.now() - savedDate.getTime() > ttl;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => 
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useFormPersistence<T extends FieldValues>(
  options: FormPersistenceOptions<T>
): FormPersistenceReturn<T> {
  const {
    key,
    initialData,
    level = 'light',
    enabled = true,
    ttl = DEFAULT_TTL,
    debounceMs = DEFAULT_DEBOUNCE,
    isMeaningful = () => true,
    validateConsistency = (data) => data,
    onRestore,
    onSave,
    form,
    enableUrlParams = level === 'robust',
    calculateProgress = () => 0,
  } = options;

  // State
  const [data, setDataInternal] = useState<T>(initialData);
  const [hasDraft, setHasDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [progressScore, setProgressScore] = useState(0);
  
  // Refs for avoiding stale closures
  const dataRef = useRef(data);
  const initialDataRef = useRef(initialData);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    dataRef.current = data;
    setProgressScore(calculateProgress(data));
  }, [data, calculateProgress]);

  // ==========================================================================
  // STORAGE OPERATIONS
  // ==========================================================================

  const loadFromStorage = useCallback((): StoredDraft<T> | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed: StoredDraft<T> = JSON.parse(stored);
      
      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        localStorage.removeItem(key);
        return null;
      }
      
      // Check TTL
      if (isExpired(parsed.savedAt, ttl)) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed;
    } catch (e) {
      console.warn(`[useFormPersistence] Failed to load draft for key "${key}":`, e);
      return null;
    }
  }, [key, ttl]);

  const saveToStorage = useCallback((dataToSave: T, forceDraftId?: string) => {
    if (!enabled || !isMeaningful(dataToSave)) {
      return;
    }
    
    try {
      const currentDraftId = forceDraftId || draftId || generateDraftId();
      const draft: StoredDraft<T> = {
        data: dataToSave,
        savedAt: new Date().toISOString(),
        draftId: currentDraftId,
        progressScore: calculateProgress(dataToSave),
        version: STORAGE_VERSION,
      };
      
      localStorage.setItem(key, JSON.stringify(draft));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setHasDraft(true);
      
      if (!draftId) {
        setDraftId(currentDraftId);
      }
      
      onSave?.(dataToSave);
      
      // Update URL if robust level with URL params
      if (enableUrlParams && level === 'robust') {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('draft')) {
          url.searchParams.set('draft', currentDraftId);
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) {
      console.warn(`[useFormPersistence] Failed to save draft for key "${key}":`, e);
    }
  }, [key, draftId, isMeaningful, onSave, enableUrlParams, level, calculateProgress]);

  const clearFromStorage = useCallback((hard = false) => {
    try {
      localStorage.removeItem(key);
      setHasDraft(false);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      
      if (hard) {
        setDraftId(null);
        setDataInternal(initialDataRef.current);
        
        // Clear URL param if robust
        if (enableUrlParams && level === 'robust') {
          const url = new URL(window.location.href);
          url.searchParams.delete('draft');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) {
      console.warn(`[useFormPersistence] Failed to clear draft for key "${key}":`, e);
    }
  }, [key, enableUrlParams, level]);

  // ==========================================================================
  // DEBOUNCED SAVE
  // ==========================================================================

  const scheduleSave = useCallback((dataToSave: T) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setHasUnsavedChanges(true);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(dataToSave);
    }, debounceMs);
  }, [debounceMs, saveToStorage]);

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  const updateData = useCallback((updates: Partial<T>) => {
    const newData = { ...dataRef.current, ...updates };
    setDataInternal(newData);
    scheduleSave(newData);
  }, [scheduleSave]);

  const setData = useCallback((newData: T) => {
    setDataInternal(newData);
    scheduleSave(newData);
  }, [scheduleSave]);

  const saveDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveToStorage(dataRef.current);
  }, [saveToStorage]);

  const restoreDraft = useCallback((): T | null => {
    if (!enabled) return null;
    
    const stored = loadFromStorage();
    if (stored) {
      const validatedData = validateConsistency(stored.data);
      setDataInternal(validatedData);
      setDraftId(stored.draftId || null);
      setLastSaved(new Date(stored.savedAt));
      setHasDraft(true);
      setHasUnsavedChanges(false);
      
      // Sync with react-hook-form if provided
      if (form) {
        form.reset(validatedData);
      }
      
      onRestore?.(validatedData);
      return validatedData;
    }
    return null;
  }, [enabled, loadFromStorage, validateConsistency, form, onRestore]);

  const clearDraft = useCallback((hard = false) => {
    clearFromStorage(hard);
    
    if (hard && form) {
      form.reset(initialDataRef.current);
    }
  }, [clearFromStorage, form]);

  const getTimeSinceSave = useCallback(() => {
    if (!lastSaved) return '';
    return getTimeSince(lastSaved);
  }, [lastSaved]);

  const confirmDiscard = useCallback(async (): Promise<boolean> => {
    if (!hasUnsavedChanges && !hasDraft) return true;
    
    // Check if data is meaningfully different from initial
    if (deepEqual(dataRef.current, initialDataRef.current)) {
      return true;
    }
    
    return window.confirm(
      '¿Estás seguro de que deseas descartar los cambios? Los datos no guardados se perderán.'
    );
  }, [hasUnsavedChanges, hasDraft]);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Check for existing draft
    const stored = loadFromStorage();
    
    if (stored) {
      // For robust level with URL params, check if URL draft matches
      if (enableUrlParams && level === 'robust') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlDraftId = urlParams.get('draft');
        
        if (urlDraftId && stored.draftId && urlDraftId !== stored.draftId) {
          // URL draft doesn't match stored draft, prefer URL
          // In a real scenario, you might fetch from server or handle differently
          console.log('[useFormPersistence] URL draft ID mismatch, using stored draft');
        }
      }
      
      setHasDraft(true);
      setLastSaved(new Date(stored.savedAt));
      setDraftId(stored.draftId || null);
      setProgressScore(stored.progressScore || 0);
      
      // Auto-restore for standard and robust levels
      if (level !== 'light') {
        const validatedData = validateConsistency(stored.data);
        setDataInternal(validatedData);
        
        if (form) {
          form.reset(validatedData);
        }
        
        onRestore?.(validatedData);
      }
    }
  }, [loadFromStorage, validateConsistency, form, onRestore, enableUrlParams, level]);

  // ==========================================================================
  // REACT-HOOK-FORM SYNC
  // ==========================================================================

  useEffect(() => {
    if (!form) return;

    const subscription = form.watch((formData) => {
      if (formData && Object.keys(formData).length > 0) {
        const newData = formData as T;
        dataRef.current = newData;
        setDataInternal(newData);
        scheduleSave(newData);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, scheduleSave]);

  // ==========================================================================
  // EVENT HANDLERS (standard + robust levels)
  // ==========================================================================

  useEffect(() => {
    if (level === 'light') return;

    // Save on visibility change (tab hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveToStorage(dataRef.current);
      }
    };

    // Save on page hide (mobile, navigation)
    const handlePageHide = () => {
      if (hasUnsavedChanges) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveToStorage(dataRef.current);
      }
    };

    // Warn on beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
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
  }, [level, hasUnsavedChanges, saveToStorage]);

  // ==========================================================================
  // RECONCILIATION ON TAB FOCUS (standard + robust levels)
  // ==========================================================================

  useEffect(() => {
    if (level === 'light') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const stored = loadFromStorage();
        
        if (stored) {
          const storedScore = stored.progressScore || 0;
          const currentScore = calculateProgress(dataRef.current);
          
          // If stored draft has more progress, offer to restore
          if (storedScore > currentScore) {
            const restored = window.confirm(
              'Se encontró un borrador con más progreso. ¿Deseas restaurarlo?'
            );
            
            if (restored) {
              const validatedData = validateConsistency(stored.data);
              setDataInternal(validatedData);
              
              if (form) {
                form.reset(validatedData);
              }
              
              onRestore?.(validatedData);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [level, loadFromStorage, validateConsistency, form, onRestore, calculateProgress]);

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    data,
    updateData,
    setData,
    hasDraft,
    hasUnsavedChanges,
    lastSaved,
    saveDraft,
    restoreDraft,
    clearDraft,
    getTimeSinceSave,
    confirmDiscard,
    draftId,
    progressScore,
  };
}

export default useFormPersistence;
