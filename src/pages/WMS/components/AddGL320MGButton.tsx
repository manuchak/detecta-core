import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  CheckCircle2, 
  Loader2,
  Cpu,
  Zap,
  Shield,
  Radio,
  Thermometer,
  Battery
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddGL320MGModelButton } from './AddGL320MGModelButton';

export const AddGL320MGButton = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { toast } = useToast();

  const gl320mgData = {
    codigo_producto: 'GPS-QUE-GL320MG',
    nombre: 'Queclink GL320MG',
    descripcion: 'Dispositivo GPS tracking avanzado con múltiples sensores y conectividad 4G LTE. Ideal para rastreo vehicular profesional con detección de movimiento, geo-cercas y alertas inteligentes.',
    marca: 'Queclink',
    modelo: 'GL320MG',
    especificaciones: {
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
    },
    precio_venta_sugerido: 285.00,
    dimensiones: '93 x 69 x 26 mm',
    peso_kg: 0.18,
    voltaje_operacion: '9-36V DC',
    temperatura_operacion: '-30°C a +70°C',
    certificaciones: ['CE', 'FCC', 'IC', 'RoHS', 'PTCRB', 'GCF'],
    compatibilidad_vehiculos: ['Automóviles', 'Camiones', 'Motocicletas', 'Maquinaria pesada', 'Flotas comerciales'],
    software_requerido: 'Queclink Configuration Tool, GT06 Protocol',
    es_serializado: true,
    requiere_configuracion: true,
    garantia_meses: 24,
    stock_minimo: 10,
    stock_maximo: 100,
    activo: true,
    estado_producto: 'activo',
    consumo_energia_mw: 65,
    frecuencia_transmision_hz: 1575420000
  };

  const configuracionesGL320MG = [
    { parametro: 'IMEI', valor: '', descripcion: 'Número IMEI único del dispositivo', requerido: true },
    { parametro: 'Servidor_Principal', valor: '', descripcion: 'IP del servidor de rastreo principal', requerido: true },
    { parametro: 'Puerto_Principal', valor: '8888', descripcion: 'Puerto del servidor principal', requerido: true },
    { parametro: 'Servidor_Backup', valor: '', descripcion: 'IP del servidor de respaldo', requerido: false },
    { parametro: 'Puerto_Backup', valor: '8889', descripcion: 'Puerto del servidor de respaldo', requerido: false },
    { parametro: 'APN', valor: 'internet.comcel.com.co', descripcion: 'APN del operador móvil', requerido: true },
    { parametro: 'Usuario_APN', valor: '', descripcion: 'Usuario para conexión APN', requerido: false },
    { parametro: 'Password_APN', valor: '', descripcion: 'Contraseña para conexión APN', requerido: false },
    { parametro: 'Intervalo_Reporte', valor: '60', descripcion: 'Intervalo de reporte en segundos (30-18000)', requerido: true },
    { parametro: 'Intervalo_Heartbeat', valor: '300', descripcion: 'Intervalo de heartbeat en segundos', requerido: false },
    { parametro: 'Sensibilidad_Shock', valor: '50', descripcion: 'Sensibilidad del sensor de impacto (0-255)', requerido: false },
    { parametro: 'Deteccion_Jamming', valor: '1', descripcion: 'Activar detección de jamming (0=Off, 1=On)', requerido: false },
    { parametro: 'Modo_Energia', valor: '0', descripcion: 'Modo de ahorro de energía (0=Normal, 1=Eco)', requerido: false },
    { parametro: 'Geocerca_Radio', valor: '200', descripcion: 'Radio de geo-cerca en metros', requerido: false },
    { parametro: 'Timezone', valor: '-5', descripcion: 'Zona horaria (UTC offset)', requerido: false }
  ];

  const handleAddGL320MG = async () => {
    setIsAdding(true);
    
    try {
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('productos_inventario')
        .select('id')
        .eq('codigo_producto', gl320mgData.codigo_producto)
        .single();

      if (existing) {
        toast({
          title: "Producto ya existe",
          description: "El Queclink GL320MG ya está registrado en el inventario.",
          variant: "destructive",
        });
        setIsAdding(false);
        return;
      }

      // Obtener categoría GPS Tracking
      const { data: categoria } = await supabase
        .from('categorias_productos')
        .select('id')
        .eq('nombre', 'GPS Tracking')
        .single();

      if (!categoria) {
        throw new Error('Categoría GPS Tracking no encontrada');
      }

      // Insertar producto
      const { data: producto, error: productoError } = await supabase
        .from('productos_inventario')
        .insert({
          ...gl320mgData,
          categoria_id: categoria.id
        })
        .select()
        .single();

      if (productoError) throw productoError;

      // Insertar configuraciones
      const configuraciones = configuracionesGL320MG.map(config => ({
        producto_id: producto.id,
        parametro: config.parametro,
        valor: config.valor,
        descripcion: config.descripcion,
        requerido: config.requerido
      }));

      const { error: configError } = await supabase
        .from('configuraciones_producto')
        .insert(configuraciones);

      if (configError) {
        console.error('Error insertando configuraciones:', configError);
        // No fallar si las configuraciones no se insertan
      }

      // Crear registro inicial de stock
      const { error: stockError } = await supabase
        .from('stock_productos')
        .insert({
          producto_id: producto.id,
          cantidad_disponible: 0,
          cantidad_reservada: 0,
          cantidad_transito: 0,
          valor_inventario: 0
        });

      if (stockError) {
        console.error('Error creando stock inicial:', stockError);
        // No fallar si el stock no se crea
      }

      setIsAdded(true);
      toast({
        title: "Queclink GL320MG agregado",
        description: "El dispositivo ha sido registrado exitosamente con todas sus especificaciones técnicas.",
      });

    } catch (error: any) {
      console.error('Error agregando GL320MG:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el dispositivo GL320MG",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isAdded) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-success">Queclink GL320MG Agregado</h3>
              <p className="text-sm text-muted-foreground">
                El dispositivo está ahora disponible en tu inventario
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Características principales:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• 4G LTE + 3G + 2G</li>
                <li>• GPS/GLONASS/BDS/Galileo</li>
                <li>• Sensores 3-axis avanzados</li>
                <li>• Batería respaldo 500mAh</li>
                <li>• Detección jamming</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Configuraciones creadas:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• 15 parámetros técnicos</li>
                <li>• Configuración APN</li>
                <li>• Intervalos de reporte</li>
                <li>• Sensores y geo-cercas</li>
                <li>• Stock inicial: 0 unidades</li>
              </ul>
            </div>
          </div>
          
          {/* Botón para agregar también al catálogo de modelos */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Siguiente paso:</strong> Para que aparezca en el dropdown "Modelo GPS" del formulario:
            </p>
            <AddGL320MGModelButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Agregar Queclink GL320MG
        </CardTitle>
        <CardDescription>
          Dispositivo GPS tracking profesional con conectividad 4G LTE y sensores avanzados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Especificaciones destacadas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Radio className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Conectividad</p>
              <p className="text-xs text-muted-foreground">4G LTE Cat-1</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Zap className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium">Sensores</p>
              <p className="text-xs text-muted-foreground">3-axis + Jamming</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Battery className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium">Batería</p>
              <p className="text-xs text-muted-foreground">500mAh Li-ion</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Thermometer className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Temperatura</p>
              <p className="text-xs text-muted-foreground">-30°C a +70°C</p>
            </div>
          </div>
        </div>

        {/* Certificaciones */}
        <div className="space-y-2">
          <h4 className="font-medium">Certificaciones:</h4>
          <div className="flex flex-wrap gap-2">
            {['CE', 'FCC', 'IC', 'RoHS', 'PTCRB', 'GCF'].map((cert) => (
              <Badge key={cert} variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>

        {/* Precio y dimensiones */}
        <div className="grid md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Precio sugerido</p>
            <p className="text-lg font-bold text-primary">$285 USD</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Dimensiones</p>
            <p className="text-sm font-medium">93 x 69 x 26 mm</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Peso</p>
            <p className="text-sm font-medium">180g</p>
          </div>
        </div>

        <Button 
          onClick={handleAddGL320MG}
          disabled={isAdding}
          className="w-full"
          size="lg"
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Agregando al inventario...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Agregar GL320MG al Inventario
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};