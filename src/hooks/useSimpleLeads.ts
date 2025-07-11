import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStableAuth } from './useStableAuth';
import { Lead } from '@/types/leadTypes';

export const useSimpleLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { user, userRole, permissions, loading: authLoading } = useStableAuth();
  const { toast } = useToast();
  const mounted = useRef(true);
  const dataFetched = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Función para cargar datos
  const fetchLeads = async () => {
    if (!mounted.current || dataFetched.current || authLoading) return;
    if (!user || !permissions.canViewLeads) {
      setIsLoading(false);
      return;
    }

    dataFetched.current = true;
    console.log(`📋 SimpleLeads: Fetching for role ${userRole}`);

    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (mounted.current) {
        setLeads(data || []);
        setIsLoading(false);
        setError(null);
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
  };

  // Función para refrescar
  const refetch = () => {
    dataFetched.current = false;
    setIsLoading(true);
    setError(null);
    fetchLeads();
  };

  // Efecto principal
  useEffect(() => {
    if (!authLoading) {
      fetchLeads();
    }
  }, [authLoading, user, permissions.canViewLeads]);

  // Estados derivados
  const canAccess = !authLoading && user && permissions.canViewLeads;
  const accessReason = authLoading 
    ? 'Verificando autenticación...'
    : !user 
      ? 'Debes iniciar sesión'
      : !permissions.canViewLeads
        ? `Tu rol '${userRole}' no tiene permisos para ver candidatos`
        : 'Acceso autorizado';

  return {
    leads,
    isLoading,
    error,
    canAccess,
    accessReason,
    permissions,
    userRole,
    refetch,
    isEmpty: leads.length === 0,
  };
};