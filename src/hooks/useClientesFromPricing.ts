import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClienteFromPricing {
  cliente_nombre: string;
  destinos: string[];
  servicios_count: number;
}

export interface DestinoFromPricing {
  destino_texto: string;
  cliente_nombre: string;
}

export const useClientesFromPricing = () => {
  return useQuery({
    queryKey: ['clientes-from-pricing'],
    queryFn: async (): Promise<ClienteFromPricing[]> => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, destino_texto')
        .eq('activo', true);

      if (error) throw error;

      // Agrupar por cliente y contar destinos únicos
      const clientesMap = new Map<string, Set<string>>();
      
      data?.forEach(row => {
        if (!clientesMap.has(row.cliente_nombre)) {
          clientesMap.set(row.cliente_nombre, new Set());
        }
        clientesMap.get(row.cliente_nombre)?.add(row.destino_texto);
      });

      return Array.from(clientesMap.entries()).map(([cliente_nombre, destinos]) => ({
        cliente_nombre,
        destinos: Array.from(destinos),
        servicios_count: destinos.size
      }));
    },
  });
};

export const useOrigenesFromPricing = (clienteNombre?: string) => {
  return useQuery({
    queryKey: ['origenes-from-pricing', clienteNombre],
    queryFn: async (): Promise<string[]> => {
      if (!clienteNombre) return [];

      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('origen_texto')
        .eq('activo', true)
        .eq('cliente_nombre', clienteNombre);

      if (error) throw error;

      // Retornar orígenes únicos
      return Array.from(new Set(data?.map(row => row.origen_texto) || []));
    },
    enabled: !!clienteNombre,
  });
};

export const useDestinosFromPricing = (clienteNombre?: string, origenTexto?: string) => {
  return useQuery({
    queryKey: ['destinos-from-pricing', clienteNombre, origenTexto],
    queryFn: async (): Promise<string[]> => {
      if (!clienteNombre) return [];

      let query = supabase
        .from('matriz_precios_rutas')
        .select('destino_texto')
        .eq('activo', true)
        .eq('cliente_nombre', clienteNombre);

      // Si hay origen seleccionado, filtrar por él también
      if (origenTexto) {
        query = query.eq('origen_texto', origenTexto);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Retornar destinos únicos
      return Array.from(new Set(data?.map(row => row.destino_texto) || []));
    },
    enabled: !!clienteNombre,
    staleTime: 2 * 60 * 1000, // 2 minutos - balance entre cache y frescura
    gcTime: 10 * 60 * 1000, // 10 minutos - suficiente para sesiones activas
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: true, // Refrescar al montar si los datos están stale
  });
};