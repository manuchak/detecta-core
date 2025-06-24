
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useModelosGPS } from '@/hooks/useModelosGPS';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';

interface NuevoModeloDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marcaIdPreseleccionada?: string;
}

export const NuevoModeloDialog = ({ open, onOpenChange, marcaIdPreseleccionada }: NuevoModeloDialogProps) => {
  const { toast } = useToast();
  const { createModelo } = useModelosGPS();
  const { marcas } = useMarcasGPS();
  
  const [formData, setFormData] = useState({
    marca_id: marcaIdPreseleccionada || '',
    nombre: '',
    tipo_dispositivo: '',
    gps_precision: '',
    bateria_interna: false,
    alimentacion_externa: '',
    entradas_digitales: 0,
    salidas_digitales: 0,
    entradas_analogicas: 0,
    temperatura_operacion: '',
    dimensiones: '',
    peso_gramos: '',
    resistencia_agua: '',
    precio_referencia_usd: '',
    observaciones: ''
  });
  
  const [conectividad, setConectividad] = useState<string[]>([]);
  const [protocolos, setProtocolos] = useState<string[]>([]);
  const [sensores, setSensores] = useState<string[]>([]);
  const [certificaciones, setCertificaciones] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tiposDispositivo = [
    { value: 'tracker', label: 'Tracker' },
    { value: 'dashcam', label: 'Dashcam' },
    { value: 'personal_tracker', label: 'Personal Tracker' },
    { value: 'asset_tracker', label: 'Asset Tracker' },
    { value: 'can_tracker', label: 'CAN Tracker' },
    { value: 'trailer_tracker', label: 'Trailer Tracker' }
  ];

  const opcionesConectividad = ['2G', '3G', '4G', '5G', 'WiFi', 'Bluetooth', 'CAN', 'OBD'];
  const opcionesProtocolos = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'MQTT', 'SMS'];
  const opcionesSensores = ['GPS', 'Accelerometer', 'Gyroscope', 'Temperature', 'CAN', 'Camera', 'Microphone'];
  const opcionesCertificaciones = ['CE', 'FCC', 'IC', 'PTCRB', 'E-Mark'];

  const addTag = (list: string[], setList: (list: string[]) => void, tag: string) => {
    if (tag && !list.includes(tag)) {
      setList([...list, tag]);
    }
  };

  const removeTag = (list: string[], setList: (list: string[]) => void, tag: string) => {
    setList(list.filter(item => item !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.marca_id || !formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "La marca y el nombre del modelo son requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createModelo.mutateAsync({
        marca_id: formData.marca_id,
        nombre: formData.nombre.trim(),
        tipo_dispositivo: formData.tipo_dispositivo || null,
        protocolo_comunicacion: protocolos.length > 0 ? protocolos : null,
        conectividad: conectividad.length > 0 ? conectividad : null,
        gps_precision: formData.gps_precision.trim() || null,
        bateria_interna: formData.bateria_interna,
        alimentacion_externa: formData.alimentacion_externa.trim() || null,
        entradas_digitales: formData.entradas_digitales || 0,
        salidas_digitales: formData.salidas_digitales || 0,
        entradas_analogicas: formData.entradas_analogicas || 0,
        sensores_soportados: sensores.length > 0 ? sensores : null,
        temperatura_operacion: formData.temperatura_operacion.trim() || null,
        certificaciones: certificaciones.length > 0 ? certificaciones : null,
        dimensiones: formData.dimensiones.trim() || null,
        peso_gramos: formData.peso_gramos ? parseInt(formData.peso_gramos) : null,
        resistencia_agua: formData.resistencia_agua.trim() || null,
        precio_referencia_usd: formData.precio_referencia_usd ? parseFloat(formData.precio_referencia_usd) : null,
        disponible_mexico: true,
        activo: true,
        observaciones: formData.observaciones.trim() || null
      });

      onOpenChange(false);
      // Reset form
      setFormData({
        marca_id: marcaIdPreseleccionada || '',
        nombre: '',
        tipo_dispositivo: '',
        gps_precision: '',
        bateria_interna: false,
        alimentacion_externa: '',
        entradas_digitales: 0,
        salidas_digitales: 0,
        entradas_analogicas: 0,
        temperatura_operacion: '',
        dimensiones: '',
        peso_gramos: '',
        resistencia_agua: '',
        precio_referencia_usd: '',
        observaciones: ''
      });
      setConectividad([]);
      setProtocolos([]);
      setSensores([]);
      setCertificaciones([]);
      
      toast({
        title: "Éxito",
        description: "Modelo GPS creado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el modelo GPS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Modelo GPS</DialogTitle>
          <DialogDescription>
            Agregar un nuevo modelo GPS al catálogo
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca_id">Marca *</Label>
              <Select value={formData.marca_id} onValueChange={(value) => setFormData(prev => ({ ...prev, marca_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas?.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Modelo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: FMB920, JC400P..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_dispositivo">Tipo de Dispositivo</Label>
              <Select value={formData.tipo_dispositivo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_dispositivo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDispositivo.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gps_precision">Precisión GPS</Label>
              <Input
                id="gps_precision"
                value={formData.gps_precision}
                onChange={(e) => setFormData(prev => ({ ...prev, gps_precision: e.target.value }))}
                placeholder="Ej: 2.5m CEP"
              />
            </div>
          </div>

          {/* Conectividad */}
          <div className="space-y-2">
            <Label>Conectividad</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {conectividad.map((item) => (
                <Badge key={item} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(conectividad, setConectividad, item)} />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {opcionesConectividad.filter(op => !conectividad.includes(op)).map((opcion) => (
                <Button
                  key={opcion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(conectividad, setConectividad, opcion)}
                >
                  + {opcion}
                </Button>
              ))}
            </div>
          </div>

          {/* Protocolos */}
          <div className="space-y-2">
            <Label>Protocolos de Comunicación</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {protocolos.map((item) => (
                <Badge key={item} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(protocolos, setProtocolos, item)} />
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {opcionesProtocolos.filter(op => !protocolos.includes(op)).map((opcion) => (
                <Button
                  key={opcion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(protocolos, setProtocolos, opcion)}
                >
                  + {opcion}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entradas_digitales">Entradas Digitales</Label>
              <Input
                id="entradas_digitales"
                type="number"
                min="0"
                value={formData.entradas_digitales}
                onChange={(e) => setFormData(prev => ({ ...prev, entradas_digitales: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salidas_digitales">Salidas Digitales</Label>
              <Input
                id="salidas_digitales"
                type="number"
                min="0"
                value={formData.salidas_digitales}
                onChange={(e) => setFormData(prev => ({ ...prev, salidas_digitales: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entradas_analogicas">Entradas Analógicas</Label>
              <Input
                id="entradas_analogicas"
                type="number"
                min="0"
                value={formData.entradas_analogicas}
                onChange={(e) => setFormData(prev => ({ ...prev, entradas_analogicas: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alimentacion_externa">Alimentación Externa</Label>
              <Input
                id="alimentacion_externa"
                value={formData.alimentacion_externa}
                onChange={(e) => setFormData(prev => ({ ...prev, alimentacion_externa: e.target.value }))}
                placeholder="Ej: 12-24V, USB"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="bateria_interna"
                checked={formData.bateria_interna}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bateria_interna: checked }))}
              />
              <Label htmlFor="bateria_interna">Batería Interna</Label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dimensiones">Dimensiones</Label>
              <Input
                id="dimensiones"
                value={formData.dimensiones}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensiones: e.target.value }))}
                placeholder="Ej: 89 x 79 x 22 mm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_gramos">Peso (gramos)</Label>
              <Input
                id="peso_gramos"
                type="number"
                min="0"
                value={formData.peso_gramos}
                onChange={(e) => setFormData(prev => ({ ...prev, peso_gramos: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_referencia_usd">Precio USD</Label>
              <Input
                id="precio_referencia_usd"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_referencia_usd}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_referencia_usd: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperatura_operacion">Temperatura de Operación</Label>
              <Input
                id="temperatura_operacion"
                value={formData.temperatura_operacion}
                onChange={(e) => setFormData(prev => ({ ...prev, temperatura_operacion: e.target.value }))}
                placeholder="Ej: -40°C to +85°C"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resistencia_agua">Resistencia al Agua</Label>
              <Input
                id="resistencia_agua"
                value={formData.resistencia_agua}
                onChange={(e) => setFormData(prev => ({ ...prev, resistencia_agua: e.target.value }))}
                placeholder="Ej: IP67, IP54"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Información adicional sobre el modelo..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
