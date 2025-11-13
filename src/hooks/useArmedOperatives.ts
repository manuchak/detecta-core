import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArmedOperative {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  zona_base?: string;
  disponibilidad: string;
  estado: string;
  tipo_armado: 'interno' | 'externo';
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  experiencia_anos: number;
  rating_promedio: number;
  numero_servicios: number;
  equipamiento_disponible?: string[];
  verificacion_pendiente?: boolean;
  origen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateArmedOperativeData {
  nombre: string;
  telefono?: string;
  email?: string;
  zona_base: string;
  licencia_portacion?: string;
  fecha_vencimiento_licencia?: string;
  experiencia_anos?: number;
  equipamiento_disponible?: string[];
  origen?: string;
}

export function useArmedOperatives() {
  const [operatives, setOperatives] = useState<ArmedOperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOperatives = async (filters?: { verificacion_pendiente?: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('armados_operativos')
        .select('*')
        .eq('tipo_armado', 'interno')
        .order('nombre');

      if (filters?.verificacion_pendiente !== undefined) {
        query = query.eq('verificacion_pendiente', filters.verificacion_pendiente);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setOperatives(data || []);
    } catch (err: any) {
      console.error('Error loading armed operatives:', err);
      setError(err.message);
      toast.error('Error al cargar armados internos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperatives();
  }, []);

  const createOperative = async (operativeData: CreateArmedOperativeData): Promise<ArmedOperative | null> => {
    try {
      // Check for duplicates by name and phone
      const { data: existing } = await supabase
        .from('armados_operativos')
        .select('id, nombre, telefono')
        .eq('nombre', operativeData.nombre)
        .eq('tipo_armado', 'interno')
        .maybeSingle();

      if (existing) {
        toast.error(`Ya existe un armado con el nombre "${operativeData.nombre}"`);
        return null;
      }

      const newOperative = {
        ...operativeData,
        tipo_armado: 'interno' as const,
        estado: 'activo',
        disponibilidad: 'disponible',
        experiencia_anos: operativeData.experiencia_anos || 0,
        rating_promedio: 3.0,
        numero_servicios: 0,
        score_total: 50,
        score_disponibilidad: 50,
        score_desempeno: 50,
        tasa_respuesta: 100,
        tasa_confirmacion: 100,
        verificacion_pendiente: true,
        origen: operativeData.origen || 'registro_rapido'
      };

      const { data, error: insertError } = await supabase
        .from('armados_operativos')
        .insert([newOperative])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`Armado "${operativeData.nombre}" registrado exitosamente`);
      await loadOperatives();
      return data;
    } catch (err: any) {
      console.error('Error creating armed operative:', err);
      toast.error('Error al registrar armado');
      return null;
    }
  };

  const updateOperative = async (id: string, updates: Partial<ArmedOperative>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('armados_operativos')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Armado actualizado exitosamente');
      await loadOperatives();
      return true;
    } catch (err: any) {
      console.error('Error updating armed operative:', err);
      toast.error('Error al actualizar armado');
      return false;
    }
  };

  const completeVerification = async (
    id: string, 
    completeData: {
      licencia_portacion?: string;
      fecha_vencimiento_licencia?: string;
      experiencia_anos?: number;
      equipamiento_disponible?: string[];
      email?: string;
    }
  ): Promise<boolean> => {
    try {
      const updates = {
        ...completeData,
        verificacion_pendiente: false
      };

      const { error: updateError } = await supabase
        .from('armados_operativos')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Verificación completada exitosamente');
      await loadOperatives();
      return true;
    } catch (err: any) {
      console.error('Error completing verification:', err);
      toast.error('Error al completar verificación');
      return false;
    }
  };

  const getAssignmentCount = async (armedId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('asignacion_armados')
        .select('*', { count: 'exact', head: true })
        .eq('armado_id', armedId);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting assignment count:', err);
      return 0;
    }
  };

  const getPendingOperatives = async (): Promise<ArmedOperative[]> => {
    try {
      const { data, error } = await supabase
        .from('armados_operativos')
        .select('*')
        .eq('tipo_armado', 'interno')
        .eq('verificacion_pendiente', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching pending operatives:', err);
      return [];
    }
  };

  return {
    operatives,
    loading,
    error,
    createOperative,
    updateOperative,
    completeVerification,
    getAssignmentCount,
    getPendingOperatives,
    refetch: loadOperatives
  };
}
