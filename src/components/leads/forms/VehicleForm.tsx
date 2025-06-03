
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
import { Loader2, Car, Shield, ShieldCheck, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    if (formData.marca_vehiculo && formData.tipo_custodio !== 'armado' && formData.tipo_custodio !== 'abordo') {
      handleMarcaChange(formData.marca_vehiculo);
    }
  }, [formData.tipo_custodio]);

  // Limpiar campos de vehículo cuando cambia a tipos sin vehículo
  useEffect(() => {
    if (formData.tipo_custodio === 'armado' || formData.tipo_custodio === 'abordo') {
      onInputChange('marca_vehiculo', '');
      onInputChange('modelo_vehiculo', '');
      onInputChange('año_vehiculo', '');
      onInputChange('placas', '');
      onInputChange('color_vehiculo', '');
      onInputChange('tipo_vehiculo', '');
      onInputChange('seguro_vigente', '');
    }
  }, [formData.tipo_custodio]);

  const tiposCustodio = [
    { 
      value: 'custodio_vehiculo', 
      label: 'Custodio con Vehículo', 
      icon: Car,
      description: 'Custodio que cuenta con vehículo propio para servicios'
    },
    { 
      value: 'armado', 
      label: 'Custodio Armado', 
      icon: Shield,
      description: 'Acompañante armado sin vehículo (requiere credenciales de armas)'
    },
    { 
      value: 'armado_vehiculo', 
      label: 'Custodio Armado con Vehículo', 
      icon: ShieldCheck,
      description: 'Custodio armado con vehículo propio'
    },
    { 
      value: 'abordo', 
      label: 'Custodio Abordo', 
      icon: User,
      description: 'Acompañante sin armas ni vehículo'
    }
  ];

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

  const requiereVehiculo = formData.tipo_custodio === 'custodio_vehiculo' || formData.tipo_custodio === 'armado_vehiculo';
  const esArmado = formData.tipo_custodio === 'armado' || formData.tipo_custodio === 'armado_vehiculo';

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
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Tipo de Custodio y Vehículo</h3>
      </div>

      {/* Selección de tipo de custodio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de Custodio *</CardTitle>
          <CardDescription>
            Selecciona el tipo de custodio según sus funciones y recursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiposCustodio.map((tipo) => {
              const IconComponent = tipo.icon;
              const isSelected = formData.tipo_custodio === tipo.value;
              
              return (
                <div
                  key={tipo.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onInputChange('tipo_custodio', tipo.value)}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 mt-0.5 ${
                      isSelected ? 'text-primary' : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isSelected ? 'text-primary' : 'text-gray-900'
                      }`}>
                        {tipo.label}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {tipo.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Información específica para armados */}
      {esArmado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Información de Seguridad Armada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="licencia_armas">Licencia de Portación de Armas *</Label>
              <Select 
                value={formData.licencia_armas} 
                onValueChange={(value) => onInputChange('licencia_armas', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de licencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedena">SEDENA (Defensa Nacional)</SelectItem>
                  <SelectItem value="semar">SEMAR (Marina)</SelectItem>
                  <SelectItem value="cnsp">CNSP (Seguridad Pública)</SelectItem>
                  <SelectItem value="tramite">En trámite</SelectItem>
                  <SelectItem value="no_tiene">No tiene</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experiencia_militar">Experiencia Militar/Policial</Label>
              <Select 
                value={formData.experiencia_militar} 
                onValueChange={(value) => onInputChange('experiencia_militar', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar experiencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ejercito">Ejército Mexicano</SelectItem>
                  <SelectItem value="marina">Marina de México</SelectItem>
                  <SelectItem value="policia_federal">Policía Federal</SelectItem>
                  <SelectItem value="policia_estatal">Policía Estatal</SelectItem>
                  <SelectItem value="policia_municipal">Policía Municipal</SelectItem>
                  <SelectItem value="guardia_nacional">Guardia Nacional</SelectItem>
                  <SelectItem value="seguridad_privada">Seguridad Privada</SelectItem>
                  <SelectItem value="sin_experiencia">Sin experiencia militar/policial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="años_experiencia_armada">Años de experiencia en seguridad armada</Label>
              <Input
                id="años_experiencia_armada"
                type="number"
                placeholder="Ej. 5"
                value={formData.años_experiencia_armada}
                onChange={(e) => onInputChange('años_experiencia_armada', e.target.value)}
                min="0"
                max="50"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del vehículo - solo si requiere vehículo */}
      {requiereVehiculo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      <SelectItem value="loading_marcas" disabled>
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
                      <SelectItem value="loading_modelos" disabled>
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
                      <SelectItem value="no_models_available" disabled>
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

            <div className="mt-4">
              <Label htmlFor="seguro_vigente">¿Cuenta con seguro vigente? *</Label>
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
          </CardContent>
        </Card>
      )}

      {/* Información específica para custodios abordo */}
      {formData.tipo_custodio === 'abordo' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Información de Acompañante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="especialidad_abordo">Especialidad o función específica</Label>
              <Select 
                value={formData.especialidad_abordo} 
                onValueChange={(value) => onInputChange('especialidad_abordo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observador">Observador/Comunicaciones</SelectItem>
                  <SelectItem value="navegacion">Apoyo en navegación</SelectItem>
                  <SelectItem value="documentacion">Manejo de documentación</SelectItem>
                  <SelectItem value="protocolo">Protocolo y etiqueta</SelectItem>
                  <SelectItem value="general">Apoyo general</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notas importantes */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>* Los campos marcados son obligatorios para el tipo de custodio seleccionado.</p>
        {requiereVehiculo && (
          <p>** Es obligatorio contar con seguro vigente para trabajar como custodio con vehículo.</p>
        )}
        {esArmado && (
          <p>** Los custodios armados deben contar con licencia vigente de portación de armas.</p>
        )}
      </div>
    </div>
  );
};
