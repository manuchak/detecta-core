import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, differenceInDays, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';

// Workflow stage definitions
export interface WorkflowStage {
  id: string;
  nombre: string;
  dias_desde_vencimiento: number; // negative = before due, positive = after due
  tipo_accion: 'recordatorio' | 'llamada' | 'email' | 'escalamiento' | 'juridico';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  mensaje_template: string;
  auto_ejecutar: boolean;
}

export interface WorkflowConfig {
  etapas: WorkflowStage[];
  dias_gracia: number;
  frecuencia_recordatorios: number;
  escalamiento_automatico: boolean;
  notificar_supervisor: boolean;
  umbral_monto_critico: number;
}

export interface PromesaPago {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  factura_id?: string;
  numero_factura?: string;
  monto_prometido: number;
  fecha_promesa: string;
  contacto_nombre?: string;
  contacto_telefono?: string;
  descripcion?: string;
  estado: 'pendiente' | 'cumplida' | 'incumplida' | 'parcial';
  created_at: string;
}

export interface WorkflowInstance {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  factura_id?: string;
  numero_factura?: string;
  monto_pendiente: number;
  dias_vencido: number;
  etapa_actual: string;
  proxima_accion: string;
  fecha_proxima_accion: string;
  historial_acciones: number;
  tiene_promesa_activa: boolean;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
}

// Default workflow configuration
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  etapas: [
    {
      id: 'pre-3',
      nombre: 'Recordatorio Pre-vencimiento',
      dias_desde_vencimiento: -3,
      tipo_accion: 'recordatorio',
      prioridad: 'baja',
      mensaje_template: 'Recordatorio: Su factura {numero_factura} vence en 3 días por ${monto}',
      auto_ejecutar: true,
    },
    {
      id: 'dia-0',
      nombre: 'Aviso día de vencimiento',
      dias_desde_vencimiento: 0,
      tipo_accion: 'email',
      prioridad: 'media',
      mensaje_template: 'Su factura {numero_factura} vence hoy. Monto: ${monto}',
      auto_ejecutar: true,
    },
    {
      id: 'post-7',
      nombre: 'Primera llamada de cobranza',
      dias_desde_vencimiento: 7,
      tipo_accion: 'llamada',
      prioridad: 'media',
      mensaje_template: 'Llamar para dar seguimiento a factura {numero_factura} vencida hace 7 días',
      auto_ejecutar: false,
    },
    {
      id: 'post-15',
      nombre: 'Segunda llamada - Negociación',
      dias_desde_vencimiento: 15,
      tipo_accion: 'llamada',
      prioridad: 'alta',
      mensaje_template: 'Segunda llamada urgente. Negociar plan de pago para {numero_factura}',
      auto_ejecutar: false,
    },
    {
      id: 'post-30',
      nombre: 'Escalamiento a supervisor',
      dias_desde_vencimiento: 30,
      tipo_accion: 'escalamiento',
      prioridad: 'alta',
      mensaje_template: 'Escalamiento: Cliente {cliente_nombre} con 30+ días de mora. Monto: ${monto}',
      auto_ejecutar: true,
    },
    {
      id: 'post-60',
      nombre: 'Notificación pre-jurídica',
      dias_desde_vencimiento: 60,
      tipo_accion: 'email',
      prioridad: 'critica',
      mensaje_template: 'Aviso formal: Iniciaremos proceso de cobranza legal si no regulariza su situación',
      auto_ejecutar: false,
    },
    {
      id: 'post-90',
      nombre: 'Proceso jurídico',
      dias_desde_vencimiento: 90,
      tipo_accion: 'juridico',
      prioridad: 'critica',
      mensaje_template: 'Iniciar proceso de cobranza judicial para {cliente_nombre}',
      auto_ejecutar: false,
    },
  ],
  dias_gracia: 3,
  frecuencia_recordatorios: 7,
  escalamiento_automatico: true,
  notificar_supervisor: true,
  umbral_monto_critico: 50000,
};

