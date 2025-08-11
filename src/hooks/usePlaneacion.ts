import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import {
  clientesService,
  custodiosService,
  serviciosService,
  ofertasService,
  eventosService,
  touchpointsService,
  costosService,
  scoringService,
  reportesService
} from '@/services/planeacionService';
import type {
  Cliente,
  Custodio,
  Servicio,
  ServicioForm,
  CustodioForm,
  ClienteForm,
  FiltrosServicios,
  FiltrosCustodios,
  FiltrosClientes,
  OfertaCustodio,
  EventoMonitoreo,
  Touchpoint,
  CostoIngreso
} from '@/types/planeacion';
import { useToast } from './use-toast';

// =====================================================
// HOOKS PARA CLIENTES
// =====================================================

export const useClientes = (filtros?: FiltrosClientes) => {
  return useAuthenticatedQuery(
    ['clientes', JSON.stringify(filtros)],
    () => clientesService.getAll(filtros)
  );
};

export const useCliente = (id?: string) => {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => id ? clientesService.getById(id) : null,
    enabled: !!id
  });
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (cliente: ClienteForm) => clientesService.create(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: 'Cliente creado',
        description: 'El cliente se ha creado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el cliente.',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, cliente }: { id: string; cliente: Partial<ClienteForm> }) =>
      clientesService.update(id, cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: 'Cliente actualizado',
        description: 'El cliente se ha actualizado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cliente.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA CUSTODIOS
// =====================================================

export const useCustodios = (filtros?: FiltrosCustodios) => {
  return useAuthenticatedQuery(
    ['custodios', JSON.stringify(filtros)],
    () => custodiosService.getAll(filtros)
  );
};

export const useCustodiosDisponibles = (requiere_gadgets?: boolean, tipo_custodia?: string) => {
  return useAuthenticatedQuery(
    ['custodios', 'disponibles', String(requiere_gadgets), String(tipo_custodia)],
    () => custodiosService.getDisponibles(requiere_gadgets, tipo_custodia)
  );
};

export const useCustodio = (id?: string) => {
  return useQuery({
    queryKey: ['custodio', id],
    queryFn: () => id ? custodiosService.getById(id) : null,
    enabled: !!id
  });
};

export const useCreateCustodio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (custodio: CustodioForm) => custodiosService.create(custodio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast({
        title: 'Custodio creado',
        description: 'El custodio se ha creado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el custodio.',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateCustodio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, custodio }: { id: string; custodio: Partial<CustodioForm> }) =>
      custodiosService.update(id, custodio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast({
        title: 'Custodio actualizado',
        description: 'El custodio se ha actualizado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el custodio.',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateDisponibilidadCustodio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, disponibilidad }: { id: string; disponibilidad: string }) =>
      custodiosService.updateDisponibilidad(id, disponibilidad),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      toast({
        title: 'Disponibilidad actualizada',
        description: 'La disponibilidad del custodio se ha actualizado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la disponibilidad.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA SERVICIOS
// =====================================================

export const useServicios = (filtros?: FiltrosServicios) => {
  return useAuthenticatedQuery(
    ['servicios', JSON.stringify(filtros)],
    () => serviciosService.getAll(filtros)
  );
};

export const useServicio = (id?: string) => {
  return useQuery({
    queryKey: ['servicio', id],
    queryFn: () => id ? serviciosService.getById(id) : null,
    enabled: !!id
  });
};

export const useCreateServicio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (servicio: ServicioForm) => serviciosService.create(servicio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast({
        title: 'Servicio creado',
        description: 'El servicio se ha creado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el servicio.',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateServicio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, servicio }: { id: string; servicio: Partial<ServicioForm> }) =>
      serviciosService.update(id, servicio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast({
        title: 'Servicio actualizado',
        description: 'El servicio se ha actualizado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el servicio.',
        variant: 'destructive',
      });
    }
  });
};

export const useUpdateEstadoServicio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, estado, motivo }: { id: string; estado: string; motivo?: string }) =>
      serviciosService.updateEstado(id, estado, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado del servicio se ha actualizado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del servicio.',
        variant: 'destructive',
      });
    }
  });
};

