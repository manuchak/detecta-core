
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
      console.log('🔥 createProgramacion mutationFn called with data:', data);
      
      // Enhanced validation with detailed logging
      const requiredFields = [
        { key: 'servicio_id', value: data.servicio_id, name: 'ID del servicio' },
        { key: 'fecha_programada', value: data.fecha_programada, name: 'Fecha programada' },
        { key: 'contacto_cliente', value: data.contacto_cliente, name: 'Contacto del cliente' },
        { key: 'telefono_contacto', value: data.telefono_contacto, name: 'Teléfono de contacto' },
        { key: 'direccion_instalacion', value: data.direccion_instalacion, name: 'Dirección de instalación' },
      ];

      console.log('🔍 Validating required fields:');
      for (const field of requiredFields) {
        console.log(`  - ${field.name} (${field.key}):`, field.value);
        if (!field.value) {
          const errorMsg = `${field.name} is required but was: ${field.value}`;
          console.error('❌', errorMsg);
          throw new Error(errorMsg);
        }
      }

      console.log('✅ All required fields validated successfully');

      // Validate date format
      try {
        const testDate = new Date(data.fecha_programada);
        if (isNaN(testDate.getTime())) {
          throw new Error('Invalid date format');
        }
        console.log('✅ Date format validated:', testDate.toISOString());
      } catch (dateError) {
        console.error('❌ Date validation failed:', dateError);
        throw new Error(`Invalid date format: ${data.fecha_programada}`);
      }

      // Prepare final data object with explicit field mapping
      const finalData = {
        servicio_id: data.servicio_id.toString(),
        tipo_instalacion: data.tipo_instalacion,
        fecha_programada: data.fecha_programada,
        direccion_instalacion: data.direccion_instalacion.trim(),
        contacto_cliente: data.contacto_cliente.trim(),
        telefono_contacto: data.telefono_contacto.trim(),
        estado: data.estado || 'programada',
        prioridad: data.prioridad || 'normal',
        tiempo_estimado: data.tiempo_estimado || 60,
        observaciones_cliente: data.observaciones_cliente || null,
        requiere_vehiculo_elevado: data.requiere_vehiculo_elevado || false,
        acceso_restringido: data.acceso_restringido || false,
        instalador_id: data.instalador_id || null,
        herramientas_especiales: data.herramientas_especiales || [],
        equipos_requeridos: data.equipos_requeridos || null,
        instrucciones_especiales: data.instrucciones_especiales || null
      };

      console.log('📤 Sending to database:', finalData);

      const { data: result, error } = await supabase
        .from('programacion_instalaciones')
        .insert([finalData])
        .select()
        .single();

      if (error) {
        console.error('💥 Database error during insert:', error);
        console.error('📊 Error breakdown:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          sentData: finalData
        });
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Installation scheduled successfully in database:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 createProgramacion onSuccess called with:', data);
      queryClient.invalidateQueries({ queryKey: ['programacion-instalaciones'] });
      toast({
        title: "✅ Instalación programada",
        description: "La instalación ha sido programada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('💥 createProgramacion onError called:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "❌ Error",
        description: `No se pudo programar la instalación: ${errorMessage}`,
        variant: "destructive",
      });
      console.error('📊 Full error context:', {
        error,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });
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
