
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstados, useCiudades, useZonasTrabajo } from "@/hooks/useGeograficos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LocationFormProps {
  formData: {
    estado_id: string;
    ciudad_id: string;
    zona_trabajo_id: string;
    direccion: string;
    disponibilidad_horario: string;
    disponibilidad_dias: string;
    rango_km: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const LocationForm = ({ formData, onInputChange }: LocationFormProps) => {
  const { estados, loading: estadosLoading, error: estadosError } = useEstados();
  const { ciudades, loading: ciudadesLoading } = useCiudades(formData.estado_id || null);
  const { zonas } = useZonasTrabajo(formData.ciudad_id || null);

  console.log('Estados:', estados);
  console.log('Loading:', estadosLoading);
  console.log('Error:', estadosError);

  return (
    <div className="space-y-6">
      {estadosError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error cargando estados: {estadosError}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Select 
            value={formData.estado_id}
            onValueChange={(value) => onInputChange('estado_id', value)}
            disabled={estadosLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={estadosLoading ? "Cargando estados..." : "Seleccionar estado"} />
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
          <Label htmlFor="ciudad">Ciudad *</Label>
          <Select 
            value={formData.ciudad_id}
            onValueChange={(value) => onInputChange('ciudad_id', value)}
            disabled={!formData.estado_id || ciudadesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.estado_id 
                  ? "Primero selecciona un estado" 
                  : ciudadesLoading 
                    ? "Cargando ciudades..." 
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
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="zona_trabajo">Zona de trabajo preferida</Label>
          <Select 
            value={formData.zona_trabajo_id}
            onValueChange={(value) => onInputChange('zona_trabajo_id', value)}
            disabled={!formData.ciudad_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.ciudad_id 
                  ? "Primero selecciona una ciudad" 
                  : "Seleccionar zona (opcional)"
              } />
            </SelectTrigger>
            <SelectContent>
              {zonas.map((zona) => (
                <SelectItem key={zona.id} value={zona.id}>
                  {zona.nombre} {zona.descripcion && `- ${zona.descripcion}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="disponibilidad_horario">Disponibilidad de horario</Label>
          <Select value={formData.disponibilidad_horario} onValueChange={(value) => onInputChange('disponibilidad_horario', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar horario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completo">Tiempo completo</SelectItem>
              <SelectItem value="parcial">Tiempo parcial</SelectItem>
              <SelectItem value="matutino">Turno matutino (6:00-14:00)</SelectItem>
              <SelectItem value="vespertino">Turno vespertino (14:00-22:00)</SelectItem>
              <SelectItem value="nocturno">Turno nocturno (22:00-6:00)</SelectItem>
              <SelectItem value="fines_semana">Solo fines de semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rango_km">Rango de kilómetros dispuesto a trabajar</Label>
          <Select value={formData.rango_km} onValueChange={(value) => onInputChange('rango_km', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-50">0-50 km (Local)</SelectItem>
              <SelectItem value="50-100">50-100 km (Regional)</SelectItem>
              <SelectItem value="100-200">100-200 km (Estatal)</SelectItem>
              <SelectItem value="200+">Más de 200 km (Foráneo)</SelectItem>
              <SelectItem value="nacional">Nivel nacional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="disponibilidad_dias">Días disponibles</Label>
          <Select value={formData.disponibilidad_dias} onValueChange={(value) => onInputChange('disponibilidad_dias', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar días" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lunes_viernes">Lunes a viernes</SelectItem>
              <SelectItem value="lunes_sabado">Lunes a sábado</SelectItem>
              <SelectItem value="toda_semana">Toda la semana</SelectItem>
              <SelectItem value="fines_semana">Solo fines de semana</SelectItem>
              <SelectItem value="entre_semana">Solo entre semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