export const useAsignarCustodio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ servicio_id, custodio_id, oferta_id }: { 
      servicio_id: string; 
      custodio_id: string; 
      oferta_id?: string 
    }) => serviciosService.asignarCustodio(servicio_id, custodio_id, oferta_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['custodios'] });
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast({
        title: 'Custodio asignado',
        description: 'El custodio se ha asignado al servicio correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo asignar el custodio al servicio.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA OFERTAS
// =====================================================

export const useOfertasServicio = (servicio_id?: string) => {
  return useQuery({
    queryKey: ['ofertas', servicio_id],
    queryFn: () => servicio_id ? ofertasService.getByServicio(servicio_id) : [],
    enabled: !!servicio_id
  });
};

export const useCrearOferta = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ servicio_id, custodio_id, score, ola_numero }: {
      servicio_id: string;
      custodio_id: string;
      score?: number;
      ola_numero?: number;
    }) => ofertasService.crear(servicio_id, custodio_id, score, ola_numero),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast({
        title: 'Oferta enviada',
        description: 'La oferta se ha enviado al custodio.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la oferta.',
        variant: 'destructive',
      });
    }
  });
};

export const useResponderOferta = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, estado, motivo }: {
      id: string;
      estado: 'aceptada' | 'rechazada';
      motivo?: string;
    }) => ofertasService.responder(id, estado, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast({
        title: 'Oferta respondida',
        description: 'La respuesta de la oferta se ha registrado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo responder a la oferta.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA EVENTOS DE MONITOREO
// =====================================================

export const useEventosServicio = (servicio_id?: string) => {
  return useQuery({
    queryKey: ['eventos', servicio_id],
    queryFn: () => servicio_id ? eventosService.getByServicio(servicio_id) : [],
    enabled: !!servicio_id
  });
};

export const useCrearEvento = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (evento: Omit<EventoMonitoreo, 'id' | 'created_at'>) =>
      eventosService.crear(evento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast({
        title: 'Evento registrado',
        description: 'El evento de monitoreo se ha registrado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el evento.',
        variant: 'destructive',
      });
    }
  });
};

export const useMarcarEventoResuelto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, notas }: { id: string; notas?: string }) =>
      eventosService.marcarResuelto(id, notas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      toast({
        title: 'Evento resuelto',
        description: 'El evento se ha marcado como resuelto.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo marcar el evento como resuelto.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA TOUCHPOINTS
// =====================================================

export const useTouchpointsServicio = (servicio_id?: string) => {
  return useQuery({
    queryKey: ['touchpoints', servicio_id],
    queryFn: () => servicio_id ? touchpointsService.getByServicio(servicio_id) : [],
    enabled: !!servicio_id
  });
};

export const useCrearTouchpoint = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (touchpoint: Omit<Touchpoint, 'id' | 'created_at'>) =>
      touchpointsService.crear(touchpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['touchpoints'] });
      toast({
        title: 'Touchpoint registrado',
        description: 'El punto de contacto se ha registrado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el touchpoint.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA COSTOS
// =====================================================

export const useCostosServicio = (servicio_id?: string) => {
  return useQuery({
    queryKey: ['costos', servicio_id],
    queryFn: () => servicio_id ? costosService.getByServicio(servicio_id) : null,
    enabled: !!servicio_id
  });
};

export const useUpdateCostos = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ servicio_id, costos }: { 
      servicio_id: string; 
      costos: Partial<CostoIngreso> 
    }) => costosService.update(servicio_id, costos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costos'] });
      toast({
        title: 'Costos actualizados',
        description: 'Los costos del servicio se han actualizado.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los costos.',
        variant: 'destructive',
      });
    }
  });
};

// =====================================================
// HOOKS PARA SCORING
// =====================================================

export const useConfigScoring = () => {
  return useAuthenticatedQuery(
    ['config-scoring'],
    () => scoringService.getConfigActiva()
  );
};

export const useCalcularScores = () => {
  return useMutation({
    mutationFn: scoringService.calcularScores,
  });
};

// =====================================================
// HOOKS PARA REPORTES Y KPIS
// =====================================================

export const useKPIDashboard = (fecha_desde?: string, fecha_hasta?: string) => {
  return useAuthenticatedQuery(
    ['kpi-dashboard', fecha_desde, fecha_hasta],
    () => reportesService.getKPIDashboard(fecha_desde, fecha_hasta)
  );
};