import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSandboxAwareSupabase } from "@/hooks/useSandboxAwareSupabase";
import { useToast } from "@/hooks/use-toast";
import { AssignedLead, ZoneCapacity, PoolMovement, LeadEstado } from "@/types/leadTypes";

export const usePoolReserva = () => {
  const sbx = useSandboxAwareSupabase(); // ✅ Hook Sandbox-aware
  const [poolCandidates, setPoolCandidates] = useState<AssignedLead[]>([]);
  const [zoneCapacities, setZoneCapacities] = useState<ZoneCapacity[]>([]);
  const [poolMovements, setPoolMovements] = useState<PoolMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch candidates in pool
  const fetchPoolCandidates = async () => {
    try {
      const { data, error } = await sbx.rpc('get_analyst_assigned_leads', {
        p_limit: 1000,
        p_offset: 0,
        p_date_from: null,
        p_date_to: null
      });
      
      if (error) throw error;
      
      // Filtrar solo los candidatos que están en el pool (tienen fecha_entrada_pool)
      const poolLeads = (data || []).filter((lead: any) => lead.fecha_entrada_pool !== null)
        .map((lead: any) => ({
          ...lead,
          lead_estado: lead.lead_estado as LeadEstado,
          // Compatibilidad con campos legacy si es necesario
          analyst_name: lead.analista_nombre,
          analyst_email: lead.analista_email
        }));
      setPoolCandidates(poolLeads);
    } catch (error) {
      console.error('Error fetching pool candidates:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los candidatos del pool",
        variant: "destructive",
      });
    }
  };

  // Fetch zone capacities with zone info
  const fetchZoneCapacities = async () => {
    try {
      const { data: capacityData, error: capacityError } = await supabase
        .from('zona_capacity_management')
        .select(`
          *,
          zonas_operacion_nacional!inner(
            id,
            nombre
          )
        `);
      
      if (capacityError) throw capacityError;
      
      // Transform data to match ZoneCapacity interface
      const transformedData: ZoneCapacity[] = (capacityData || []).map((capacity: any) => ({
        id: capacity.id,
        zona_id: capacity.zona_id,
        zona_nombre: capacity.zonas_operacion_nacional?.nombre || 'Sin nombre',
        capacidad_maxima: capacity.capacidad_maxima,
        capacidad_actual: capacity.capacidad_actual,
        umbral_saturacion: capacity.umbral_saturacion,
        zona_saturada: capacity.capacidad_actual >= capacity.umbral_saturacion,
        espacios_disponibles: capacity.capacidad_maxima - capacity.capacidad_actual,
        activo: capacity.activo
      }));
      
      setZoneCapacities(transformedData);
    } catch (error) {
      console.error('Error fetching zone capacities:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las capacidades de zona",
        variant: "destructive",
      });
    }
  };

  // Fetch pool movements history
  const fetchPoolMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('pool_reserva_movements')
        .select(`
          *,
          leads!inner(nombre),
          zonas_operacion_nacional(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const transformedMovements: PoolMovement[] = (data || []).map((movement: any) => ({
        id: movement.id,
        lead_id: movement.lead_id,
        zona_id: movement.zona_id,
        movimiento_tipo: movement.movimiento_tipo as 'entrada' | 'salida' | 'reactivacion' | 'expiracion',
        motivo: movement.motivo,
        fecha_entrada: movement.fecha_entrada,
        fecha_salida: movement.fecha_salida,
        reactivado_por: movement.reactivado_por,
        notas: movement.notas,
        metadata: movement.metadata as Record<string, any>,
        created_at: movement.created_at,
        created_by: movement.created_by
      }));
      
      setPoolMovements(transformedMovements);
    } catch (error) {
      console.error('Error fetching pool movements:', error);
    }
  };

  // Check if a zone is saturated
  const checkZoneCapacity = async (zonaId: string) => {
    try {
      const { data, error } = await sbx.rpc('check_zone_capacity', {
        p_zona_id: zonaId
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error checking zone capacity:', error);
      return null;
    }
  };

  // Move lead to pool
  const moveToPool = async (leadId: string, estadoId: string, motivo: string = 'Zona saturada') => {
    try {
      setLoading(true);
      
      const { data, error } = await sbx.rpc('move_lead_to_pool', {
        p_lead_id: leadId,
        p_estado_id: estadoId,
        p_motivo: motivo
      });
      
      if (error) throw error;
      
      toast({
        title: "Candidato movido al pool",
        description: "El candidato ha sido agregado al pool de reserva exitosamente.",
      });
      
      // Refresh data
      await Promise.all([
        fetchPoolCandidates(),
        fetchZoneCapacities(),
        fetchPoolMovements()
      ]);
      
      return true;
    } catch (error) {
      console.error('Error moving lead to pool:', error);
      toast({
        title: "Error",
        description: `No se pudo mover el candidato al pool: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reactivate lead from pool
  const reactivateFromPool = async (leadId: string, nuevoEstado: string = 'aprobado') => {
    try {
      setLoading(true);
      
      const { data, error } = await sbx.rpc('reactivate_lead_from_pool', {
        p_lead_id: leadId,
        p_nuevo_estado: nuevoEstado
      });
      
      if (error) throw error;
      
      toast({
        title: "Candidato reactivado",
        description: "El candidato ha sido reactivado desde el pool exitosamente.",
      });
      
      // Refresh data
      await Promise.all([
        fetchPoolCandidates(),
        fetchZoneCapacities(),
        fetchPoolMovements()
      ]);
      
      return true;
    } catch (error) {
      console.error('Error reactivating lead from pool:', error);
      toast({
        title: "Error",
        description: `No se pudo reactivar el candidato: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Bulk reactivate candidates from pool
  const bulkReactivateFromPool = async (leadIds: string[], nuevoEstado: string = 'aprobado') => {
    try {
      setLoading(true);
      
      const results = await Promise.allSettled(
        leadIds.map(leadId => 
          sbx.rpc('reactivate_lead_from_pool', {
            p_lead_id: leadId,
            p_nuevo_estado: nuevoEstado
          })
        )
      );
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        toast({
          title: "Reactivación completada",
          description: `${successful} candidatos reactivados exitosamente${failed > 0 ? `, ${failed} fallaron` : ''}.`,
        });
      }
      
      if (failed > 0) {
        toast({
          title: "Algunas reactivaciones fallaron",
          description: `${failed} de ${results.length} reactivaciones fallaron.`,
          variant: "destructive",
        });
      }
      
      // Refresh data
      await Promise.all([
        fetchPoolCandidates(),
        fetchZoneCapacities(),
        fetchPoolMovements()
      ]);
      
      return { successful, failed };
    } catch (error) {
      console.error('Error in bulk reactivation:', error);
      toast({
        title: "Error",
        description: "Error en la reactivación masiva de candidatos",
        variant: "destructive",
      });
      return { successful: 0, failed: leadIds.length };
    } finally {
      setLoading(false);
    }
  };

  // Update zone capacity
  const updateZoneCapacity = async (
    zonaId: string, 
    capacidadMaxima: number, 
    umbralSaturacion: number
  ) => {
    try {
      const { error } = await supabase
        .from('zona_capacity_management')
        .upsert({
          zona_id: zonaId,
          capacidad_maxima: capacidadMaxima,
          umbral_saturacion: umbralSaturacion,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });
      
      if (error) throw error;
      
      toast({
        title: "Capacidad actualizada",
        description: "La capacidad de la zona ha sido actualizada exitosamente.",
      });
      
      await fetchZoneCapacities();
      return true;
    } catch (error) {
      console.error('Error updating zone capacity:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar la capacidad: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchPoolCandidates(),
        fetchZoneCapacities(),
        fetchPoolMovements()
      ]);
    };
    loadData();
  }, []);

  return {
    // Data
    poolCandidates,
    zoneCapacities,
    poolMovements,
    loading,
    
    // Actions
    moveToPool,
    reactivateFromPool,
    bulkReactivateFromPool,
    updateZoneCapacity,
    checkZoneCapacity,
    
    // Refresh functions
    fetchPoolCandidates,
    fetchZoneCapacities,
    fetchPoolMovements,
    refreshAll: async () => {
      await Promise.all([
        fetchPoolCandidates(),
        fetchZoneCapacities(),
        fetchPoolMovements()
      ]);
    }
  };
};