
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface UpcomingService {
  id: number;
  id_servicio: string;
  nombre_cliente: string;
  fecha_hora_cita: string;
  estado: string;
  tipo_servicio?: string;
  local_foraneo?: string;
  origen?: string;
  destino?: string;
  cobro_cliente?: number;
}

export const useUpcomingServices = (daysAhead: number = 30) => {
  const { toast } = useToast();
  const [services, setServices] = useState<UpcomingService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUpcomingServices = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      endDate.setHours(23, 59, 59, 999);
      
      // Fetch upcoming services
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select(`
          id, 
          id_servicio,
          nombre_cliente,
          fecha_hora_cita,
          estado,
          tipo_servicio,
          local_foraneo,
          origen,
          destino,
          cobro_cliente
        `)
        .gte('fecha_hora_cita', startDate.toISOString())
        .lte('fecha_hora_cita', endDate.toISOString())
        .order('fecha_hora_cita', { ascending: true });
        
      if (error) throw error;
      
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching upcoming services:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios programados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUpcomingServices();
  }, [daysAhead]);
  
  return { services, isLoading, refetch: fetchUpcomingServices };
};