// Get current workflow stage based on days overdue
export function getCurrentStage(diasVencido: number, config: WorkflowConfig): WorkflowStage | null {
  const sortedStages = [...config.etapas].sort((a, b) => b.dias_desde_vencimiento - a.dias_desde_vencimiento);
  
  for (const stage of sortedStages) {
    if (diasVencido >= stage.dias_desde_vencimiento) {
      return stage;
    }
  }
  return null;
}

// Get next workflow stage
export function getNextStage(diasVencido: number, config: WorkflowConfig): WorkflowStage | null {
  const sortedStages = [...config.etapas].sort((a, b) => a.dias_desde_vencimiento - b.dias_desde_vencimiento);
  
  for (const stage of sortedStages) {
    if (stage.dias_desde_vencimiento > diasVencido) {
      return stage;
    }
  }
  return null;
}

// Calculate priority based on amount and days overdue
export function calculatePriority(monto: number, diasVencido: number, config: WorkflowConfig): WorkflowInstance['prioridad'] {
  if (diasVencido >= 60 || monto >= config.umbral_monto_critico) return 'critica';
  if (diasVencido >= 30) return 'alta';
  if (diasVencido >= 7) return 'media';
  return 'baja';
}

// Hook for fetching active workflow instances
export function useActiveWorkflows() {
  return useQuery({
    queryKey: ['cobranza-workflows'],
    queryFn: async () => {
      console.log('[useActiveWorkflows] Fetching active workflows');
      
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Get pending/partial invoices with client info
      const { data: facturas, error: facturasError } = await supabase
        .from('facturas')
        .select('id, numero_factura, cliente_id, cliente_nombre, total, fecha_vencimiento, estado')
        .in('estado', ['pendiente', 'parcial'])
        .order('fecha_vencimiento', { ascending: true });

      if (facturasError) {
        console.error('[useActiveWorkflows] Error fetching facturas:', facturasError);
        throw facturasError;
      }

      // Get payment promises
      const { data: promesas, error: promesasError } = await supabase
        .from('cobranza_seguimiento')
        .select('cliente_id, factura_id, fecha_promesa_pago, promesa_cumplida')
        .eq('tipo_accion', 'promesa_pago')
        .or('promesa_cumplida.is.null,promesa_cumplida.eq.false');

      if (promesasError) {
        console.error('[useActiveWorkflows] Error fetching promesas:', promesasError);
      }

      // Get action history counts
      const { data: historial, error: historialError } = await supabase
        .from('cobranza_seguimiento')
        .select('cliente_id, factura_id');

      if (historialError) {
        console.error('[useActiveWorkflows] Error fetching historial:', historialError);
      }

      const promesasMap = new Map<string, boolean>();
      (promesas || []).forEach(p => {
        if (p.cliente_id) promesasMap.set(p.cliente_id, true);
        if (p.factura_id) promesasMap.set(p.factura_id, true);
      });

      const historialCount = new Map<string, number>();
      (historial || []).forEach(h => {
        const key = h.factura_id || h.cliente_id || '';
        historialCount.set(key, (historialCount.get(key) || 0) + 1);
      });

      const config = DEFAULT_WORKFLOW_CONFIG;
      
      const workflows: WorkflowInstance[] = (facturas || []).map(f => {
        const diasVencido = differenceInDays(today, new Date(f.fecha_vencimiento));
        const currentStage = getCurrentStage(diasVencido, config);
        const nextStage = getNextStage(diasVencido, config);
        
        const diasHastaProxima = nextStage 
          ? nextStage.dias_desde_vencimiento - diasVencido
          : config.frecuencia_recordatorios;
        
        const fechaProximaAccion = format(addDays(today, Math.max(0, diasHastaProxima)), 'yyyy-MM-dd');

        return {
          id: f.id,
          cliente_id: f.cliente_id || '',
          cliente_nombre: f.cliente_nombre || 'Sin nombre',
          factura_id: f.id,
          numero_factura: f.numero_factura,
          monto_pendiente: Number(f.total),
          dias_vencido: diasVencido,
          etapa_actual: currentStage?.nombre || 'Pre-vencimiento',
          proxima_accion: nextStage?.tipo_accion || currentStage?.tipo_accion || 'recordatorio',
          fecha_proxima_accion: fechaProximaAccion,
          historial_acciones: historialCount.get(f.id) || 0,
          tiene_promesa_activa: promesasMap.has(f.id) || promesasMap.has(f.cliente_id || ''),
          prioridad: calculatePriority(Number(f.total), diasVencido, config),
        };
      });

      // Sort by priority and days overdue
      const priorityOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
      workflows.sort((a, b) => {
        const prioDiff = priorityOrder[a.prioridad] - priorityOrder[b.prioridad];
        if (prioDiff !== 0) return prioDiff;
        return b.dias_vencido - a.dias_vencido;
      });

      console.log('[useActiveWorkflows] Loaded', workflows.length, 'workflows');
      return workflows;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook for fetching payment promises
export function usePromesasPago() {
  return useQuery({
    queryKey: ['promesas-pago'],
    queryFn: async () => {
      console.log('[usePromesasPago] Fetching payment promises');

      const { data, error } = await supabase
        .from('cobranza_seguimiento')
        .select(`
          id,
          cliente_id,
          factura_id,
          monto_prometido,
          fecha_promesa_pago,
          contacto_nombre,
          contacto_telefono,
          descripcion,
          promesa_cumplida,
          created_at
        `)
        .eq('tipo_accion', 'promesa_pago')
        .order('fecha_promesa_pago', { ascending: true });

      if (error) {
        console.error('[usePromesasPago] Error:', error);
        throw error;
      }

      // Get client names
      const clienteIds = [...new Set((data || []).filter(p => p.cliente_id).map(p => p.cliente_id))];
      let clientesMap: Record<string, string> = {};
      
      if (clienteIds.length > 0) {
        const { data: clientes } = await supabase
          .from('pc_clientes')
          .select('id, nombre')
          .in('id', clienteIds as string[]);

        (clientes || []).forEach(c => {
          clientesMap[c.id] = c.nombre;
        });
      }

      // Get invoice numbers
      const facturaIds = [...new Set((data || []).filter(p => p.factura_id).map(p => p.factura_id))];
      let facturasMap: Record<string, string> = {};
      
      if (facturaIds.length > 0) {
        const { data: facturas } = await supabase
          .from('facturas')
          .select('id, numero_factura')
          .in('id', facturaIds as string[]);

        (facturas || []).forEach(f => {
          facturasMap[f.id] = f.numero_factura;
        });
      }

      const promesas: PromesaPago[] = (data || []).map(p => {
        const fechaPromesa = p.fecha_promesa_pago ? new Date(p.fecha_promesa_pago) : null;
        let estado: PromesaPago['estado'] = 'pendiente';
        
        if (p.promesa_cumplida === true) {
          estado = 'cumplida';
        } else if (fechaPromesa && isPast(fechaPromesa) && !isToday(fechaPromesa)) {
          estado = 'incumplida';
        }

        return {
          id: p.id,
          cliente_id: p.cliente_id || '',
          cliente_nombre: p.cliente_id ? clientesMap[p.cliente_id] || 'Sin nombre' : 'Sin nombre',
          factura_id: p.factura_id || undefined,
          numero_factura: p.factura_id ? facturasMap[p.factura_id] : undefined,
          monto_prometido: Number(p.monto_prometido) || 0,
          fecha_promesa: p.fecha_promesa_pago || '',
          contacto_nombre: p.contacto_nombre || undefined,
          contacto_telefono: p.contacto_telefono || undefined,
          descripcion: p.descripcion || undefined,
          estado,
          created_at: p.created_at,
        };
      });

      return promesas;
    },
    staleTime: 1 * 60 * 1000,
  });
}

// Hook to create a payment promise
export function useCreatePromesaPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      factura_id?: string;
      monto_prometido: number;
      fecha_promesa: string;
      contacto_nombre?: string;
      contacto_telefono?: string;
      descripcion?: string;
    }) => {
      console.log('[useCreatePromesaPago] Creating promise:', data);

      const { data: result, error } = await supabase
        .from('cobranza_seguimiento')
        .insert({
          cliente_id: data.cliente_id,
          factura_id: data.factura_id,
          tipo_accion: 'promesa_pago',
          monto_prometido: data.monto_prometido,
          fecha_promesa_pago: data.fecha_promesa,
          contacto_nombre: data.contacto_nombre,
          contacto_telefono: data.contacto_telefono,
          descripcion: data.descripcion || `Promesa de pago por $${data.monto_prometido.toLocaleString()}`,
          promesa_cumplida: false,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promesas-pago'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-cobranza'] });
      toast.success('Promesa de pago registrada');
    },
    onError: (error) => {
      console.error('[useCreatePromesaPago] Error:', error);
      toast.error('Error al registrar promesa de pago');
    },
  });
}

