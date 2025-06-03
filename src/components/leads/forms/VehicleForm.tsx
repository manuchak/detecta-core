
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicleData } from "@/hooks/useVehicleData";
import { Loader2, Car } from "lucide-react";

interface VehicleFormProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

export const VehicleForm = ({ formData, onInputChange }: VehicleFormProps) => {
  const { marcas, loadingMarcas, error, fetchModelosPorMarca } = useVehicleData();
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);

  const handleMarcaChange = async (marcaNombre: string) => {
    onInputChange('marca_vehiculo', marcaNombre);
    onInputChange('modelo_vehiculo', ''); // Limpiar modelo cuando cambia la marca
    
    if (marcaNombre) {
      setLoadingModelos(true);
      try {
        const modelosData = await fetchModelosPorMarca(marcaNombre);
        setModelos(modelosData);
      } catch (error) {
        console.error('Error loading modelos:', error);
        setModelos([]);
      } finally {
        setLoadingModelos(false);
      }
    } else {
      setModelos([]);
    }
  };

  // Cargar modelos si ya hay una marca seleccionada
  useEffect(() => {
    if (formData.marca_vehiculo) {
      handleMarcaChange(formData.marca_vehiculo);
    }
  }, []);

  const tiposVehiculo = [
    { value: 'sedán', label: 'Sedán' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'suv', label: 'SUV' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'van', label: 'Van/Camioneta' },
    { value: 'coupe', label: 'Coupé' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'wagon', label: 'Station Wagon' },
    { value: 'otro', label: 'Otro' }
  ];

  const años = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1990; year--) {
    años.push(year);
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <Car className="h-5 w-5" />
          <span>Error al cargar datos de vehículos: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Información del Vehículo</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="marca_vehiculo">Marca del vehículo *</Label>
          <Select 
            value={formData.marca_vehiculo} 
            onValueChange={(value) => handleMarcaChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingMarcas ? "Cargando marcas..." : "Seleccionar marca"} />
            </SelectTrigger>
            <SelectContent>
              {loadingMarcas ? (
                <SelectItem value="" disabled>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando marcas...
                  </div>
                </SelectItem>
              ) : (
                marcas.map((marca) => (
                  <SelectItem key={marca.id} value={marca.nombre}>
                    {marca.nombre} ({marca.pais_origen})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="modelo_vehiculo">Modelo del vehículo</Label>
          <Select 
            value={formData.modelo_vehiculo} 
            onValueChange={(value) => onInputChange('modelo_vehiculo', value)}
            disabled={!formData.marca_vehiculo || loadingModelos}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.marca_vehiculo 
                  ? "Selecciona una marca primero" 
                  : loadingModelos 
                    ? "Cargando modelos..." 
                    : "Seleccionar modelo"
              } />
            </SelectTrigger>
            <SelectContent>
              {loadingModelos ? (
                <SelectItem value="" disabled>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando modelos...
                  </div>
                </SelectItem>
              ) : modelos.length > 0 ? (
                modelos.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.nombre}>
                    {modelo.nombre} ({modelo.tipo_vehiculo})
                  </SelectItem>
                ))
              ) : formData.marca_vehiculo ? (
                <SelectItem value="" disabled>
                  No hay modelos disponibles para esta marca
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="año_vehiculo">Año del vehículo</Label>
          <Select 
            value={formData.año_vehiculo} 
            onValueChange={(value) => onInputChange('año_vehiculo', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {años.map((año) => (
                <SelectItem key={año} value={año.toString()}>
                  {año}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tipo_vehiculo">Tipo de vehículo</Label>
          <Select 
            value={formData.tipo_vehiculo} 
            onValueChange={(value) => onInputChange('tipo_vehiculo', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposVehiculo.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="placas">Placas del vehículo</Label>
          <Input
            id="placas"
            type="text"
            placeholder="Ej. ABC-123-D"
            value={formData.placas}
            onChange={(e) => onInputChange('placas', e.target.value.toUpperCase())}
            maxLength={10}
          />
        </div>

        <div>
          <Label htmlFor="color_vehiculo">Color del vehículo</Label>
          <Input
            id="color_vehiculo"
            type="text"
            placeholder="Ej. Blanco, Negro, Gris"
            value={formData.color_vehiculo}
            onChange={(e) => onInputChange('color_vehiculo', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="seguro_vigente">¿Cuenta con seguro vigente?</Label>
        <Select 
          value={formData.seguro_vigente} 
          onValueChange={(value) => onInputChange('seguro_vigente', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar respuesta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Si">Sí, tengo seguro vigente</SelectItem>
            <SelectItem value="No">No tengo seguro</SelectItem>
            <SelectItem value="En_proceso">En proceso de contratación</SelectItem>
            <SelectItem value="Vencido">Tengo seguro pero está vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>* La información del vehículo es importante para validar que cumples con los requisitos para ser custodio.</p>
        <p>** Es obligatorio contar con seguro vigente para trabajar como custodio.</p>
      </div>
    </div>
  );
};
