import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Lead {
  id: string;
  nombre: string;
  email: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

interface AnalystWithLeads {
  id: string;
  display_name: string;
  email: string;
  role: string;
  assignedLeadsCount: number;
  pendingLeadsCount: number;
  lastActivity: string | null;
  leads: Lead[];
}

export const useTeamManagement = () => {
  const [analysts, setAnalysts] = useState<AnalystWithLeads[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTeamData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener analistas con roles válidos usando consulta directa
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          user_roles!inner(role)
        `)
        .in('user_roles.role', ['admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas'])
        .eq('is_verified', true);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      const validAnalysts = usersData?.map((user: any) => ({
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        role: user.user_roles[0]?.role || 'unknown'
      })) || [];

      console.log('Found analysts:', validAnalysts.length);

      // Para cada analista, obtener sus leads asignados
      const analystsWithLeads = await Promise.all(
        validAnalysts.map(async (analyst: any) => {
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('id, nombre, email, estado, created_at, updated_at')
            .eq('asignado_a', analyst.id)
            .order('created_at', { ascending: false });

          if (leadsError) {
            console.error(`Error fetching leads for analyst ${analyst.id}:`, leadsError);
          }

          const leads = leadsData || [];
          const pendingLeads = leads.filter(lead => 
            ['nuevo', 'en_proceso', 'pendiente'].includes(lead.estado)
          );

          // Calcular última actividad (última actualización de leads o creación)
          const lastActivity = leads.length > 0 
            ? leads.reduce((latest, lead) => {
                const leadDate = new Date(lead.updated_at || lead.created_at);
                return leadDate > latest ? leadDate : latest;
              }, new Date(0)).toISOString()
            : null;

          return {
            id: analyst.id,
            display_name: analyst.display_name || analyst.email,
            email: analyst.email,
            role: analyst.role,
            assignedLeadsCount: leads.length,
            pendingLeadsCount: pendingLeads.length,
            lastActivity,
            leads: leads.map(lead => ({
              id: lead.id,
              nombre: lead.nombre,
              email: lead.email,
              estado: lead.estado,
              created_at: lead.created_at,
              updated_at: lead.updated_at
            }))
          };
        })
      );

      // Ordenar por carga de trabajo (más leads primero)
      analystsWithLeads.sort((a, b) => b.assignedLeadsCount - a.assignedLeadsCount);
      
      setAnalysts(analystsWithLeads);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching team data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reassignLeads = useCallback(async (leadIds: string[], toAnalystId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          asignado_a: toAnalystId,
          updated_at: new Date().toISOString()
        })
        .in('id', leadIds);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `${leadIds.length} lead(s) reasignado(s) correctamente.`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `Error al reasignar leads: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const reassignAllLeads = useCallback(async (fromAnalystId: string, toAnalystId: string) => {
    try {
      // Obtener todos los leads del analista origen
      const { data: leadsToReassign, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('asignado_a', fromAnalystId);

      if (fetchError) throw fetchError;

      if (!leadsToReassign || leadsToReassign.length === 0) {
        toast({
          title: "Info",
          description: "No hay leads para reasignar.",
        });
        return true;
      }

      const leadIds = leadsToReassign.map(lead => lead.id);
      return await reassignLeads(leadIds, toAnalystId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `Error al reasignar todos los leads: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  }, [reassignLeads, toast]);

  const distributeEquitably = useCallback(async (fromAnalystId: string) => {
    try {
      // Obtener todos los leads del analista origen
      const { data: leadsToDistribute, error: fetchError } = await supabase
        .from('leads')
        .select('id')
        .eq('asignado_a', fromAnalystId);

      if (fetchError) throw fetchError;

      if (!leadsToDistribute || leadsToDistribute.length === 0) {
        toast({
          title: "Info",
          description: "No hay leads para distribuir.",
        });
        return true;
      }

      // Obtener analistas disponibles (excluyendo el origen)
      const availableAnalysts = analysts.filter(analyst => 
        analyst.id !== fromAnalystId && 
        ['admin', 'owner', 'supply_admin', 'supply_lead'].includes(analyst.role)
      );

      if (availableAnalysts.length === 0) {
        toast({
          title: "Error",
          description: "No hay analistas disponibles para la distribución.",
          variant: "destructive",
        });
        return false;
      }

      // Distribuir leads equitativamente
      const leadsPerAnalyst = Math.floor(leadsToDistribute.length / availableAnalysts.length);
      const remainingLeads = leadsToDistribute.length % availableAnalysts.length;

      let leadIndex = 0;
      const updates = [];

      for (let i = 0; i < availableAnalysts.length; i++) {
        const analyst = availableAnalysts[i];
        const leadsForThisAnalyst = leadsPerAnalyst + (i < remainingLeads ? 1 : 0);
        
        for (let j = 0; j < leadsForThisAnalyst; j++) {
          if (leadIndex < leadsToDistribute.length) {
            updates.push({
              id: leadsToDistribute[leadIndex].id,
              asignado_a: analyst.id,
              updated_at: new Date().toISOString()
            });
            leadIndex++;
          }
        }
      }

      // Ejecutar todas las actualizaciones
      for (const update of updates) {
        const { error } = await supabase
          .from('leads')
          .update({
            asignado_a: update.asignado_a,
            updated_at: update.updated_at
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: `${leadsToDistribute.length} leads distribuidos equitativamente entre ${availableAnalysts.length} analistas.`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `Error en la distribución equitativa: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  }, [analysts, toast]);

  const refreshData = useCallback(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  return {
    analysts,
    isLoading,
    error,
    reassignLeads,
    reassignAllLeads,
    distributeEquitably,
    refreshData
  };
};