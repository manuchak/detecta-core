import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { useVehicleData } from "@/hooks/useVehicleData";

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

interface Modelo {
  id: string;
  nombre: string;
  tipo_vehiculo: string;
}

const COLORES_VEHICULO = [
  'Blanco', 'Negro', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Café', 'Otro'
];

// Generar años de vehículo (máximo 10 años de antigüedad)
const generateVehicleYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 10; i++) {
    years.push(currentYear - i);
  }
  return years;
};

export const VehicleForm = ({ formData, onInputChange }: VehicleFormProps) => {
  const { marcas, loadingMarcas, error: errorMarcas, fetchModelosPorMarca } = useVehicleData();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [errorModelos, setErrorModelos] = useState<string | null>(null);
  const [lastFetchedMarca, setLastFetchedMarca] = useState<string>('');
  const vehicleYears = generateVehicleYears();

  // Memoized function to load models
  const loadModelos = useCallback(async (marcaNombre: string) => {
    if (!marcaNombre || marcaNombre.trim() === '') {
      setModelos([]);
      setErrorModelos(null);
      setLastFetchedMarca('');
      return;
    }

    // Avoid refetching if it's the same marca
    if (marcaNombre === lastFetchedMarca) {
      return;
    }

    setLoadingModelos(true);
    setErrorModelos(null);
    
    try {
      const modelosData = await fetchModelosPorMarca(marcaNombre);
      setModelos(modelosData);
      setLastFetchedMarca(marcaNombre);
    } catch (error) {
      console.error('Error loading modelos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar modelos';
      setErrorModelos(errorMessage);
      setModelos([]);
    } finally {
      setLoadingModelos(false);
    }
  }, [fetchModelosPorMarca, lastFetchedMarca]);

  // Load models when marca changes
  useEffect(() => {
    if (formData.marca_vehiculo) {
      loadModelos(formData.marca_vehiculo);
    } else {
      setModelos([]);
      setErrorModelos(null);
      setLastFetchedMarca('');
    }
  }, [formData.marca_vehiculo, loadModelos]);

  // Handle marca change
  const handleMarcaChange = useCallback((value: string) => {
    onInputChange('marca_vehiculo', value);
    onInputChange('modelo_vehiculo', ''); // Clear model selection
    // The useEffect will handle loading the new models
  }, [onInputChange]);

  // Handle modelo change
  const handleModeloChange = useCallback((value: string) => {
    onInputChange('modelo_vehiculo', value);
  }, [onInputChange]);

  // Log errors but don't block the UI
  useEffect(() => {
    if (errorMarcas) {
      console.error('Error loading marcas:', errorMarcas);
    }
  }, [errorMarcas]);

  useEffect(() => {
    if (errorModelos) {
      console.error('Error loading modelos:', errorModelos);
    }
  }, [errorModelos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marca_vehiculo">Marca del Vehículo</Label>
          <Select 
            value={formData.marca_vehiculo} 
            onValueChange={handleMarcaChange} 
            disabled={loadingMarcas}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                loadingMarcas ? "Cargando marcas..." : 
                errorMarcas ? "Error al cargar marcas" :
                "Seleccionar marca"
              } />
            </SelectTrigger>
            <SelectContent>
              {marcas.map((marca) => (
                <SelectItem key={marca.id} value={marca.nombre}>
                  {marca.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorMarcas && (
            <p className="text-sm text-red-600">Error: {errorMarcas}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="modelo_vehiculo">Modelo</Label>
          <Select 
            value={formData.modelo_vehiculo} 
            onValueChange={handleModeloChange}
            disabled={!formData.marca_vehiculo || loadingModelos}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.marca_vehiculo 
                  ? "Primero selecciona una marca" 
                  : loadingModelos 
                  ? "Cargando modelos..." 
                  : errorModelos
                  ? "Error al cargar modelos"
                  : modelos.length === 0
                  ? "No hay modelos disponibles"
                  : "Seleccionar modelo"
              } />
            </SelectTrigger>
            <SelectContent>
              {modelos.map((modelo) => (
                <SelectItem key={modelo.id} value={modelo.nombre}>
                  {modelo.nombre}
                  {modelo.tipo_vehiculo && modelo.tipo_vehiculo !== 'otro' && (
                    <span className="text-muted-foreground ml-2">({modelo.tipo_vehiculo})</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorModelos && (
            <p className="text-sm text-red-600">Error: {errorModelos}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="año_vehiculo">Año (Máximo 10 años de antigüedad)</Label>
          <Select value={formData.año_vehiculo} onValueChange={(value) => onInputChange('año_vehiculo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {vehicleYears.map(year => (
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
