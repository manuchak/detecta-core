
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InstalacionDocumentacion {
  id: string;
  programacion_id: string;
  paso_instalacion: string;
  foto_url?: string;
  descripcion?: string;
  orden: number;
  completado: boolean;
  coordenadas_latitud?: number;
  coordenadas_longitud?: number;
  created_at: string;
  created_by?: string;
}

export interface InstalacionValidacion {
  id: string;
  programacion_id: string;
  tipo_validacion: string;
  validado: boolean;
  comentarios?: string;
  puntuacion?: number;
  created_at: string;
  created_by?: string;
}

export interface InstalacionReporteFinal {
  id: string;
  programacion_id: string;
  comentarios_instalador?: string;
  comentarios_cliente?: string;
  tiempo_total_minutos?: number;
  dificultades_encontradas?: string[];
  materiales_adicionales_usados?: string[];
  recomendaciones?: string;
  calificacion_servicio?: number;
  firma_cliente_url?: string;
  created_at: string;
  created_by?: string;
}

export const useInstalacionDocumentacion = (programacionId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener documentación de instalación
  const { data: documentacion, isLoading: loadingDocumentacion } = useQuery({
    queryKey: ['instalacion-documentacion', programacionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instalacion_documentacion')
        .select('*')
        .eq('programacion_id', programacionId)
        .order('orden', { ascending: true });

      if (error) throw error;
      return data as InstalacionDocumentacion[];
    }
  });

  // Obtener validaciones
  const { data: validaciones, isLoading: loadingValidaciones } = useQuery({
    queryKey: ['instalacion-validaciones', programacionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instalacion_validaciones')
        .select('*')
        .eq('programacion_id', programacionId);

      if (error) throw error;
      return data as InstalacionValidacion[];
    }
  });

  // Obtener reporte final
  const { data: reporteFinal, isLoading: loadingReporte } = useQuery({
    queryKey: ['instalacion-reporte-final', programacionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instalacion_reporte_final')
        .select('*')
        .eq('programacion_id', programacionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as InstalacionReporteFinal | null;
    }
  });

  // Subir foto
  const subirFoto = useMutation({
    mutationFn: async ({ file, pasoInstalacion }: { file: File; pasoInstalacion: string }) => {
      const fileName = `${programacionId}/${pasoInstalacion}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('instalacion-fotos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('instalacion-fotos')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onError: (error) => {
      toast({
        title: "Error al subir foto",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Crear o actualizar documentación
  const guardarDocumentacion = useMutation({
    mutationFn: async (data: Partial<InstalacionDocumentacion>) => {
      const { data: result, error } = await supabase
        .from('instalacion_documentacion')
        .upsert({
          ...data,
          programacion_id: programacionId
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalacion-documentacion', programacionId] });
      toast({
        title: "Documentación guardada",
        description: "La información ha sido guardada exitosamente.",
      });
    }
  });

  // Guardar validación
  const guardarValidacion = useMutation({
    mutationFn: async (data: Partial<InstalacionValidacion>) => {
      const { data: result, error } = await supabase
        .from('instalacion_validaciones')
        .upsert({
          ...data,
          programacion_id: programacionId
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalacion-validaciones', programacionId] });
    }
  });

  // Guardar reporte final
  const guardarReporteFinal = useMutation({
    mutationFn: async (data: Partial<InstalacionReporteFinal>) => {
      const { data: result, error } = await supabase
        .from('instalacion_reporte_final')
        .upsert({
          ...data,
          programacion_id: programacionId
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalacion-reporte-final', programacionId] });
      toast({
        title: "Reporte final guardado",
        description: "El reporte de instalación ha sido completado.",
      });
    }
  });

  return {
    documentacion,
    validaciones,
    reporteFinal,
    isLoading: loadingDocumentacion || loadingValidaciones || loadingReporte,
    subirFoto,
    guardarDocumentacion,
    guardarValidacion,
    guardarReporteFinal
  };
};
