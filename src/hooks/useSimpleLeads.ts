import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Lead } from '@/types/leadTypes';

export const useSimpleLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { user, userRole, permissions, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const mounted = useRef(true);
  const dataFetched = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Función para cargar datos - simplificada
  useEffect(() => {
    if (authLoading || !user || dataFetched.current) return;
    
    const fetchLeads = async () => {
      if (!mounted.current) return;
      
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

    fetchLeads();
  }, [authLoading, user, userRole, toast]);

  // Función para refrescar - simplificada
  const refetch = () => {
    dataFetched.current = false;
    setIsLoading(true);
    setError(null);
  };

  // Estados derivados - valores estáticos para evitar re-renders
  const canAccess = Boolean(!authLoading && user && permissions.canViewLeads);
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