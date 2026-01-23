
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstados, useCiudades, useZonasTrabajo } from "@/hooks/useGeograficos";

interface LocationFormProps {
  formData: {
    direccion: string;
    estado_id: string;
    ciudad_id: string;
    zona_trabajo_id: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const LocationForm = ({ formData, onInputChange }: LocationFormProps) => {
  console.log("🏠 LocationForm - Rendering with data:", formData);
  
  const { estados, loading: loadingEstados, error: errorEstados } = useEstados();
  const { ciudades, loading: loadingCiudades, error: errorCiudades } = useCiudades(formData.estado_id);
  const { zonas, loading: loadingZonas, error: errorZonas } = useZonasTrabajo(formData.ciudad_id);

  // Limpiar ciudad cuando cambie el estado
  const handleEstadoChange = (value: string) => {
    console.log("🔄 Estado ANTES:", formData.estado_id);
    console.log("🔄 Estado NUEVO:", value);
    console.log("🔄 Es UUID válido:", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
    onInputChange('estado_id', value);
    onInputChange('ciudad_id', ''); // Limpiar ciudad
    onInputChange('zona_trabajo_id', ''); // Limpiar zona de trabajo
  };

  const handleCiudadChange = (value: string) => {
    console.log("🏙️ Ciudad ANTES:", formData.ciudad_id);
    console.log("🏙️ Ciudad NUEVA:", value);
    console.log("🏙️ Es UUID válido:", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
    onInputChange('ciudad_id', value);
    onInputChange('zona_trabajo_id', ''); // Limpiar zona de trabajo
  };

  // Mostrar errores si los hay
  if (errorEstados) {
    console.error('❌ Error loading estados:', errorEstados);
  }
  
  if (errorCiudades) {
    console.error('❌ Error loading ciudades:', errorCiudades);
  }

  if (errorZonas) {
    console.error('❌ Error loading zonas:', errorZonas);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado_id">Estado *</Label>
          <Select value={formData.estado_id} onValueChange={handleEstadoChange}>
            <SelectTrigger>
              <SelectValue placeholder={
                loadingEstados ? "Cargando estados..." : 
                errorEstados ? "Error al cargar estados" :
                "Seleccionar estado"
              } />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem key={estado.id} value={estado.id}>
                  {estado.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ciudad_id">Ciudad *</Label>
          <Select 
            value={formData.ciudad_id} 
            onValueChange={handleCiudadChange}
            disabled={!formData.estado_id || loadingCiudades}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.estado_id 
                  ? "Primero selecciona un estado" 
                  : loadingCiudades 
                  ? "Cargando ciudades..." 
                  : errorCiudades
                  ? "Error al cargar ciudades"
                  : "Seleccionar ciudad"
              } />
            </SelectTrigger>
            <SelectContent>
              {ciudades.map((ciudad) => (
                <SelectItem key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="direccion">Dirección Completa *</Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) => onInputChange('direccion', e.target.value)}
            placeholder="Calle, número, colonia, código postal"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="zona_trabajo_id">Zona de Trabajo Disponible (Opcional)</Label>
          <Select 
            value={formData.zona_trabajo_id} 
            onValueChange={(value) => onInputChange('zona_trabajo_id', value)}
            disabled={!formData.ciudad_id || loadingZonas}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.ciudad_id 
                  ? "Primero selecciona una ciudad" 
                  : loadingZonas 
                  ? "Cargando zonas..." 
                  : errorZonas
                  ? "Error al cargar zonas"
                  : "Seleccionar zona de trabajo"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin-zona-especifica">
                Sin zona específica
              </SelectItem>
              {zonas.length > 0 && (
                zonas.map((zona) => (
                  <SelectItem key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
