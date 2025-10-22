import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduledService {
  id: string;
  id_servicio?: string;
  cliente_nombre: string;
  nombre_cliente?: string;
  empresa_cliente?: string;
  email_cliente?: string;
  telefono_cliente?: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  tipo_servicio?: string;
  custodio_nombre: string;
  custodio_id?: string;
  armado_nombre?: string;
  armado_id?: string;
  armado_asignado?: string;
  estado: string;
  estado_planeacion?: string;
  incluye_armado: boolean;
  requiere_armado?: boolean;
  estado_asignacion?: string;
  auto?: string;
  placa?: string;
  assigned_by?: string;
  planner_name?: string;
  observaciones?: string;
  created_at?: string;
}

export interface ScheduledServicesSummary {
  total_services: number;
  assigned_services: number;
  pending_services: number;
  confirmed_services: number;
  services_data: ScheduledService[];
}

export function useScheduledServices(selectedDate: Date = new Date()) {
  const dateStr = selectedDate.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['scheduled-services', dateStr],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_real_planned_services_summary', {
          date_filter: dateStr
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const result = data[0];
          return {
            total_services: result.total_services || 0,
            assigned_services: result.assigned_services || 0,
            pending_services: result.pending_services || 0,
            confirmed_services: result.confirmed_services || 0,
            services_data: result.services_data || []
          };
        }
        
        return {
          total_services: 0,
          assigned_services: 0,
          pending_services: 0,
          confirmed_services: 0,
          services_data: []
        };
      } catch (err) {
        console.error('Error loading planned services:', err);
        toast.error('Error al cargar servicios planificados');
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 30000 // 30 segundos
  });
}