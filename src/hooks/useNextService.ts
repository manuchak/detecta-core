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
       
       // 1. Obtener próximo servicio (hoy o futuro, estado pendiente/programado)
       const now = new Date();
       now.setHours(0, 0, 0, 0);
       
       const { data: services, error: servicesError } = await supabase
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
         .or(`telefono.eq.${custodianPhone},telefono_operador.eq.${custodianPhone}`)
         .gte('fecha_hora_cita', now.toISOString())
         .in('estado', ['pendiente', 'programado', 'Pendiente', 'Programado', 'asignado', 'Asignado'])
         .order('fecha_hora_cita', { ascending: true })
         .limit(1);
       
       if (servicesError) {
         console.error('Error fetching next service:', servicesError);
         return { service: null, checklistStatus: null };
       }
       
       const nextService = services?.[0] || null;
       
       if (!nextService) {
         return { service: null, checklistStatus: null };
       }
       
       // 2. Verificar si existe checklist para este servicio
       const { data: checklist } = await supabase
         .from('checklist_servicio')
         .select('estado')
         .eq('servicio_id', nextService.id_servicio)
         .eq('custodio_telefono', custodianPhone)
         .maybeSingle();
       
       return {
         service: nextService as CustodianService,
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