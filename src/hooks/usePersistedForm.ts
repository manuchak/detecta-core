import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PersistedFormOptions<T> {
  key: string;
  initialData: T;
  ttl?: number; // Time to live in milliseconds (default: 24 hours)
  autoSaveInterval?: number; // Auto-save interval in milliseconds (default: 30 seconds)
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
  ttl = 24 * 60 * 60 * 1000, // 24 hours
  autoSaveInterval = 30000, // 30 seconds
  onRestore,
  onSave,
}: PersistedFormOptions<T>) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<T>(initialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  const storageKey = user ? `${key}_${user.id}` : key;

  // Load persisted data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);
        
        // Check if data is still valid (within TTL)
        const now = Date.now();
        if (now - parsed.timestamp < ttl && parsed.userId === user?.id) {
          setHasDraft(true);
          setLastSaved(new Date(parsed.timestamp));
        } else {
          // Data expired, remove it
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Error loading persisted form data:', error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, ttl, user?.id]);

  // Auto-save function
  const saveToStorage = useCallback((data: T, silent = false) => {
    try {
      const persistedData: PersistedData<T> = {
        data,
        timestamp: Date.now(),
        userId: user?.id || '',
      };
      localStorage.setItem(storageKey, JSON.stringify(persistedData));
      const savedTime = new Date();
      setLastSaved(savedTime);
      setHasDraft(true);
      hasChangesRef.current = false;
      
      if (!silent && onSave) {
        onSave(data);
      }
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [storageKey, user?.id, onSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        if (hasChangesRef.current) {
          saveToStorage(formData, true);
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, formData, saveToStorage]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedData<T> = JSON.parse(stored);
        setFormData(parsed.data);
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
    saveToStorage(formData, false);
  }, [formData, saveToStorage]);

  // Update form data and mark as changed
  const updateFormData = useCallback((data: T | ((prev: T) => T)) => {
    setFormData(prev => {
      const newData = typeof data === 'function' ? (data as (prev: T) => T)(prev) : data;
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
