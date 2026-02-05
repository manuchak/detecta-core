import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteEnRutas {
  id: string | null;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
  es_cliente_maestro: boolean;
  rutas_count: number;
  origen: 'pc_clientes' | 'solo_rutas' | 'ambos';
}

export interface ClienteParaEditar {
  id: string;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
}

/**
 * Hook para obtener todos los clientes que tienen rutas asociadas
 * Combina datos de pc_clientes y matriz_precios_rutas
 */
export const useClientesEnRutas = () => {
  return useQuery({
    queryKey: ['clientes-en-rutas'],
    queryFn: async (): Promise<ClienteEnRutas[]> => {
      // 1. Obtener clientes de pc_clientes (tabla maestra)
      const { data: clientesMaestro, error: errorMaestro } = await supabase
        .from('pc_clientes')
        .select('id, nombre, razon_social, rfc')
        .eq('activo', true);

      if (errorMaestro) throw errorMaestro;

      // 2. Obtener conteo de rutas por cliente
      const { data: rutasData, error: errorRutas } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre')
        .eq('activo', true);

      if (errorRutas) throw errorRutas;

      // 3. Contar rutas por nombre de cliente
      const rutasCount = new Map<string, number>();
      rutasData?.forEach(r => {
        const normalizedName = r.cliente_nombre.toUpperCase().trim();
        rutasCount.set(normalizedName, (rutasCount.get(normalizedName) || 0) + 1);
      });

      // 4. Crear mapa de clientes maestros
      const clientesMap = new Map<string, ClienteEnRutas>();
      
      clientesMaestro?.forEach(c => {
        const normalizedName = c.nombre.toUpperCase().trim();
        const count = rutasCount.get(normalizedName) || 0;
        
        clientesMap.set(normalizedName, {
          id: c.id,
          nombre: c.nombre,
          razon_social: c.razon_social,
          rfc: c.rfc,
          es_cliente_maestro: true,
          rutas_count: count,
          origen: count > 0 ? 'ambos' : 'pc_clientes'
        });
      });

      // 5. Agregar clientes que solo existen en rutas
      rutasCount.forEach((count, normalizedName) => {
        if (!clientesMap.has(normalizedName)) {
          // Buscar el nombre original (no normalizado) de las rutas
          const originalName = rutasData?.find(
            r => r.cliente_nombre.toUpperCase().trim() === normalizedName
          )?.cliente_nombre || normalizedName;

          clientesMap.set(normalizedName, {
            id: null,
            nombre: originalName,
            razon_social: null,
            rfc: null,
            es_cliente_maestro: false,
            rutas_count: count,
            origen: 'solo_rutas'
          });
        }
      });

      // 6. Convertir a array y ordenar
      return Array.from(clientesMap.values())
        .filter(c => c.rutas_count > 0) // Solo clientes con rutas
        .sort((a, b) => {
          // Primero los que tienen más rutas
          if (b.rutas_count !== a.rutas_count) {
            return b.rutas_count - a.rutas_count;
          }
          // Luego alfabéticamente
          return a.nombre.localeCompare(b.nombre);
        });
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para buscar clientes en el autocomplete
 * Devuelve coincidencias de pc_clientes primero, luego de rutas
 */
export const useClienteSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['cliente-search', searchTerm],
    queryFn: async (): Promise<ClienteEnRutas[]> => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const normalizedSearch = searchTerm.toUpperCase().trim();

      // 1. Buscar en pc_clientes
      const { data: clientesMaestro, error: errorMaestro } = await supabase
        .from('pc_clientes')
        .select('id, nombre, razon_social, rfc')
        .eq('activo', true)
        .ilike('nombre', `%${searchTerm}%`)
        .limit(10);

      if (errorMaestro) throw errorMaestro;

      // 2. Buscar en matriz_precios_rutas
      const { data: rutasData, error: errorRutas } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre')
        .eq('activo', true)
        .ilike('cliente_nombre', `%${searchTerm}%`);

      if (errorRutas) throw errorRutas;

      // 3. Crear mapa de resultados
      const resultMap = new Map<string, ClienteEnRutas>();

      // Agregar clientes maestros primero (prioridad)
      clientesMaestro?.forEach(c => {
        const normalizedName = c.nombre.toUpperCase().trim();
        resultMap.set(normalizedName, {
          id: c.id,
          nombre: c.nombre,
          razon_social: c.razon_social,
          rfc: c.rfc,
          es_cliente_maestro: true,
          rutas_count: 0,
          origen: 'pc_clientes'
        });
      });

      // Agregar clientes solo de rutas
      const rutasCount = new Map<string, { count: number; originalName: string }>();
      rutasData?.forEach(r => {
        const normalizedName = r.cliente_nombre.toUpperCase().trim();
        const existing = rutasCount.get(normalizedName);
        if (existing) {
          existing.count++;
        } else {
          rutasCount.set(normalizedName, { count: 1, originalName: r.cliente_nombre });
        }
      });

      rutasCount.forEach(({ count, originalName }, normalizedName) => {
        if (resultMap.has(normalizedName)) {
          const existing = resultMap.get(normalizedName)!;
          existing.rutas_count = count;
          existing.origen = 'ambos';
        } else {
          resultMap.set(normalizedName, {
            id: null,
            nombre: originalName,
            razon_social: null,
            rfc: null,
            es_cliente_maestro: false,
            rutas_count: count,
            origen: 'solo_rutas'
          });
        }
      });

      return Array.from(resultMap.values())
        .sort((a, b) => {
          // Priorizar clientes maestros
          if (a.es_cliente_maestro && !b.es_cliente_maestro) return -1;
          if (!a.es_cliente_maestro && b.es_cliente_maestro) return 1;
          return a.nombre.localeCompare(b.nombre);
        })
        .slice(0, 15);
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 segundos
  });
};

/**
 * Hook para actualizar el nombre comercial de un cliente
 */
export const useUpdateClienteNombre = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clienteId, 
      nuevoNombre, 
      nombreAnterior 
    }: { 
      clienteId: string; 
      nuevoNombre: string; 
      nombreAnterior: string;
    }) => {
      const { data, error } = await supabase
        .from('pc_clientes')
        .update({ nombre: nuevoNombre })
        .eq('id', clienteId)
        .select()
        .single();

      if (error) throw error;

      // Registrar en historial (opcional - si existe la tabla)
      console.log(`📝 Nombre comercial actualizado: "${nombreAnterior}" → "${nuevoNombre}"`);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-en-rutas'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-search'] });
      queryClient.invalidateQueries({ queryKey: ['all-clientes-unified'] });
      queryClient.invalidateQueries({ queryKey: ['clientes-from-pricing'] });
      toast.success('Nombre comercial actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error actualizando nombre:', error);
      toast.error('Error al actualizar el nombre comercial');
    }
  });
};

