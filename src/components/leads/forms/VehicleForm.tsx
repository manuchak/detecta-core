
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VehicleFormProps {
  formData: {
    marca_vehiculo: string;
    modelo_vehiculo: string;
    año_vehiculo: string;
    placas: string;
    color_vehiculo: string;
    tipo_vehiculo: string;
    seguro_vigente: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const MARCAS_VEHICULO = [
  'Nissan', 'Volkswagen', 'Chevrolet', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Kia', 
  'Mazda', 'Suzuki', 'Renault', 'Peugeot', 'SEAT', 'BMW', 'Mercedes-Benz', 'Audi', 'Otra'
];

const COLORES_VEHICULO = [
  'Blanco', 'Negro', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Café', 'Otro'
];

export const VehicleForm = ({ formData, onInputChange }: VehicleFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marca_vehiculo">Marca del Vehículo</Label>
          <Select value={formData.marca_vehiculo} onValueChange={(value) => onInputChange('marca_vehiculo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar marca" />
            </SelectTrigger>
            <SelectContent>
              {MARCAS_VEHICULO.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="modelo_vehiculo">Modelo</Label>
          <Input
            id="modelo_vehiculo"
            value={formData.modelo_vehiculo}
            onChange={(e) => onInputChange('modelo_vehiculo', e.target.value)}
            placeholder="Ej: Sentra, Jetta, Aveo"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="año_vehiculo">Año</Label>
          <Select value={formData.año_vehiculo} onValueChange={(value) => onInputChange('año_vehiculo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 25 }, (_, i) => 2024 - i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="placas">Placas</Label>
          <Input
            id="placas"
            value={formData.placas}
            onChange={(e) => onInputChange('placas', e.target.value.toUpperCase())}
            placeholder="XXX-XXX"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color_vehiculo">Color</Label>
          <Select value={formData.color_vehiculo} onValueChange={(value) => onInputChange('color_vehiculo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar color" />
            </SelectTrigger>
            <SelectContent>
              {COLORES_VEHICULO.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tipo_vehiculo">Tipo de Vehículo</Label>
          <Select value={formData.tipo_vehiculo} onValueChange={(value) => onInputChange('tipo_vehiculo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedán">Sedán</SelectItem>
              <SelectItem value="hatchback">Hatchback</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="pickup">Pick-up</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="motocicleta">Motocicleta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seguro_vigente">¿Cuenta con seguro vigente?</Label>
          <Select value={formData.seguro_vigente} onValueChange={(value) => onInputChange('seguro_vigente', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí, vigente</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="en_tramite">En trámite</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
