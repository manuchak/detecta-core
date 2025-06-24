
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MarcaGPS } from '@/types/wms';

// Marcas GPS reales compatibles con Wialon - Base de datos enriquecida
const marcasGPSDefault: Omit<MarcaGPS, 'id' | 'created_at'>[] = [
  // Marcas principales con amplio soporte
  { nombre: 'Teltonika', pais_origen: 'Lithuania', sitio_web: 'https://teltonika-gps.com', soporte_wialon: true, activo: true },
  { nombre: 'Aplicom', pais_origen: 'Finland', sitio_web: 'https://aplicom.com', soporte_wialon: true, activo: true },
  { nombre: 'Calamp', pais_origen: 'United States', sitio_web: 'https://calamp.com', soporte_wialon: true, activo: true },
  { nombre: 'Concox', pais_origen: 'China', sitio_web: 'https://concox.com', soporte_wialon: true, activo: true },
  { nombre: 'Meitrack', pais_origen: 'China', sitio_web: 'https://meitrack.com', soporte_wialon: true, activo: true },
  { nombre: 'Queclink', pais_origen: 'China', sitio_web: 'https://queclink.com', soporte_wialon: true, activo: true },
  { nombre: 'Ruptela', pais_origen: 'Lithuania', sitio_web: 'https://ruptela.com', soporte_wialon: true, activo: true },
  { nombre: 'Galileosky', pais_origen: 'Russia', sitio_web: 'https://galileosky.com', soporte_wialon: true, activo: true },
  
  // Marcas adicionales con soporte Wialon
  { nombre: 'BCE', pais_origen: 'Lithuania', sitio_web: 'https://bce.lt', soporte_wialon: true, activo: true },
  { nombre: 'Bitrek', pais_origen: 'Ukraine', sitio_web: 'https://bitrek.ua', soporte_wialon: true, activo: true },
  { nombre: 'Coban', pais_origen: 'China', sitio_web: 'https://coban-gps.com', soporte_wialon: true, activo: true },
  { nombre: 'Enfora', pais_origen: 'United States', sitio_web: 'https://enfora.com', soporte_wialon: true, activo: true },
  { nombre: 'Globalsat', pais_origen: 'Taiwan', sitio_web: 'https://globalsat.com.tw', soporte_wialon: true, activo: true },
  { nombre: 'Gosafe', pais_origen: 'Taiwan', sitio_web: 'https://gosafe-tech.com', soporte_wialon: true, activo: true },
  { nombre: 'GT06', pais_origen: 'China', sitio_web: 'https://gt06.com', soporte_wialon: true, activo: true },
  { nombre: 'Howen', pais_origen: 'China', sitio_web: 'https://howen.com.cn', soporte_wialon: true, activo: true },
  { nombre: 'Lantronix', pais_origen: 'United States', sitio_web: 'https://lantronix.com', soporte_wialon: true, activo: true },
  { nombre: 'Maestro', pais_origen: 'Russia', sitio_web: 'https://m2m-tele.com', soporte_wialon: true, activo: true },
  { nombre: 'Navixy', pais_origen: 'Cyprus', sitio_web: 'https://navixy.com', soporte_wialon: true, activo: true },
  { nombre: 'Navtelecom', pais_origen: 'Russia', sitio_web: 'https://navtelecom.ru', soporte_wialon: true, activo: true },
  { nombre: 'Omnicomm', pais_origen: 'Russia', sitio_web: 'https://omnicomm.ru', soporte_wialon: true, activo: true },
  { nombre: 'Pretrollink', pais_origen: 'Ukraine', sitio_web: 'https://petrollink.ru', soporte_wialon: true, activo: true },
  { nombre: 'Sinotrack', pais_origen: 'China', sitio_web: 'https://sinotrack.com', soporte_wialon: true, activo: true },
  { nombre: 'Suntech', pais_origen: 'South Korea', sitio_web: 'https://suntech.com.tw', soporte_wialon: true, activo: true },
  { nombre: 'Topfly', pais_origen: 'China', sitio_web: 'https://topfly-tech.com', soporte_wialon: true, activo: true },
  { nombre: 'Wonde', pais_origen: 'China', sitio_web: 'https://wonde.com', soporte_wialon: true, activo: true },
  { nombre: 'Xirgo', pais_origen: 'United States', sitio_web: 'https://xirgo.com', soporte_wialon: true, activo: true },
  
  // Marcas especializadas
  { nombre: 'Arnavi', pais_origen: 'Russia', sitio_web: 'https://arnavi.com', soporte_wialon: true, activo: true },
  { nombre: 'Autolink', pais_origen: 'Taiwan', sitio_web: 'https://autolink.com.tw', soporte_wialon: true, activo: true },
  { nombre: 'CalAmp LMU', pais_origen: 'United States', sitio_web: 'https://calamp.com/lmu', soporte_wialon: true, activo: true },
  { nombre: 'Castel', pais_origen: 'China', sitio_web: 'https://castel-gps.com', soporte_wialon: true, activo: true },
  { nombre: 'FM-Tec', pais_origen: 'Germany', sitio_web: 'https://fm-tec.de', soporte_wialon: true, activo: true },
  { nombre: 'Geolink', pais_origen: 'Brazil', sitio_web: 'https://geolink.com.br', soporte_wialon: true, activo: true },
  { nombre: 'Iridium', pais_origen: 'United States', sitio_web: 'https://iridium.com', soporte_wialon: true, activo: true },
  { nombre: 'Jointech', pais_origen: 'China', sitio_web: 'https://jointech.com', soporte_wialon: true, activo: true },
  { nombre: 'Kingneed', pais_origen: 'China', sitio_web: 'https://kingneed.com', soporte_wialon: true, activo: true },
  { nombre: 'Mobileye', pais_origen: 'Israel', sitio_web: 'https://mobileye.com', soporte_wialon: false, activo: true },
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
