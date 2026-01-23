
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstados, useCiudades, useZonasTrabajo } from "@/hooks/useGeograficos";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

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
  
  const { estados, loading: loadingEstados, error: errorEstados, ready: estadosReady } = useEstados();
  const { ciudades, loading: loadingCiudades, error: errorCiudades, ready: ciudadesReady, refetch: refetchCiudades } = useCiudades(formData.estado_id || null);
  const { zonas, loading: loadingZonas, error: errorZonas, ready: zonasReady, refetch: refetchZonas } = useZonasTrabajo(formData.ciudad_id || null);

  // Debug log para diagnosticar problemas de carga
  console.log("📍 LocationForm state:", {
    estado_id: formData.estado_id,
    isValidUUID: formData.estado_id ? /^[0-9a-f-]{36}$/i.test(formData.estado_id) : false,
    ciudadesCount: ciudades.length,
    loadingCiudades,
    ciudadesReady,
    errorCiudades
  });

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

  // Helper to determine if ciudad select should be enabled
  const isCiudadEnabled = formData.estado_id && !loadingCiudades && ciudadesReady;
  // ✅ FIX: Permitir selección de zona si hay ciudad Y está ready (incluso si hay error)
  const isZonaEnabled = Boolean(formData.ciudad_id) && zonasReady;

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
          {errorEstados && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Error al cargar estados
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ciudad_id">Ciudad *</Label>
          <Select 
            value={formData.ciudad_id} 
            onValueChange={handleCiudadChange}
            disabled={!isCiudadEnabled}
          >
            <SelectTrigger className={!formData.estado_id ? 'text-muted-foreground' : ''}>
              {/* ✅ Placeholder inteligente que considera todos los estados */}
              <SelectValue placeholder={
                !formData.estado_id 
                  ? "Primero selecciona un estado" 
                  : loadingCiudades || !ciudadesReady
                  ? "Cargando ciudades..."
                  : errorCiudades
                  ? "Error al cargar ciudades"
                  : ciudades.length === 0
                  ? "No hay ciudades disponibles"
                  : "Seleccionar ciudad"
              } />
              {/* ✅ Loader inline cuando está cargando */}
              {(loadingCiudades || (!ciudadesReady && formData.estado_id)) && (
                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
              )}
            </SelectTrigger>
            <SelectContent>
              {ciudades.map((ciudad) => (
                <SelectItem key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* ✅ Error con botón de reintento */}
          {errorCiudades && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Error al cargar ciudades
              </p>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => refetchCiudades?.()}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reintentar
              </Button>
            </div>
          )}
          {formData.estado_id && !loadingCiudades && ciudadesReady && ciudades.length === 0 && !errorCiudades && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              No se encontraron ciudades para este estado
            </p>
          )}
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
            disabled={!isZonaEnabled}
          >
            <SelectTrigger>
              {loadingZonas ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando zonas...
                </span>
              ) : (
                <SelectValue placeholder={
                  !formData.ciudad_id 
                    ? "Primero selecciona una ciudad" 
                    : errorZonas
                    ? "Error al cargar zonas"
                    : "Seleccionar zona de trabajo"
                } />
              )}
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
          {/* ✅ Error con botón de reintento para zonas */}
          {errorZonas && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Error al cargar zonas
              </p>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => refetchZonas?.()}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
