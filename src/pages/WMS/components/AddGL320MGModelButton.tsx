import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, CheckCircle2 } from 'lucide-react';

export const AddGL320MGModelButton = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { toast } = useToast();

  const gl320mgModelData = {
    nombre: 'GL320MG',
    tipo_dispositivo: 'tracker',
    protocolo_comunicacion: ['TCP', 'UDP', 'HTTP'],
    conectividad: ['4G', '3G', '2G'],
    gps_precision: '2.5m CEP',
    bateria_interna: true,
    alimentacion_externa: '9-36V',
    entradas_digitales: 4,
    salidas_digitales: 2,
    entradas_analogicas: 3,
    sensores_soportados: ['Accelerometer', 'Gyroscope', 'Magnetometer', 'Jamming Detection'],
    temperatura_operacion: '-30°C to +70°C',
    certificaciones: ['CE', 'FCC', 'IC', 'RoHS', 'PTCRB', 'GCF'],
    dimensiones: '93 x 69 x 26 mm',
    peso_gramos: 180,
    resistencia_agua: 'IP67',
    precio_referencia_usd: 285,
    disponible_mexico: true,
    activo: true,
    especificaciones_json: {
      gps: {
        tipo: 'GPS/GLONASS/BDS/Galileo',
        precision: '2.5m CEP',
        tiempo_cold_start: '30s',
        tiempo_warm_start: '5s',
        tiempo_hot_start: '1s',
        sensibilidad: '-165 dBm'
      },
      comunicacion: {
        celular: '4G LTE Cat-1, 3G WCDMA, 2G GSM',
        bandas_lte: 'B1/B3/B5/B7/B8/B20/B28A',
        bandas_wcdma: 'B1/B5/B8',
        bandas_gsm: '850/900/1800/1900 MHz'
      },
      sensores: {
        acelerometro: '3-axis, ±2g/±4g/±8g',
        giroscopio: '3-axis, ±250/±500/±1000/±2000 dps',
        magnetometro: '3-axis',
        deteccion_movimiento: 'Si',
        deteccion_impacto: 'Si',
        deteccion_jamming: 'Si'
      },
      conectividad: {
        bluetooth: 'BLE 5.0',
        wifi: '802.11 b/g/n',
        usb: 'Micro USB',
        interfaces: 'RS232, I2C, SPI'
      },
      alimentacion: {
        voltaje_principal: '9-36V DC',
        bateria_respaldo: '500mAh Li-ion',
        autonomia_respaldo: '4-6 horas',
        consumo_standby: '5mA',
        consumo_tracking: '65mA'
      },
      memoria: {
        flash: '8MB',
        ram: '8MB',
        registros_offline: '200,000 puntos GPS'
      }
    }
  };

  const handleAddModel = async () => {
    setIsAdding(true);

    try {
      // Verificar si el modelo ya existe
      const { data: existingModel } = await supabase
        .from('modelos_gps')
        .select('id')
        .eq('nombre', 'GL320MG')
        .eq('marca_id', '50dd8b40-239c-4ba7-abc9-280e620a3c83')
        .single();

      if (existingModel) {
        toast({
          title: "Modelo ya existe",
          description: "El GL320MG ya está registrado en los modelos GPS.",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      // Insertar el modelo GL320MG
      const { data: newModel, error } = await supabase
        .from('modelos_gps')
        .insert({
          ...gl320mgModelData,
          marca_id: '50dd8b40-239c-4ba7-abc9-280e620a3c83' // ID de Queclink
        })
        .select()
        .single();

      if (error) throw error;

      setIsAdded(true);
      toast({
        title: "Modelo GL320MG agregado",
        description: "El modelo ahora aparecerá en el dropdown de Modelo GPS cuando selecciones Queclink.",
      });

    } catch (error: any) {
      console.error('Error agregando modelo GL320MG:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el modelo GL320MG",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isAdded) {
    return (
      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="text-sm font-medium text-success">
          GL320MG agregado al catálogo de modelos GPS
        </span>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleAddModel}
      disabled={isAdding}
      variant="outline"
      size="sm"
      className="border-primary/50 text-primary hover:bg-primary/10"
    >
      {isAdding ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Agregando modelo...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Agregar GL320MG a Modelos GPS
        </>
      )}
    </Button>
  );
};