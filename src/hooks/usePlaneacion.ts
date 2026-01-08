// =====================================================
// TIPOS PARA MÓDULO DE PLANEACIÓN DE CUSTODIAS
// =====================================================

export type EstadoCustodio = 'activo' | 'inactivo';
export type DisponibilidadCustodio = 'disponible' | 'ocupado' | 'off';
export type TipoCustodia = 'armado' | 'no_armado';
export type EstadoServicio = 'nuevo' | 'en_oferta' | 'asignado' | 'en_curso' | 'finalizado' | 'cancelado';
export type EstadoOferta = 'enviada' | 'aceptada' | 'rechazada' | 'expirada';
export type TipoEvento = 'desvio' | 'jammer' | 'ign_on' | 'ign_off' | 'arribo_poi' | 'contacto_custodio' | 'contacto_cliente' | 'otro';
export type SeveridadEvento = 'baja' | 'media' | 'alta' | 'critica';
export type ActorTouchpoint = 'C4' | 'Planificador' | 'Custodio' | 'Cliente';
export type CanalComunicacion = 'whatsapp' | 'app' | 'telefono' | 'email';
export type TipoServicioCustodia = 'traslado' | 'custodia_local' | 'escolta' | 'vigilancia';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as planeacionService from '@/services/planeacionService';
import { FiltrosServicios, FiltrosCustodios, FiltrosClientes, ClienteForm, CustodioForm, ServicioForm } from '@/types/planeacion';

// =====================================================
// HOOKS PARA CLIENTES
// =====================================================

export const useClientes = (filtros?: FiltrosClientes) => {
  return useQuery({
    queryKey: ['clientes', JSON.stringify(filtros)],
    queryFn: () => planeacionService.clientesService.getAll(filtros),
  });
};

export const useCliente = (id: string) => {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => planeacionService.clientesService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteForm) => planeacionService.clientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear cliente');
    },
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cliente }: { id: string; cliente: Partial<ClienteForm> }) =>
      planeacionService.clientesService.update(id, cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar cliente');
    },
  });
};

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // For now, disable delete since it's not implemented in the service
      throw new Error('Delete functionality not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente desactivado exitosamente');
    },
    onError: () => {
      toast.error('Error al desactivar cliente');
    },
  });
};

// =====================================================
// HOOKS PARA CUSTODIOS
// =====================================================

export const useCustodios = (filtros?: FiltrosCustodios) => {
  return useQuery({
    queryKey: ['custodios-operativos-disponibles', JSON.stringify(filtros)],
    queryFn: async () => {
      // Usar la vista optimizada que filtra automáticamente por actividad e indisponibilidades
      const { data, error } = await supabase
        .from('custodios_operativos_disponibles')
        .select('*')
        .order('score_total', { ascending: false });

      if (error) throw error;
      
      let custodios = data || [];
      
      // Aplicar filtros adicionales si existen
      if (filtros?.disponibilidad && custodios.length > 0) {
        custodios = custodios.filter(c => 
          c.disponibilidad === filtros.disponibilidad
        );
      }
      
      if (filtros?.zona_base && custodios.length > 0) {
        custodios = custodios.filter(c => 
          c.zona_base?.toLowerCase().includes(filtros.zona_base!.toLowerCase())
        );
      }
      
      return custodios;
    },
  });
};

export const useCustodio = (id: string) => {
  return useQuery({
    queryKey: ['custodios', id],
    queryFn: () => planeacionService.custodiosService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustodio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustodioForm) => planeacionService.custodiosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast.success('Custodio creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear custodio');
    },
  });
};

export const useUpdateCustodio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, custodio }: { id: string; custodio: Partial<CustodioForm> }) =>
      planeacionService.custodiosService.update(id, custodio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast.success('Custodio actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar custodio');
    },
  });
};

export const useDeleteCustodio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Use the actual updateDisponibilidad method
      return planeacionService.custodiosService.updateDisponibilidad(id, 'off');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast.success('Custodio desactivado exitosamente');
    },
    onError: () => {
      toast.error('Error al desactivar custodio');
    },
  });
};

// =====================================================
// HOOKS PARA SERVICIOS
// =====================================================

export const useServicios = (filtros?: FiltrosServicios) => {
  return useQuery({
    queryKey: ['servicios', JSON.stringify(filtros)],
    queryFn: () => planeacionService.serviciosService.getAll(filtros),
  });
};

export const useServicio = (id: string) => {
  return useQuery({
    queryKey: ['servicios', id],
    queryFn: () => planeacionService.serviciosService.getById(id),
    enabled: !!id,
  });
};

export const useCreateServicio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServicioForm) => planeacionService.serviciosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear servicio');
    },
  });
};

export const useUpdateServicio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, servicio }: { id: string; servicio: Partial<ServicioForm> }) =>
      planeacionService.serviciosService.update(id, servicio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar servicio');
    },
  });
};

export const useDeleteServicio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // For now, just update to cancelled since delete method is not implemented
      return planeacionService.serviciosService.updateEstado(id, 'cancelado', 'Servicio eliminado por usuario');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio cancelado exitosamente');
    },
    onError: () => {
      toast.error('Error al cancelar servicio');
    },
  });
};

export const usePlaneacionStats = () => {
  return useQuery({
    queryKey: ['planeacion-stats'],
    queryFn: async () => {
      const servicios = await planeacionService.serviciosService.getAll();
      const custodios = await planeacionService.custodiosService.getAll();
      
      return {
        total_servicios: servicios.length,
        servicios_por_estado: servicios.reduce((acc, s) => {
          acc[s.estado] = (acc[s.estado] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        tasa_aceptacion: 0.85,
        tiempo_medio_asignacion: 45,
        servicios_con_gadgets: servicios.filter(s => s.requiere_gadgets).length,
        custodios_activos: custodios.filter(c => c.estado === 'activo').length,
        ingresos_totales: 150000,
        margen_promedio: 0.35,
      };
    },
  });
};

// =====================================================
// HOOK PARA ACTUALIZACIÓN INTELIGENTE DE SERVICIOS
// =====================================================

export const useUpdateServicioIntelligent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      updates: any;
      mode?: 'add_armed' | 'remove_armed' | 'change_armed' | 'basic';
    }) => {
      const { id, updates, mode = 'basic' } = params;
      
      // Lógica inteligente basada en el modo de actualización
      let finalUpdates = { ...updates };
      
      if (mode === 'remove_armed') {
        finalUpdates = {
          ...finalUpdates,
          requiere_armado: false,
          armado_asignado: null,
          // Actualizar estado inteligentemente
          estado_planeacion: updates.estado_planeacion || 'confirmado'
        };
      } else if (mode === 'add_armed') {
        finalUpdates = {
          ...finalUpdates,
          requiere_armado: true,
          // Si no hay armado asignado, cambiar a pendiente
          estado_planeacion: updates.armado_asignado ? 'confirmado' : 'pendiente_asignacion'
        };
      }

      const { data, error } = await supabase
        .from('servicios_custodia')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al actualizar servicio: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicio', variables.id] });
      
      // Mensaje de éxito contextual
      const modeMessages = {
        'add_armed': 'Armado agregado al servicio',
        'remove_armed': 'Armado removido del servicio', 
        'change_armed': 'Armado actualizado',
        'basic': 'Servicio actualizado'
      };
      
      toast.success(modeMessages[variables.mode || 'basic']);
    },
    onError: (error: Error) => {
      console.error('Error updating service:', error);
      toast.error(error.message);
    }
  });
};