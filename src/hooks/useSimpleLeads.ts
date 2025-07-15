import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types/leadTypes';

export const useSimpleLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { toast } = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Función para cargar datos que se ejecuta cuando cambia refreshTrigger
  const fetchLeads = useCallback(async () => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    setError(null);
    console.log(`📋 SimpleLeads: Fetching leads...`);

    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (mounted.current) {
        setLeads(data || []);
        setIsLoading(false);
        console.log(`✅ SimpleLeads: Loaded ${(data || []).length} leads`);
      }
    } catch (err) {
      console.error('❌ SimpleLeads: Error:', err);
      if (mounted.current) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setIsLoading(false);
        toast({
          title: "Error",
          description: "No se pudieron cargar los candidatos",
          variant: "destructive",
        });
      }
    }
  }, [mounted, toast]);

  // useEffect que se ejecuta al montar y cuando cambia refreshTrigger
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshTrigger]);

  // Función para refrescar que incrementa el trigger
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    leads,
    isLoading,
    error,
    canAccess: true, // Simplificado para evitar dependencias
    accessReason: 'Acceso autorizado',
    permissions: { canViewLeads: true, canEditLeads: true }, // Valores estáticos
    userRole: 'user',
    refetch,
    isEmpty: leads.length === 0,
  };
};