// Hook to update promise status
export function useUpdatePromesaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cumplida }: { id: string; cumplida: boolean }) => {
      console.log('[useUpdatePromesaStatus] Updating promise:', id, cumplida);

      const { error } = await supabase
        .from('cobranza_seguimiento')
        .update({ 
          promesa_cumplida: cumplida,
          resultado: cumplida ? 'Promesa cumplida' : 'Promesa incumplida',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promesas-pago'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-cobranza'] });
      toast.success('Estado de promesa actualizado');
    },
    onError: (error) => {
      console.error('[useUpdatePromesaStatus] Error:', error);
      toast.error('Error al actualizar promesa');
    },
  });
}

// Hook to register a workflow action
export function useRegisterWorkflowAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      factura_id?: string;
      tipo_accion: string;
      descripcion: string;
      resultado?: string;
      contacto_nombre?: string;
      contacto_telefono?: string;
      proxima_accion?: string;
    }) => {
      console.log('[useRegisterWorkflowAction] Registering action:', data);

      const { data: result, error } = await supabase
        .from('cobranza_seguimiento')
        .insert({
          cliente_id: data.cliente_id,
          factura_id: data.factura_id,
          tipo_accion: data.tipo_accion,
          descripcion: data.descripcion,
          resultado: data.resultado,
          contacto_nombre: data.contacto_nombre,
          contacto_telefono: data.contacto_telefono,
          proxima_accion: data.proxima_accion,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobranza-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-cobranza'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza-seguimiento'] });
      toast.success('Acción registrada');
    },
    onError: (error) => {
      console.error('[useRegisterWorkflowAction] Error:', error);
      toast.error('Error al registrar acción');
    },
  });
}

// Workflow metrics
export interface WorkflowMetrics {
  totalWorkflows: number;
  workflowsCriticos: number;
  promesasPendientes: number;
  promesasIncumplidas: number;
  montoEnRiesgo: number;
  accionesHoy: number;
}

export function useWorkflowMetrics() {
  const { data: workflows } = useActiveWorkflows();
  const { data: promesas } = usePromesasPago();

  const today = format(new Date(), 'yyyy-MM-dd');

  const metrics: WorkflowMetrics = {
    totalWorkflows: workflows?.length || 0,
    workflowsCriticos: workflows?.filter(w => w.prioridad === 'critica' || w.prioridad === 'alta').length || 0,
    promesasPendientes: promesas?.filter(p => p.estado === 'pendiente').length || 0,
    promesasIncumplidas: promesas?.filter(p => p.estado === 'incumplida').length || 0,
    montoEnRiesgo: workflows?.filter(w => w.dias_vencido > 30).reduce((sum, w) => sum + w.monto_pendiente, 0) || 0,
    accionesHoy: workflows?.filter(w => w.fecha_proxima_accion === today).length || 0,
  };

  return metrics;
}
