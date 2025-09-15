import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  interval?: number; // Auto-save interval in milliseconds (default: 10 seconds)
  leadId: string;
  onAutoSave?: (data: Record<string, any>) => void;
  onRecover?: (data: Record<string, any>) => void;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export const useAutoSaveForm = (options: AutoSaveOptions) => {
  const { interval = 10000, leadId, onAutoSave, onRecover } = options;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('{}');
  const isInitializedRef = useRef(false);

  // Debounced update function
  const updateFormData = useCallback((key: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      const newDataStr = JSON.stringify(newData);
      
      // Mark as having unsaved changes only if data actually changed
      if (newDataStr !== lastSavedDataRef.current) {
        setAutoSaveState(prevState => ({ 
          ...prevState, 
          hasUnsavedChanges: true 
        }));
      }
      
      return newData;
    });
  }, []);

  // Save progress to database
  const saveProgress = useCallback(async (data: Record<string, any>) => {
    if (!data || Object.keys(data).length === 0) return false;

    const dataStr = JSON.stringify(data);
    if (dataStr === lastSavedDataRef.current) return false; // No changes

    setAutoSaveState(prev => ({ ...prev, isSaving: true }));

    try {
      const { error } = await supabase
        .from('interview_progress')
        .upsert({
          lead_id: leadId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          progress_data: data,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }, {
          onConflict: 'lead_id,user_id'
        });

      if (error) throw error;

      lastSavedDataRef.current = dataStr;
      setAutoSaveState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));

      onAutoSave?.(data);
      return true;
    } catch (error) {
      console.error('Error auto-saving:', error);
      setAutoSaveState(prev => ({ ...prev, isSaving: false }));
      
      // Show discrete error notification
      toast({
        title: "Auto-guardado falló",
        description: "No se pudo guardar automáticamente el progreso",
        variant: "destructive",
      });
      return false;
    }
  }, [leadId, onAutoSave, toast]);

  // Recover saved progress
  const recoverProgress = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('interview_progress')
        .select('progress_data, updated_at')
        .eq('lead_id', leadId)
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      const recoveredData = data.progress_data || {};
      if (Object.keys(recoveredData).length > 0) {
        setFormData(recoveredData);
        lastSavedDataRef.current = JSON.stringify(recoveredData);
        setAutoSaveState(prev => ({ 
          ...prev, 
          lastSaved: new Date(data.updated_at),
          hasUnsavedChanges: false
        }));
        
        onRecover?.(recoveredData);
        return recoveredData;
      }
      
      return null;
    } catch (error) {
      console.error('Error recovering progress:', error);
      return null;
    }
  }, [leadId, onRecover]);

  // Clear saved progress
  const clearProgress = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('interview_progress')
        .delete()
        .eq('lead_id', leadId)
        .eq('user_id', user.user.id);

      setFormData({});
      lastSavedDataRef.current = '{}';
      setAutoSaveState({
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }, [leadId]);

  // Auto-save effect
  useEffect(() => {
    if (!isInitializedRef.current) return;

    intervalRef.current = setInterval(() => {
      if (autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving) {
        saveProgress(formData);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [formData, autoSaveState.hasUnsavedChanges, autoSaveState.isSaving, interval, saveProgress]);

  // Initialize and recover on mount
  useEffect(() => {
    const initialize = async () => {
      await recoverProgress();
      isInitializedRef.current = true;
    };
    
    initialize();
  }, [recoverProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    formData,
    updateFormData,
    saveProgress: () => saveProgress(formData),
    recoverProgress,
    clearProgress,
    autoSaveState,
  };
};