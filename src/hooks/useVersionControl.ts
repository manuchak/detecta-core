import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SystemVersion {
  id: string;
  version_number: string;
  version_name?: string;
  release_date: string;
  version_type: 'major' | 'minor' | 'patch' | 'hotfix';
  status: 'planning' | 'development' | 'testing' | 'released' | 'deprecated';
  description?: string;
  release_notes?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemChange {
  id: string;
  version_id: string;
  change_type: 'feature' | 'bugfix' | 'enhancement' | 'breaking_change' | 'security';
  module: string;
  title: string;
  description?: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  technical_details?: string;
  affected_components?: string[];
  rollback_plan?: string;
  testing_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureRelease {
  id: string;
  version_id: string;
  feature_name: string;
  feature_description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completion_status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  due_date?: string;
  completion_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

export const useVersionControl = () => {
  const queryClient = useQueryClient();

  // Get all versions
  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['system-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SystemVersion[];
    },
  });

  // Get changes for a version
  const getVersionChanges = (versionId: string) => {
    return useQuery({
      queryKey: ['system-changes', versionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('system_changes')
          .select('*')
          .eq('version_id', versionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SystemChange[];
      },
      enabled: !!versionId,
    });
  };

  // Get features for a version
  const getVersionFeatures = (versionId: string) => {
    return useQuery({
      queryKey: ['feature-releases', versionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('feature_releases')
          .select('*')
          .eq('version_id', versionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as FeatureRelease[];
      },
      enabled: !!versionId,
    });
  };

  // Create new version
  const createVersion = useMutation({
    mutationFn: async (version: Omit<SystemVersion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_versions')
        .insert(version)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-versions'] });
      toast({
        title: "Éxito",
        description: "Versión creada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la versión",
        variant: "destructive",
      });
    },
  });

  // Update version
  const updateVersion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemVersion> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_versions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-versions'] });
      toast({
        title: "Éxito",
        description: "Versión actualizada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la versión",
        variant: "destructive",
      });
    },
  });

  // Create change
  const createChange = useMutation({
    mutationFn: async (change: Omit<SystemChange, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('system_changes')
        .insert(change)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-changes', variables.version_id] });
      toast({
        title: "Éxito",
        description: "Cambio registrado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el cambio",
        variant: "destructive",
      });
    },
  });

  // Create feature
  const createFeature = useMutation({
    mutationFn: async (feature: Omit<FeatureRelease, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('feature_releases')
        .insert(feature)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature-releases', variables.version_id] });
      toast({
        title: "Éxito",
        description: "Feature registrada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar la feature",
        variant: "destructive",
      });
    },
  });

  return {
    versions,
    versionsLoading,
    getVersionChanges,
    getVersionFeatures,
    createVersion,
    updateVersion,
    createChange,
    createFeature,
  };
};