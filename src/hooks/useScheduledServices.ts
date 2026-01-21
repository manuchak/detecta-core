import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  // Campos para estado operativo
  hora_inicio_real?: string;
  hora_fin_real?: string;
  // Campo para comentarios internos de planeación
  comentarios_planeacion?: string;
  id_interno_cliente?: string;
  // Campos para posicionamiento en falso
  posicionamiento_falso?: boolean;
  cobro_posicionamiento?: boolean;
  motivo_posicionamiento_falso?: string;
}

export interface ScheduledServicesSummary {
  total_services: number;
  assigned_services: number;
  pending_services: number;
  confirmed_services: number;
  services_data: ScheduledService[];
}

export function useScheduledServices(selectedDate: Date = new Date()) {
  // Usar format() de date-fns para evitar bug de timezone donde toISOString() convierte a UTC
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
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
          
          // Validación de estructura de datos
          if (result.services_data) {
            result.services_data.forEach((service: any, index: number) => {
              if (!service.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(service.id)) {
                console.warn(`⚠️ Service ${index} has invalid or missing UUID:`, {
                  id: service.id,
                  id_servicio: service.id_servicio
                });
              }
            });
          }
          
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