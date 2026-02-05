import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CustodianService {
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  estado: string;
  tipo_servicio: string;
  source: 'planificado' | 'legacy';
}

interface NextServiceResult {
  service: CustodianService | null;
  checklistStatus: 'pendiente' | 'completo' | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useNextService(custodianPhone: string | undefined): NextServiceResult {
  const query = useQuery({
    queryKey: ['next-service', custodianPhone],
    queryFn: async () => {
      if (!custodianPhone) return { service: null, checklistStatus: null };
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayISO = now.toISOString();
      
      // Normalizar teléfono (quitar espacios, guiones)
      const normalizedPhone = custodianPhone.replace(/[\s-]/g, '');
      
      // 1. Query servicios_planificados (sistema nuevo con custodio_telefono)
      const { data: planificados, error: planError } = await supabase
        .from('servicios_planificados')
        .select(`
          id,
          id_servicio,
          nombre_cliente,
          origen,
          destino,
          fecha_hora_cita,
          estado_planeacion,
          tipo_servicio
        `)
        .eq('custodio_telefono', normalizedPhone)
        .gte('fecha_hora_cita', todayISO)
        .in('estado_planeacion', ['asignado', 'confirmado', 'en_transito', 'Asignado', 'Confirmado', 'En Tránsito'])
        .order('fecha_hora_cita', { ascending: true })
        .limit(1);

      if (planError) {
        console.error('Error fetching servicios_planificados:', planError);
      }

      // 2. Query servicios_custodia (sistema legacy)
      const { data: legacy, error: legacyError } = await supabase
        .from('servicios_custodia')
        .select(`
          id_servicio,
          nombre_cliente,
          origen,
          destino,
          fecha_hora_cita,
          estado,
          tipo_servicio
        `)
        .or(`telefono.eq.${normalizedPhone},telefono_operador.eq.${normalizedPhone}`)
        .gte('fecha_hora_cita', todayISO)
        .in('estado', ['pendiente', 'programado', 'Pendiente', 'Programado', 'asignado', 'Asignado'])
        .order('fecha_hora_cita', { ascending: true })
        .limit(1);

      if (legacyError) {
        console.error('Error fetching servicios_custodia:', legacyError);
      }

      // 3. Combinar y normalizar resultados
      const allServices: CustodianService[] = [];
      
      // Normalizar servicios planificados
      if (planificados && planificados.length > 0) {
        const p = planificados[0];
        allServices.push({
          id_servicio: p.id_servicio || p.id,
          nombre_cliente: p.nombre_cliente || 'Cliente',
          origen: p.origen || '',
          destino: p.destino || '',
          fecha_hora_cita: p.fecha_hora_cita,
          estado: p.estado_planeacion || 'asignado',
          tipo_servicio: p.tipo_servicio || 'custodia',
          source: 'planificado'
        });
      }
      
      // Normalizar servicios legacy
      if (legacy && legacy.length > 0) {
        const l = legacy[0];
        allServices.push({
          id_servicio: l.id_servicio,
          nombre_cliente: l.nombre_cliente || 'Cliente',
          origen: l.origen || '',
          destino: l.destino || '',
          fecha_hora_cita: l.fecha_hora_cita,
          estado: l.estado || 'pendiente',
          tipo_servicio: l.tipo_servicio || 'custodia',
          source: 'legacy'
        });
      }

      // 4. Ordenar por fecha y seleccionar el más próximo
      allServices.sort((a, b) => 
        new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime()
      );

      const nextService = allServices[0] || null;

      if (!nextService) {
        return { service: null, checklistStatus: null };
      }

      // 5. Verificar si existe checklist para este servicio
      const { data: checklist } = await supabase
        .from('checklist_servicio')
        .select('estado')
        .eq('servicio_id', nextService.id_servicio)
        .eq('custodio_telefono', normalizedPhone)
        .maybeSingle();

      return {
        service: nextService,
        checklistStatus: (checklist?.estado as 'pendiente' | 'completo') || null
      };
    },
    enabled: !!custodianPhone,
    staleTime: 60000, // 1 minuto
  });

  return {
    service: query.data?.service || null,
    checklistStatus: query.data?.checklistStatus || null,
    isLoading: query.isLoading,
    refetch: query.refetch
  };
}
