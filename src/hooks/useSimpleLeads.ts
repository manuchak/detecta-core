import { useState, useEffect, useRef, useMemo } from 'react';
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

  // Memoize the permission values to prevent infinite re-renders
  const canViewLeads = useMemo(() => permissions.canViewLeads, [permissions.canViewLeads]);
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Función para cargar datos
  const fetchLeads = async () => {
    if (!mounted.current || dataFetched.current || authLoading) return;
    if (!user || !canViewLeads) {
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

  // Efecto principal - usar solo valores memoizados como dependencias
  useEffect(() => {
    if (!authLoading) {
      fetchLeads();
    }
  }, [authLoading, userId, canViewLeads]);

  // Estados derivados usando valores memoizados
  const canAccess = useMemo(() => 
    !authLoading && user && canViewLeads, 
    [authLoading, user, canViewLeads]
  );
  
  const accessReason = useMemo(() => 
    authLoading 
      ? 'Verificando autenticación...'
      : !user 
        ? 'Debes iniciar sesión'
        : !canViewLeads
          ? `Tu rol '${userRole}' no tiene permisos para ver candidatos`
          : 'Acceso autorizado',
    [authLoading, user, canViewLeads, userRole]
  );

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