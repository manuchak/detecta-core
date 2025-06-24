
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MarcaGPS } from '@/types/wms';

// Datos de marcas GPS reales compatibles con Wialon
const marcasGPSDefault: Omit<MarcaGPS, 'id' | 'created_at'>[] = [
  { nombre: 'Teltonika', pais_origen: 'Lithuania', sitio_web: 'https://teltonika.com', soporte_wialon: true, activo: true },
  { nombre: 'Aplicom', pais_origen: 'Finland', sitio_web: 'https://aplicom.com', soporte_wialon: true, activo: true },
  { nombre: 'Calamp', pais_origen: 'United States', sitio_web: 'https://calamp.com', soporte_wialon: true, activo: true },
  { nombre: 'Concox', pais_origen: 'China', sitio_web: 'https://concox.com', soporte_wialon: true, activo: true },
  { nombre: 'Meitrack', pais_origen: 'China', sitio_web: 'https://meitrack.com', soporte_wialon: true, activo: true },
  { nombre: 'Queclink', pais_origen: 'China', sitio_web: 'https://queclink.com', soporte_wialon: true, activo: true },
  { nombre: 'Teltonika Networks', pais_origen: 'Lithuania', sitio_web: 'https://teltonika-networks.com', soporte_wialon: true, activo: true },
  { nombre: 'Ruptela', pais_origen: 'Lithuania', sitio_web: 'https://ruptela.com', soporte_wialon: true, activo: true },
  { nombre: 'Globalsat', pais_origen: 'Taiwan', sitio_web: 'https://globalsat.com.tw', soporte_wialon: true, activo: true },
  { nombre: 'Galileosky', pais_origen: 'Russia', sitio_web: 'https://galileosky.com', soporte_wialon: true, activo: true },
  { nombre: 'Lantronix', pais_origen: 'United States', sitio_web: 'https://lantronix.com', soporte_wialon: true, activo: true },
  { nombre: 'Navixy', pais_origen: 'Cyprus', sitio_web: 'https://navixy.com', soporte_wialon: true, activo: true },
  { nombre: 'Sinotrack', pais_origen: 'China', sitio_web: 'https://sinotrack.com', soporte_wialon: true, activo: true },
  { nombre: 'Suntech', pais_origen: 'South Korea', sitio_web: 'https://suntech.com.tw', soporte_wialon: true, activo: true },
  { nombre: 'Xirgo', pais_origen: 'United States', sitio_web: 'https://xirgo.com', soporte_wialon: true, activo: true },
  { nombre: 'Otro', pais_origen: 'Personalizado', sitio_web: '', soporte_wialon: false, activo: true }
];

export const useMarcasGPS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: marcas, isLoading, error } = useQuery({
    queryKey: ['marcas-gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as MarcaGPS[];
    }
  });

  const createMarca = useMutation({
    mutationFn: async (marca: Omit<MarcaGPS, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .insert(marca)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-gps'] });
      toast({
        title: "Marca creada",
        description: "La marca de GPS ha sido registrada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la marca.",
        variant: "destructive",
      });
    }
  });

  const updateMarca = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarcaGPS> & { id: string }) => {
      const { data, error } = await supabase
        .from('marcas_gps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-gps'] });
      toast({
        title: "Marca actualizada",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  const initializeMarcasGPS = useMutation({
    mutationFn: async () => {
      // Verificar si ya hay marcas
      const { data: existingMarcas } = await supabase
        .from('marcas_gps')
        .select('id')
        .limit(1);

      if (!existingMarcas || existingMarcas.length === 0) {
        const { data, error } = await supabase
          .from('marcas_gps')
          .insert(marcasGPSDefault)
          .select();

        if (error) throw error;
        return data;
      }
      return existingMarcas;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-gps'] });
      toast({
        title: "Base de datos inicializada",
        description: "Las marcas GPS han sido cargadas.",
      });
    }
  });

  return {
    marcas,
    isLoading,
    error,
    createMarca,
    updateMarca,
    initializeMarcasGPS
  };
};
