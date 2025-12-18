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

export interface ClienteUnificado {
  nombre: string;
  tiene_rutas: boolean;
  rutas_count: number;
  origen: 'pc_clientes' | 'solo_rutas' | 'ambos';
}

export const useAllClientes = () => {
  return useQuery({
    queryKey: ['all-clientes-unified'],
    queryFn: async (): Promise<ClienteUnificado[]> => {
      // 1. Obtener clientes de pc_clientes (tabla maestra)
      const { data: clientesMaestro, error: errorMaestro } = await supabase
        .from('pc_clientes')
        .select('nombre')
        .eq('activo', true);

      if (errorMaestro) throw errorMaestro;

      // 2. Obtener clientes de matriz_precios_rutas
      const { data: clientesConRutas, error: errorRutas } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, destino_texto')
        .eq('activo', true);

      if (errorRutas) throw errorRutas;

      // 3. Combinar y enriquecer
      const clientesMap = new Map<string, ClienteUnificado>();
      
      // Agregar clientes maestros
      clientesMaestro?.forEach(c => {
        clientesMap.set(c.nombre, { 
          nombre: c.nombre, 
          tiene_rutas: false, 
          rutas_count: 0,
          origen: 'pc_clientes'
        });
      });
      
      // Enriquecer con info de rutas
      const rutasCount = new Map<string, number>();
      clientesConRutas?.forEach(c => {
        rutasCount.set(c.cliente_nombre, (rutasCount.get(c.cliente_nombre) || 0) + 1);
      });

      rutasCount.forEach((count, clienteNombre) => {
        if (clientesMap.has(clienteNombre)) {
          const existing = clientesMap.get(clienteNombre)!;
          existing.tiene_rutas = true;
          existing.rutas_count = count;
          existing.origen = 'ambos';
        } else {
          clientesMap.set(clienteNombre, {
            nombre: clienteNombre,
            tiene_rutas: true,
            rutas_count: count,
            origen: 'solo_rutas'
          });
        }
      });

      return Array.from(clientesMap.values()).sort((a, b) => {
        // Priorizar clientes con rutas
        if (a.tiene_rutas && !b.tiene_rutas) return -1;
        if (!a.tiene_rutas && b.tiene_rutas) return 1;
        return a.nombre.localeCompare(b.nombre);
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

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

// Función helper para normalizar texto de ubicaciones
const normalizeLocationText = (text: string): string => {
  return text
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\s*(EDO\.?\s*MEX\.?|EDOMEX|ESTADO DE MEXICO)\s*$/i, '') // Quitar sufijos de estado
    .replace(/\s+/g, ' ') // Normalizar espacios
    .replace(/,\s*/g, ' ') // Reemplazar comas por espacios
    .trim();
};

// Función para extraer palabras clave de una ubicación
const extractLocationKeywords = (text: string): string[] => {
  const normalized = normalizeLocationText(text);
  return normalized.split(' ').filter(word => word.length > 2);
};

export const useDestinosFromPricing = (clienteNombre?: string, origenTexto?: string) => {
  return useQuery({
    queryKey: ['destinos-from-pricing', clienteNombre, origenTexto],
    queryFn: async (): Promise<string[]> => {
      console.log('🔍 [useDestinosFromPricing] Buscando destinos:', { clienteNombre, origenTexto });
      
      if (!clienteNombre) return [];

      // Búsqueda flexible: usar ILIKE con la primera palabra clave del origen
      let query = supabase
        .from('matriz_precios_rutas')
        .select('destino_texto, origen_texto')
        .eq('activo', true)
        .ilike('cliente_nombre', clienteNombre); // Case-insensitive para cliente

      // Si hay origen seleccionado, buscar con ILIKE flexible
      if (origenTexto) {
        const keywords = extractLocationKeywords(origenTexto);
        const primaryKeyword = keywords[0] || origenTexto;
        
        console.log('🔍 [useDestinosFromPricing] Búsqueda flexible con keyword:', primaryKeyword);
        
        // Usar ILIKE con patrón parcial para encontrar variantes
        query = query.ilike('origen_texto', `%${primaryKeyword}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useDestinosFromPricing] Error:', error);
        throw error;
      }

      // Retornar destinos únicos
      const destinos = Array.from(new Set(data?.map(row => row.destino_texto) || []));
      console.log('✅ [useDestinosFromPricing] Destinos encontrados:', destinos.length, destinos);
      
      return destinos;
    },
    enabled: !!clienteNombre,
    staleTime: 2 * 60 * 1000, // 2 minutos - balance entre cache y frescura
    gcTime: 10 * 60 * 1000, // 10 minutos - suficiente para sesiones activas
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: true, // Refrescar al montar si los datos están stale
    retry: 2, // Reintentar 2 veces en caso de error
    retryDelay: 1000, // Esperar 1 segundo entre reintentos
  });
};