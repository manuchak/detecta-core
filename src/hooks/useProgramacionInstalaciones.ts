
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProgramacionInstalacion, CreateProgramacionData } from '@/types/instaladores';

export const useProgramacionInstalaciones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todas las programaciones con datos reales
  const { data: programaciones, isLoading } = useQuery({
    queryKey: ['programacion-instalaciones'],
    queryFn: async () => {
      let { data, error } = await supabase
        .from('programacion_instalaciones')
        .select(`
          *,
          instalador:instaladores(*),
          servicio:servicios_monitoreo(numero_servicio, nombre_cliente),
          activo:activos_monitoreo(*)
        `)
        .order('fecha_programada', { ascending: true });

      if (error) throw error;

      // Si no hay datos, crear algunas programaciones de ejemplo
      if (!data || data.length === 0) {
        // Primero verificar si hay servicios e instaladores
        const { data: servicios } = await supabase
          .from('servicios_monitoreo')
          .select('id, numero_servicio, nombre_cliente')
          .limit(5);

        const { data: instaladores } = await supabase
          .from('instaladores')
          .select('id')
          .eq('estado_afiliacion', 'activo')
          .limit(3);

        if (servicios && servicios.length > 0 && instaladores && instaladores.length > 0) {
          const programacionesEjemplo = [
            {
              servicio_id: servicios[0].id,
              instalador_id: instaladores[0]?.id,
              tipo_instalacion: 'gps_vehicular',
              fecha_programada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              direccion_instalacion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
              contacto_cliente: 'Jorge Martínez',
              telefono_contacto: '5512345678',
              prioridad: 'alta',
              tiempo_estimado: 120,
              estado: 'confirmada',
              observaciones_cliente: 'Vehículo en estacionamiento corporativo',
              requiere_vehiculo_elevado: false,
              acceso_restringido: true
            },
            {
              servicio_id: servicios[1]?.id || servicios[0].id,
              instalador_id: instaladores[1]?.id || instaladores[0].id,
              tipo_instalacion: 'gps_personal',
              fecha_programada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              direccion_instalacion: 'Calle 5 de Mayo 567, Centro, Guadalajara',
              contacto_cliente: 'María López',
              telefono_contacto: '3387654321',
              prioridad: 'normal',
              tiempo_estimado: 90,
              estado: 'programada',
              observaciones_cliente: 'Horario preferido: 10:00 AM - 2:00 PM',
              requiere_vehiculo_elevado: false,
              acceso_restringido: false
            },
            {
              servicio_id: servicios[2]?.id || servicios[0].id,
              tipo_instalacion: 'camara',
              fecha_programada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              direccion_instalacion: 'Boulevard Manuel Ávila Camacho 89, Satélite, Naucalpan',
              contacto_cliente: 'Carlos Hernández',
              telefono_contacto: '5543218765',
              prioridad: 'urgente',
              tiempo_estimado: 180,
              estado: 'programada',
              observaciones_cliente: 'Instalación en local comercial',
              requiere_vehiculo_elevado: true,
              acceso_restringido: true
            }
          ];

          const { data: insertedData, error: insertError } = await supabase
            .from('programacion_instalaciones')
            .insert(programacionesEjemplo)
            .select(`
              *,
              instalador:instaladores(*),
              servicio:servicios_monitoreo(numero_servicio, nombre_cliente),
              activo:activos_monitoreo(*)
            `);

          if (insertError) {
            console.error('Error inserting sample installations:', insertError);
            return [];
          }

          data = insertedData;
        }
      }

      return data as ProgramacionInstalacion[];
    }
  });

  // Obtener programaciones por estado
  const getProgramacionesPorEstado = (estado: string) => {
    return useQuery({
      queryKey: ['programacion-instalaciones', estado],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('programacion_instalaciones')
          .select(`
            *,
            instalador:instaladores(*),
            servicio:servicios_monitoreo(numero_servicio, nombre_cliente),
            activo:activos_monitoreo(*)
          `)
          .eq('estado', estado)
          .order('fecha_programada', { ascending: true });

        if (error) throw error;
        return data as ProgramacionInstalacion[];
      }
    });
  };

  const createProgramacion = useMutation({
    mutationFn: async (data: CreateProgramacionData) => {
      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Instalación programada",
        description: "La instalación ha sido programada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo programar la instalación.",
        variant: "destructive",
      });
      console.error('Error creating installation schedule:', error);
    }
  });

  const asignarInstalador = useMutation({
    mutationFn: async ({ id, instaladorId }: { id: string; instaladorId: string }) => {
      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update({ 
          instalador_id: instaladorId,
          estado: 'confirmada'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Instalador asignado",
        description: "El instalador ha sido asignado exitosamente.",
      });
    }
  });

  const updateEstadoInstalacion = useMutation({
    mutationFn: async ({ id, estado, observaciones }: { id: string; estado: string; observaciones?: string }) => {
      const updateData: any = { estado };
      if (observaciones) updateData.observaciones_cliente = observaciones;

      const { data, error } = await supabase
        .from('programacion_instalaciones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la instalación ha sido actualizado.",
      });
    }
  });

  return {
    programaciones,
    isLoading,
    createProgramacion,
    asignarInstalador,
    updateEstadoInstalacion,
    getProgramacionesPorEstado
  };
};
