import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from './useUnifiedAuth';
import { Lead, LeadEstado } from '@/types/leadTypes';

interface LeadsState {
  leads: Lead[];
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  canAccess: boolean;
  accessReason: string;
}

export const useLeadsUnified = () => {
  const [state, setState] = useState<LeadsState>({
    leads: [],
    isLoading: true,
    error: null,
    isEmpty: false,
    canAccess: false,
    accessReason: 'Verificando permisos...',
  });

  const { user, userRole, permissions, loading: authLoading } = useUnifiedAuth();
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const queryExecutedRef = useRef(false);

  // Función para determinar acceso de manera determinista
  const determineAccess = useCallback(() => {
    if (authLoading) {
      return {
        canAccess: false,
        accessReason: 'Verificando autenticación...',
      };
    }

    if (!user) {
      return {
        canAccess: false,
        accessReason: 'Debes iniciar sesión para acceder a los candidatos.',
      };
    }

    if (!userRole) {
      return {
        canAccess: false,
        accessReason: 'Verificando permisos de usuario...',
      };
    }

    if (!permissions.canViewLeads) {
      return {
        canAccess: false,
        accessReason: `Tu rol '${userRole}' no tiene permisos para ver candidatos. Contacta al administrador si necesitas acceso.`,
      };
    }

    return {
      canAccess: true,
      accessReason: 'Acceso autorizado',
    };
  }, [authLoading, user, userRole, permissions.canViewLeads]);

  // Función para obtener leads según el rol
  const fetchLeads = useCallback(async () => {
    if (!mountedRef.current || queryExecutedRef.current) return;

    const accessCheck = determineAccess();
    
    // Actualizar estado inmediatamente con información de acceso
    setState(prev => ({
      ...prev,
      isLoading: true,
      canAccess: accessCheck.canAccess,
      accessReason: accessCheck.accessReason,
      error: null,
    }));

    if (!accessCheck.canAccess) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        leads: [],
        isEmpty: true,
      }));
      return;
    }

    // Marcar query como ejecutada
    queryExecutedRef.current = true;

    try {
      console.log(`📋 Fetching leads for role: ${userRole}`);
      
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Error al cargar candidatos: ${fetchError.message}`);
      }

      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        leads: (data || []).map(lead => ({
          ...lead,
          estado: lead.estado as LeadEstado
        })),
        isLoading: false,
        isEmpty: (data || []).length === 0,
        error: null,
      }));

      console.log(`✅ Loaded ${(data || []).length} leads successfully`);

    } catch (err) {
      console.error('❌ Error fetching leads:', err);
      
      if (!mountedRef.current) return;

      const errorObj = err instanceof Error ? err : new Error('Error desconocido');
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorObj,
        leads: [],
        isEmpty: true,
      }));

      toast({
        title: "Error",
        description: errorObj.message,
        variant: "destructive",
      });
    }
  }, [determineAccess, userRole, toast]);

  // Función para asignar lead
  const assignLead = useCallback(async (leadId: string, analystId: string) => {
    if (!permissions.canEditLeads) {
      throw new Error('No tienes permisos para asignar candidatos');
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          asignado_a: analystId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Refrescar datos después de asignación exitosa
      queryExecutedRef.current = false;
      await fetchLeads();
      
      return { success: true };
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  }, [permissions.canEditLeads, fetchLeads]);

  // Función para actualizar lead
  const updateLead = useCallback(async ({ leadId, updates }: { leadId: string, updates: Partial<Lead> }) => {
    if (!permissions.canEditLeads) {
      throw new Error('No tienes permisos para editar candidatos');
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Refrescar datos después de actualización exitosa
      queryExecutedRef.current = false;
      await fetchLeads();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }, [permissions.canEditLeads, fetchLeads]);

  // Función para crear lead
  const createLead = useCallback(async (leadData: {
    nombre: string;
    email: string;
    telefono?: string;
    estado: string;
    notas?: string;
    empresa?: string;
    fuente?: string;
    mensaje?: string;
  }) => {
    if (!permissions.canEditLeads) {
      throw new Error('No tienes permisos para crear candidatos');
    }

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          fecha_creacion: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refrescar datos después de creación exitosa
      queryExecutedRef.current = false;
      await fetchLeads();
      
      return { success: true };
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }, [permissions.canEditLeads, fetchLeads]);

  // Función para refrescar manualmente
  const refetch = useCallback(() => {
    queryExecutedRef.current = false;
    fetchLeads();
  }, [fetchLeads]);

  // Efecto principal que se ejecuta cuando cambia el estado de autenticación
  useEffect(() => {
    mountedRef.current = true;
    queryExecutedRef.current = false;

    // Setup cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Efecto separado para manejar la carga de datos
  useEffect(() => {
    // Solo ejecutar si la autenticación está lista y no estamos cargando
    if (!authLoading && mountedRef.current) {
      // Pequeño delay para asegurar que el DOM esté listo
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          fetchLeads();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [authLoading, fetchLeads]);


  return {
    // Estado
    ...state,
    
    // Funciones con interface compatible con react-query
    assignLead: { 
      mutateAsync: assignLead, 
      isPending: state.isLoading 
    },
    updateLead: { 
      mutateAsync: updateLead, 
      isPending: state.isLoading 
    },
    createLead: { 
      mutateAsync: createLead, 
      isPending: state.isLoading 
    },
    
    // Función de refrescar
    refetch,
    
    // Información adicional
    permissions,
    userRole,
  };
};