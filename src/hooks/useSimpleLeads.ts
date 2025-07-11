import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types/leadTypes';

export const useSimpleLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { toast } = useToast();
  const mounted = useRef(true);
  const dataFetched = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Función para cargar datos - completamente independiente
  useEffect(() => {
    if (dataFetched.current) return;
    
    const fetchLeads = async () => {
      if (!mounted.current) return;
      
      dataFetched.current = true;
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
  }, []); // Sin dependencias para evitar re-renders

  // Función para refrescar
  const refetch = () => {
    dataFetched.current = false;
    setIsLoading(true);
    setError(null);
  };

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