/**
 * Hook para crear un nuevo cliente en pc_clientes
 */
export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nombre }: { nombre: string }) => {
      const { data, error } = await supabase
        .from('pc_clientes')
        .insert({ 
          nombre,
          activo: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-en-rutas'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-search'] });
      queryClient.invalidateQueries({ queryKey: ['all-clientes-unified'] });
      toast.success('Cliente creado correctamente');
    },
    onError: (error: any) => {
      console.error('Error creando cliente:', error);
      if (error.code === '23505') {
        toast.error('Ya existe un cliente con ese nombre');
      } else {
        toast.error('Error al crear el cliente');
      }
    }
  });
};

/**
 * Hook para obtener el impacto de cambiar un nombre de cliente
 */
export const useClienteImpact = (nombreCliente: string) => {
  return useQuery({
    queryKey: ['cliente-impact', nombreCliente],
    queryFn: async () => {
      if (!nombreCliente) return { rutas: 0, servicios: 0 };

      // Contar rutas afectadas
      const { count: rutasCount, error: errorRutas } = await supabase
        .from('matriz_precios_rutas')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true)
        .ilike('cliente_nombre', nombreCliente);

      if (errorRutas) throw errorRutas;

      // Contar servicios afectados (últimos 90 días)
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 90);

      const { count: serviciosCount, error: errorServicios } = await supabase
        .from('servicios_custodia')
        .select('*', { count: 'exact', head: true })
        .ilike('nombre_cliente', nombreCliente)
        .gte('fecha_servicio', fechaLimite.toISOString().split('T')[0]);

      if (errorServicios) throw errorServicios;

      return {
        rutas: rutasCount || 0,
        servicios: serviciosCount || 0
      };
    },
    enabled: !!nombreCliente,
    staleTime: 60 * 1000, // 1 minuto
  });
};
