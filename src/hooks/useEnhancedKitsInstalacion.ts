import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedGpsRecomendacion {
  producto_id: string;
  nombre: string;
  marca: string;
  modelo: string;
  precio_venta: number;
  stock_disponible: number;
  score: number;
  sensores_compatibles: string[];
  tipo_sim_recomendado?: string;
  requiere_microsd: boolean;
  justificacion: string[];
}

export interface KitAsignado {
  id: string;
  numero_serie_kit: string;
  gps_producto: {
    id: string;
    nombre: string;
    marca: string;
    modelo: string;
  };
  sim_producto?: {
    id: string;
    nombre: string;
    operador: string;
  };
  microsd_producto?: {
    id: string;
    nombre: string;
    capacidad_gb: number;
  };
  estado_kit: string;
  score_recomendacion: number;
  justificacion_seleccion: Record<string, any>;
}

export const useEnhancedKitsInstalacion = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Obtener recomendaciones inteligentes de GPS
  const obtenerRecomendacionesInteligentes = async (
    tipoVehiculo: string, 
    sensoresRequeridos: string[] = [],
    tipoInstalacion: string = 'gps_basico'
  ): Promise<EnhancedGpsRecomendacion[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos_inventario')
        .select(`
          id,
          nombre,
          marca,
          modelo,
          precio_venta_sugerido,
          configuraciones:configuraciones_producto(parametro, valor),
          stock:stock_productos(cantidad_disponible),
          categoria:categorias_productos(nombre)
        `)
        .eq('activo', true)
        .or('categoria.nombre.ilike.%gps%,categoria.nombre.ilike.%tracker%')
        .gt('stock.cantidad_disponible', 0);

      if (error) throw error;

      // Algoritmo de scoring inteligente
      const recomendaciones = (data || []).map(producto => {
        let score = 50; // Base score
        const justificacion: string[] = [];

        // Score por disponibilidad de stock
        const stockDisponible = producto.stock?.[0]?.cantidad_disponible || 0;
        if (stockDisponible > 5) {
          score += 20;
          justificacion.push('Stock abundante disponible');
        } else if (stockDisponible > 0) {
          score += 10;
          justificacion.push('Stock limitado');
        }

        // Score por compatibilidad con sensores
        const configuraciones = producto.configuraciones || [];
        const sensoresCompatibles = configuraciones
          .filter(config => config.parametro.includes('sensor'))
          .map(config => config.valor);

        const sensoresCoincidentes = sensoresRequeridos.filter(sensor => 
          sensoresCompatibles.some(compatible => 
            compatible.toLowerCase().includes(sensor.toLowerCase())
          )
        );

        if (sensoresCoincidentes.length > 0) {
          score += sensoresCoincidentes.length * 10;
          justificacion.push(`Compatible con ${sensoresCoincidentes.length} sensores requeridos`);
        }

        // Score por precio (favorece productos de rango medio)
        const precio = producto.precio_venta_sugerido || 0;
        if (precio < 2000) {
          score += 15;
          justificacion.push('Precio económico');
        } else if (precio < 5000) {
          score += 10;
          justificacion.push('Precio competitivo');
        } else {
          score += 5;
          justificacion.push('Producto premium');
        }

        // Determinar si requiere microSD basado en configuraciones
        const requiereMicrosd = configuraciones.some(config => 
          config.parametro.toLowerCase().includes('microsd') || 
          config.parametro.toLowerCase().includes('almacenamiento')
        );

        return {
          producto_id: producto.id,
          nombre: producto.nombre,
          marca: producto.marca || 'N/A',
          modelo: producto.modelo || 'N/A',
          precio_venta: precio,
          stock_disponible: stockDisponible,
          score,
          sensores_compatibles: sensoresCompatibles,
          requiere_microsd: requiereMicrosd,
          justificacion
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recomendaciones

      return recomendaciones;
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron obtener las recomendaciones de GPS",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-asignar kit completo usando la función de base de datos
  const autoAsignarKitCompleto = useMutation({
    mutationFn: async ({
      programacionId,
      tipoVehiculo,
      sensoresRequeridos
    }: {
      programacionId: string;
      tipoVehiculo?: string;
      sensoresRequeridos?: string[];
    }) => {
      const { data, error } = await supabase.rpc('auto_asignar_kit_instalacion', {
        p_programacion_id: programacionId,
        p_tipo_vehiculo: tipoVehiculo || null,
        p_sensores_requeridos: sensoresRequeridos || [],
        p_forzar_asignacion: false
      });

      if (error) throw error;
      return data as any;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast({
          title: "Kit asignado automáticamente",
          description: `Kit ${data.numero_serie} creado exitosamente`,
          variant: "default"
        });
        queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
        queryClient.invalidateQueries({ queryKey: ['kits-asignados'] });
      } else {
        toast({
          title: "Error en asignación automática",
          description: data?.error || "No se pudo asignar el kit automáticamente",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Error en auto-asignación:', error);
      toast({
        title: "Error",
        description: "Error al realizar la asignación automática",
        variant: "destructive"
      });
    }
  });

  // Obtener kit asignado para una programación
  const { data: kitAsignado, isLoading: isLoadingKit } = useQuery({
    queryKey: ['kit-asignado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kits_instalacion_asignados')
        .select(`
          *,
          gps_producto:productos_inventario!gps_producto_id(id, nombre, marca, modelo),
          sim_producto:productos_inventario!sim_producto_id(id, nombre, marca),
          microsd_producto:productos_inventario!microsd_producto_id(id, nombre, marca)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  // Obtener estadísticas de stock para dashboard
  const { data: stockStats } = useQuery({
    queryKey: ['stock-stats-kits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_instalaciones_dashboard')
        .select('*')
        .limit(20);

      if (error) throw error;

      const stats = {
        instalaciones_pendientes: data?.filter(item => !item.auto_asignacion_completada).length || 0,
        kits_asignados: data?.filter(item => item.numero_serie_kit).length || 0,
        stock_critico: data?.filter(item => item.stock_gps_status === 'agotado').length || 0,
        score_promedio: data?.reduce((acc, item) => acc + (item.score_recomendacion || 0), 0) / (data?.length || 1)
      };

      return stats;
    },
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  return {
    // Funciones principales
    obtenerRecomendacionesInteligentes,
    autoAsignarKitCompleto,
    
    // Estados de carga
    isLoading,
    isCreatingKit: autoAsignarKitCompleto.isPending,
    isLoadingKit,
    
    // Datos
    kitAsignado,
    stockStats,
    
    // Utilidades
    resetAutoAsignacion: () => autoAsignarKitCompleto.reset()
  };
};