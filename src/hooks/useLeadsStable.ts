// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadEstado } from '@/types/leadTypes';

export const useLeadsStable = (dateFrom?: string, dateTo?: string) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const mountedRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Verificar permisos antes de hacer queries
  const hasAccess = useCallback(() => {
    const allowedRoles = ['admin', 'owner', 'supply_admin', 'ejecutivo_ventas'];
    return user && userRole && allowedRoles.includes(userRole);
  }, [user, userRole]);

  const fetchLeads = useCallback(async () => {
    if (!mountedRef.current || !hasAccess()) {
      console.log('🚫 Fetch cancelled - not mounted or no access');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching leads...');
      
      let query = supabase
        .from('leads')
        .select('*');
      
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lt('created_at', dateTo);
      }
      
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (mountedRef.current) {
        const typedLeads: Lead[] = (data || []).map(lead => ({
          ...lead,
          estado: lead.estado as LeadEstado
        }));
        setLeads(typedLeads);
        console.log(`✅ Loaded ${typedLeads.length} leads`);
      }
    } catch (err) {
      console.error('❌ Error fetching leads:', err);
      if (mountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        toast({
          title: "Error",
          description: "No se pudieron cargar los candidatos.",
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [hasAccess, toast, dateFrom, dateTo]);

  // Función de asignación de leads
  const assignLead = useCallback(async (leadId: string, analystId: string) => {
    if (!mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          asignado_a: analystId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se pudo asignar el lead — posible bloqueo de permisos (RLS)');

      await fetchLeads();
      return { success: true };
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  }, [fetchLeads]);

  // Función de actualización de leads
  const updateLead = useCallback(async ({ leadId, updates }: { leadId: string, updates: Partial<Lead> }) => {
    if (!mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se pudo actualizar el lead — posible bloqueo de permisos (RLS)');

      await fetchLeads();
      return { success: true };
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }, [fetchLeads]);

  // Función de creación de leads
  const createLead = useCallback(async (leadData: {
    nombre: string;
    email: string;
    telefono?: string;
    estado: string;
    notas?: string;
    empresa?: string;
    fuente?: string;
    mensaje?: string;
    last_interview_data?: Record<string, any>;
  }) => {
    if (!mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          fecha_creacion: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se pudo crear el lead — posible bloqueo de permisos (RLS)');

      await fetchLeads();
      return { success: true };
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }, [fetchLeads]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (hasAccess()) {
      fetchTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          fetchLeads();
        }
      }, 100);
    }

    return () => {
      mountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [hasAccess, fetchLeads]);

  return {
    leads,
    isLoading,
    error,
    refetch: fetchLeads,
    assignLead: { 
      mutateAsync: assignLead, 
      isPending: isLoading 
    },
    updateLead: { 
      mutateAsync: updateLead, 
      isPending: isLoading 
    },
    createLead: { 
      mutateAsync: createLead, 
      isPending: isLoading 
    }
  };
};
