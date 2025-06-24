
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ModeloGPS } from '@/types/wms';

export const useModelosGPS = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modelos, isLoading, error } = useQuery({
    queryKey: ['modelos-gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .select(`
          *,
          marca:marcas_gps(*)
        `)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data as ModeloGPS[];
    }
  });

  const getModelosByMarca = useQuery({
    queryKey: ['modelos-gps-by-marca'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .select(`
          *,
          marca:marcas_gps(*)
        `)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      // Agrupar por marca
      const modelosPorMarca: Record<string, ModeloGPS[]> = {};
      (data as ModeloGPS[]).forEach(modelo => {
        const marcaId = modelo.marca_id;
        if (!modelosPorMarca[marcaId]) {
          modelosPorMarca[marcaId] = [];
        }
        modelosPorMarca[marcaId].push(modelo);
      });
      
      return modelosPorMarca;
    }
  });

  const createModelo = useMutation({
    mutationFn: async (modelo: Omit<ModeloGPS, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .insert(modelo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['modelos-gps-by-marca'] });
      toast({
        title: "Modelo creado",
        description: "El modelo de GPS ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el modelo.",
        variant: "destructive",
      });
    }
  });

  const updateModelo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ModeloGPS> & { id: string }) => {
      const { data, error } = await supabase
        .from('modelos_gps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['modelos-gps-by-marca'] });
      toast({
        title: "Modelo actualizado",
        description: "Los cambios han sido guardados.",
      });
    }
  });

  const initializeModelosGPS = useMutation({
    mutationFn: async () => {
      // Obtener marcas para asociar modelos
      const { data: marcas } = await supabase
        .from('marcas_gps')
        .select('id, nombre');

      if (!marcas) return [];

      const marcaMap = marcas.reduce((acc, marca) => {
        acc[marca.nombre] = marca.id;
        return acc;
      }, {} as Record<string, string>);

      // Base de datos enriquecida de modelos GPS reales compatibles con Wialon
      const modelosGPSDefault = [
        // TELTONIKA - Líder del mercado
        {
          marca_id: marcaMap['Teltonika'],
          nombre: 'FMB920',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', '3G', 'Bluetooth'],
          gps_precision: '2.5m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-30V',
          entradas_digitales: 4,
          salidas_digitales: 2,
          entradas_analogicas: 2,
          sensores_soportados: ['Accelerometer', 'Gyroscope', 'Temperature'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE', 'FCC', 'IC'],
          dimensiones: '89 x 79 x 22 mm',
          peso_gramos: 130,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 89,
          disponible_mexico: true,
          activo: true
        },
        {
          marca_id: marcaMap['Teltonika'],
          nombre: 'FMB964',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS', 'MQTT'],
          conectividad: ['2G', '3G', '4G', 'Bluetooth', 'WiFi'],
          gps_precision: '2.5m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-30V',
          entradas_digitales: 6,
          salidas_digitales: 4,
          entradas_analogicas: 4,
          sensores_soportados: ['Accelerometer', 'Gyroscope', 'Temperature', 'CAN'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE', 'FCC', 'IC', 'PTCRB'],
          dimensiones: '89 x 79 x 22 mm',
          peso_gramos: 145,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 145,
          disponible_mexico: true,
          activo: true
        },
        {
          marca_id: marcaMap['Teltonika'],
          nombre: 'FMB130',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', 'Bluetooth'],
          gps_precision: '2.5m CEP',
          bateria_interna: true,
          alimentacion_externa: '8-30V',
          entradas_digitales: 3,
          salidas_digitales: 2,
          entradas_analogicas: 2,
          sensores_soportados: ['Accelerometer', 'Temperature'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE', 'FCC'],
          dimensiones: '79 x 65 x 19 mm',
          peso_gramos: 80,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 59,
          disponible_mexico: true,
          activo: true
        },
        {
          marca_id: marcaMap['Teltonika'],
          nombre: 'FMT100',
          tipo_dispositivo: 'personal_tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', 'WiFi'],
          gps_precision: '2.5m CEP',
          bateria_interna: true,
          alimentacion_externa: 'USB',
          entradas_digitales: 0,
          salidas_digitales: 0,
          entradas_analogicas: 0,
          sensores_soportados: ['Accelerometer', 'Temperature'],
          temperatura_operacion: '-10°C to +55°C',
          certificaciones: ['CE', 'FCC'],
          dimensiones: '44 x 44 x 15 mm',
          peso_gramos: 38,
          resistencia_agua: 'IP65',
          precio_referencia_usd: 45,
          disponible_mexico: true,
          activo: true
        },

        // CALAMP - Popular en Norteamérica
        {
          marca_id: marcaMap['Calamp'],
          nombre: 'LMU-5530',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP'],
          conectividad: ['2G', '3G', '4G'],
          gps_precision: '3m CEP',
          bateria_interna: false,
          alimentacion_externa: '9-32V',
          entradas_digitales: 3,
          salidas_digitales: 2,
          entradas_analogicas: 1,
          sensores_soportados: ['Accelerometer', 'Temperature'],
          temperatura_operacion: '-30°C to +85°C',
          certificaciones: ['FCC', 'IC', 'PTCRB'],
          dimensiones: '110 x 64 x 34 mm',
          peso_gramos: 180,
          resistencia_agua: 'IP65',
          precio_referencia_usd: 120,
          disponible_mexico: true,
          activo: true
        },
        {
          marca_id: marcaMap['Calamp'],
          nombre: 'LMU-4230',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP'],
          conectividad: ['2G', '3G'],
          gps_precision: '3m CEP',
          bateria_interna: false,
          alimentacion_externa: '8-32V',
          entradas_digitales: 4,
          salidas_digitales: 2,
          entradas_analogicas: 2,
          sensores_soportados: ['Accelerometer'],
          temperatura_operacion: '-30°C to +85°C',
          certificaciones: ['FCC', 'IC'],
          dimensiones: '100 x 60 x 30 mm',
          peso_gramos: 150,
          resistencia_agua: 'IP54',
          precio_referencia_usd: 95,
          disponible_mexico: true,
          activo: true
        },

        // QUECLINK - Excelente relación precio-calidad
        {
          marca_id: marcaMap['Queclink'],
          nombre: 'GV300W',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'HTTP'],
          conectividad: ['2G', '3G', 'WiFi'],
          gps_precision: '2.5m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-95V',
          entradas_digitales: 4,
          salidas_digitales: 2,
          entradas_analogicas: 2,
          sensores_soportados: ['Accelerometer', 'Gyroscope', 'Temperature'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE', 'FCC', 'IC'],
          dimensiones: '83 x 67 x 24 mm',
          peso_gramos: 115,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 75,
          disponible_mexico: true,
          activo: true
        },
        {
          marca_id: marcaMap['Queclink'],
          nombre: 'GL300W',
          tipo_dispositivo: 'personal_tracker',
          protocolo_comunicacion: ['TCP', 'UDP'],
          conectividad: ['2G', 'WiFi'],
          gps_precision: '5m CEP',
          bateria_interna: true,
          alimentacion_externa: 'USB',
          entradas_digitales: 1,
          salidas_digitales: 0,
          entradas_analogicas: 0,
          sensores_soportados: ['Accelerometer'],
          temperatura_operacion: '-20°C to +70°C',
          certificaciones: ['CE', 'FCC'],
          dimensiones: '64 x 43 x 17 mm',
          peso_gramos: 50,
          resistencia_agua: 'IP65',
          precio_referencia_usd: 35,
          disponible_mexico: true,
          activo: true
        },

        // CONCOX - Económicos y funcionales
        {
          marca_id: marcaMap['Concox'],
          nombre: 'GT06N',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G'],
          gps_precision: '5m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-36V',
          entradas_digitales: 2,
          salidas_digitales: 1,
          entradas_analogicas: 1,
          sensores_soportados: ['Accelerometer'],
          temperatura_operacion: '-20°C to +70°C',
          certificaciones: ['CE'],
          dimensiones: '64 x 46 x 17 mm',
          peso_gramos: 50,
          resistencia_agua: 'IP65',
          precio_referencia_usd: 25,
          disponible_mexico: true,
          activo: true
        },
        {
          marca_id: marcaMap['Concox'],
          nombre: 'AT4',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', '3G', '4G'],
          gps_precision: '3m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-36V',
          entradas_digitales: 3,
          salidas_digitales: 2,
          entradas_analogicas: 2,
          sensores_soportados: ['Accelerometer', 'Temperature'],
          temperatura_operacion: '-30°C to +80°C',
          certificaciones: ['CE', 'FCC'],
          dimensiones: '95 x 56 x 25 mm',
          peso_gramos: 90,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 45,
          disponible_mexico: true,
          activo: true
        },

        // MEITRACK - Especialistas en vehículos pesados
        {
          marca_id: marcaMap['Meitrack'],
          nombre: 'T366G',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', '3G', '4G'],
          gps_precision: '2.5m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-95V',
          entradas_digitales: 6,
          salidas_digitales: 3,
          entradas_analogicas: 3,
          sensores_soportados: ['Accelerometer', 'Gyroscope', 'Temperature', 'CAN'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE', 'FCC', 'IC'],
          dimensiones: '118 x 78 x 32 mm',
          peso_gramos: 200,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 135,
          disponible_mexico: true,
          activo: true
        },

        // APLICOM - Premium finlandés
        {
          marca_id: marcaMap['Aplicom'],
          nombre: 'A12',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', '3G', '4G'],
          gps_precision: '2m CEP',
          bateria_interna: true,
          alimentacion_externa: '8-32V',
          entradas_digitales: 8,
          salidas_digitales: 4,
          entradas_analogicas: 4,
          sensores_soportados: ['Accelerometer', 'Gyroscope', 'Temperature', 'CAN', 'J1708'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE', 'FCC', 'IC', 'E-Mark'],
          dimensiones: '140 x 90 x 35 mm',
          peso_gramos: 250,
          resistencia_agua: 'IP67',
          precio_referencia_usd: 185,
          disponible_mexico: true,
          activo: true
        },

        // SUNTECH - Coreanos confiables
        {
          marca_id: marcaMap['Suntech'],
          nombre: 'ST4340',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP'],
          conectividad: ['2G', '3G', '4G'],
          gps_precision: '3m CEP',
          bateria_interna: false,
          alimentacion_externa: '9-32V',
          entradas_digitales: 4,
          salidas_digitales: 2,
          entradas_analogicas: 2,
          sensores_soportados: ['Accelerometer', 'Temperature'],
          temperatura_operacion: '-30°C to +80°C',
          certificaciones: ['CE', 'FCC'],
          dimensiones: '105 x 68 x 28 mm',
          peso_gramos: 140,
          resistencia_agua: 'IP65',
          precio_referencia_usd: 85,
          disponible_mexico: true,
          activo: true
        },

        // GALILEOSKY - Rusos especializados
        {
          marca_id: marcaMap['Galileosky'],
          nombre: 'v7.0',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G', '3G'],
          gps_precision: '3m CEP',
          bateria_interna: true,
          alimentacion_externa: '9-60V',
          entradas_digitales: 5,
          salidas_digitales: 3,
          entradas_analogicas: 3,
          sensores_soportados: ['Accelerometer', 'Temperature', 'CAN'],
          temperatura_operacion: '-40°C to +85°C',
          certificaciones: ['CE'],
          dimensiones: '120 x 85 x 30 mm',
          peso_gramos: 170,
          resistencia_agua: 'IP54',
          precio_referencia_usd: 110,
          disponible_mexico: false,
          activo: true
        },

        // COBAN - Económicos para flotas pequeñas
        {
          marca_id: marcaMap['Coban'],
          nombre: 'TK103',
          tipo_dispositivo: 'tracker',
          protocolo_comunicacion: ['TCP', 'UDP', 'SMS'],
          conectividad: ['2G'],
          gps_precision: '10m CEP',
          bateria_interna: true,
          alimentacion_externa: '12V',
          entradas_digitales: 1,
          salidas_digitales: 1,
          entradas_analogicas: 0,
          sensores_soportados: ['Accelerometer'],
          temperatura_operacion: '-20°C to +70°C',
          certificaciones: ['CE'],
          dimensiones: '83 x 54 x 22 mm',
          peso_gramos: 60,
          resistencia_agua: 'IP54',
          precio_referencia_usd: 20,
          disponible_mexico: true,
          activo: true
        }
      ];

      // Verificar si ya hay modelos
      const { data: existingModelos } = await supabase
        .from('modelos_gps')
        .select('id')
        .limit(1);

      if (!existingModelos || existingModelos.length === 0) {
        const { data, error } = await supabase
          .from('modelos_gps')
          .insert(modelosGPSDefault.filter(modelo => modelo.marca_id))
          .select();

        if (error) throw error;
        return data;
      }
      return existingModelos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-gps'] });
      queryClient.invalidateQueries({ queryKey: ['modelos-gps-by-marca'] });
      toast({
        title: "Modelos GPS inicializados",
        description: "Los modelos GPS han sido cargados en la base de datos.",
      });
    }
  });

  return {
    modelos,
    modelosPorMarca: getModelosByMarca.data,
    isLoading,
    error,
    createModelo,
    updateModelo,
    initializeModelosGPS
  };
};
