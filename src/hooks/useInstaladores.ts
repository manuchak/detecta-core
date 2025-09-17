
// @ts-nocheck

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Instalador, CreateInstaladorData } from '@/types/instaladores';

export const useInstaladores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todos los instaladores con datos reales
  const { data: instaladores, isLoading: isLoadingInstaladores } = useQuery({
    queryKey: ['instaladores'],
    queryFn: async () => {
      let { data, error } = await supabase
        .from('instaladores')
        .select('*')
        .order('calificacion_promedio', { ascending: false });

      if (error) throw error;

      // Si no hay datos, crear algunos instaladores de ejemplo
      if (!data || data.length === 0) {
        const instaladoresEjemplo = [
          {
            nombre_completo: 'Juan Carlos Rodríguez',
            telefono: '5512345678',
            email: 'juan.rodriguez@instaladores.com',
            cedula_profesional: 'EL123456',
            especialidades: ['GPS Vehicular', 'Alarmas', 'Cámaras'],
            vehiculo_propio: true,
            calificacion_promedio: 4.8,
            servicios_completados: 156,
            estado_afiliacion: 'activo',
            documentacion_completa: true,
            zona_cobertura: { ciudades: ['CDMX', 'Estado de México'] },
            banco_datos: {
              banco: 'BBVA',
              cuenta: '012345678901',
              clabe: '012180001234567890',
              titular: 'Juan Carlos Rodríguez'
            }
          },
          {
            nombre_completo: 'María Elena Sánchez',
            telefono: '5587654321',
            email: 'maria.sanchez@instaladores.com',
            cedula_profesional: 'EL789012',
            especialidades: ['GPS Personal', 'GPS Vehicular', 'Botones de Pánico'],
            vehiculo_propio: true,
            calificacion_promedio: 4.9,
            servicios_completados: 203,
            estado_afiliacion: 'activo',
            documentacion_completa: true,
            zona_cobertura: { ciudades: ['Guadalajara', 'Zapopan'] },
            banco_datos: {
              banco: 'Santander',
              cuenta: '123456789012',
              clabe: '014180001234567891',
              titular: 'María Elena Sánchez'
            }
          },
          {
            nombre_completo: 'Roberto Méndez Torres',
            telefono: '5543218765',
            email: 'roberto.mendez@instaladores.com',
            especialidades: ['GPS Vehicular', 'Sistemas de Rastreo'],
            vehiculo_propio: false,
            calificacion_promedio: 4.6,
            servicios_completados: 89,
            estado_afiliacion: 'activo',
            documentacion_completa: true,
            zona_cobertura: { ciudades: ['Monterrey', 'San Pedro'] }
          },
          {
            nombre_completo: 'Ana Laura Jiménez',
            telefono: '5598765432',
            email: 'ana.jimenez@instaladores.com',
            cedula_profesional: 'EL345678',
            especialidades: ['Cámaras', 'Alarmas', 'GPS Personal'],
            vehiculo_propio: true,
            calificacion_promedio: 4.7,
            servicios_completados: 127,
            estado_afiliacion: 'activo',
            documentacion_completa: true,
            zona_cobertura: { ciudades: ['Puebla', 'Cholula'] }
          },
          {
            nombre_completo: 'Fernando Gutiérrez López',
            telefono: '5534567890',
            email: 'fernando.gutierrez@instaladores.com',
            especialidades: ['GPS Vehicular'],
            vehiculo_propio: true,
            calificacion_promedio: 4.2,
            servicios_completados: 45,
            estado_afiliacion: 'pendiente',
            documentacion_completa: false,
            zona_cobertura: { ciudades: ['Toluca'] }
          }
        ];

        // Insertar instaladores de ejemplo
        const { data: insertedData, error: insertError } = await supabase
          .from('instaladores')
          .insert(instaladoresEjemplo)
          .select();

        if (insertError) {
          console.error('Error inserting sample installers:', insertError);
          return [];
        }

        data = insertedData;
      }

      return data as Instalador[];
    }
  });

  // Obtener instaladores activos
  const { data: instaladoresActivos } = useQuery({
    queryKey: ['instaladores-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instaladores')
        .select('*')
        .eq('estado_afiliacion', 'activo')
        .eq('documentacion_completa', true)
        .order('calificacion_promedio', { ascending: false });

      if (error) throw error;
      return data as Instalador[];
    }
  });

  // Crear nuevo instalador
  const createInstalador = useMutation({
    mutationFn: async (data: CreateInstaladorData) => {
      const { data: result, error } = await supabase
        .from('instaladores')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instaladores'] });
      queryClient.invalidateQueries({ queryKey: ['instaladores-activos'] });
      toast({
        title: "Instalador registrado",
        description: "El instalador ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el instalador.",
        variant: "destructive",
      });
      console.error('Error creating installer:', error);
    }
  });

  const updateInstalador = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Instalador> }) => {
      const { data: result, error } = await supabase
        .from('instaladores')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instaladores'] });
      queryClient.invalidateQueries({ queryKey: ['instaladores-activos'] });
      toast({
        title: "Instalador actualizado",
        description: "Los datos del instalador han sido actualizados.",
      });
    }
  });

  const cambiarEstadoAfiliacion = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { data, error } = await supabase
        .from('instaladores')
        .update({ estado_afiliacion: estado })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instaladores'] });
      queryClient.invalidateQueries({ queryKey: ['instaladores-activos'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del instalador ha sido actualizado.",
      });
    }
  });

  return {
    instaladores,
    instaladoresActivos,
    isLoadingInstaladores,
    createInstalador,
    updateInstalador,
    cambiarEstadoAfiliacion
  };
};
