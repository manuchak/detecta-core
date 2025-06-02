
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Car, MapPin, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { useEstados, useCiudades, useZonasTrabajo } from "@/hooks/useGeograficos";

interface LeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  // Datos personales
  nombre: string;
  email: string;
  telefono: string;
  edad: string;
  direccion: string;
  
  // Ubicación (IDs de las tablas)
  estado_id: string;
  ciudad_id: string;
  zona_trabajo_id: string;
  
  // Información del vehículo
  marca_vehiculo: string;
  modelo_vehiculo: string;
  año_vehiculo: string;
  placas: string;
  color_vehiculo: string;
  tipo_vehiculo: string;
  seguro_vigente: string;
  
  // Experiencia laboral
  experiencia_custodia: string;
  años_experiencia: string;
  empresas_anteriores: string;
  licencia_conducir: string;
  tipo_licencia: string;
  antecedentes_penales: string;
  
  // Información adicional
  disponibilidad_horario: string;
  disponibilidad_dias: string;
  rango_km: string;
  mensaje: string;
  referencias: string;
  estado_solicitud: string;
  fuente: string;
}

const ETAPAS = [
  { id: 'personal', titulo: 'Datos Personales', icono: User },
  { id: 'ubicacion', titulo: 'Ubicación', icono: MapPin },
  { id: 'vehiculo', titulo: 'Vehículo', icono: Car },
  { id: 'experiencia', titulo: 'Experiencia', icono: Briefcase }
];

const MARCAS_VEHICULO = [
  'Nissan', 'Volkswagen', 'Chevrolet', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Kia', 
  'Mazda', 'Suzuki', 'Renault', 'Peugeot', 'SEAT', 'BMW', 'Mercedes-Benz', 'Audi', 'Otra'
];

const COLORES_VEHICULO = [
  'Blanco', 'Negro', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Café', 'Otro'
];

export const LeadForm = ({ onSuccess, onCancel }: LeadFormProps) => {
  const [etapaActual, setEtapaActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    // Datos personales
    nombre: "",
    email: "",
    telefono: "",
    edad: "",
    direccion: "",
    
    // Ubicación
    estado_id: "",
    ciudad_id: "",
    zona_trabajo_id: "",
    
    // Información del vehículo
    marca_vehiculo: "",
    modelo_vehiculo: "",
    año_vehiculo: "",
    placas: "",
    color_vehiculo: "",
    tipo_vehiculo: "",
    seguro_vigente: "",
    
    // Experiencia laboral
    experiencia_custodia: "",
    años_experiencia: "",
    empresas_anteriores: "",
    licencia_conducir: "",
    tipo_licencia: "",
    antecedentes_penales: "",
    
    // Información adicional
    disponibilidad_horario: "",
    disponibilidad_dias: "",
    rango_km: "",
    mensaje: "",
    referencias: "",
    estado_solicitud: "nuevo",
    fuente: "web"
  });

  // Hooks para datos geográficos
  const { estados, loading: estadosLoading, error: estadosError } = useEstados();
  const { ciudades, loading: ciudadesLoading } = useCiudades(formData.estado_id || null);
  const { zonas } = useZonasTrabajo(formData.ciudad_id || null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset campos dependientes cuando cambia el estado o ciudad
      if (field === 'estado_id') {
        newData.ciudad_id = "";
        newData.zona_trabajo_id = "";
      } else if (field === 'ciudad_id') {
        newData.zona_trabajo_id = "";
      }
      
      return newData;
    });
  };

  const validarEtapa = (etapa: number): boolean => {
    switch (etapa) {
      case 0: // Personal
        return !!(formData.nombre && formData.email && formData.telefono);
      case 1: // Ubicación
        return !!(formData.estado_id && formData.ciudad_id && formData.direccion);
      case 2: // Vehículo
        return true; // Opcional
      case 3: // Experiencia
        return true; // Opcional
      default:
        return true;
    }
  };

  const siguienteEtapa = () => {
    if (validarEtapa(etapaActual)) {
      setEtapaActual(prev => Math.min(prev + 1, ETAPAS.length - 1));
    } else {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios antes de continuar.",
        variant: "destructive",
      });
    }
  };

  const anteriorEtapa = () => {
    setEtapaActual(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarEtapa(etapaActual)) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Obtener nombres de estado, ciudad y zona para almacenar en el JSON
      const estadoSeleccionado = estados.find(e => e.id === formData.estado_id);
      const ciudadSeleccionada = ciudades.find(c => c.id === formData.ciudad_id);
      const zonaSeleccionada = zonas.find(z => z.id === formData.zona_trabajo_id);

      // Crear el lead básico
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          empresa: "Candidato a Custodio",
          mensaje: formData.mensaje,
          estado: formData.estado_solicitud,
          fuente: formData.fuente
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Crear los detalles del candidato
      const candidateDetails = {
        lead_id: leadData.id,
        datos_personales: {
          edad: formData.edad,
          direccion: formData.direccion,
          estado: estadoSeleccionado?.nombre || '',
          ciudad: ciudadSeleccionada?.nombre || '',
          zona_trabajo: zonaSeleccionada?.nombre || '',
          estado_id: formData.estado_id,
          ciudad_id: formData.ciudad_id,
          zona_trabajo_id: formData.zona_trabajo_id
        },
        vehiculo: {
          marca: formData.marca_vehiculo,
          modelo: formData.modelo_vehiculo,
          año: formData.año_vehiculo,
          placas: formData.placas,
          color: formData.color_vehiculo,
          tipo: formData.tipo_vehiculo,
          seguro_vigente: formData.seguro_vigente
        },
        experiencia: {
          experiencia_custodia: formData.experiencia_custodia,
          años_experiencia: formData.años_experiencia,
          empresas_anteriores: formData.empresas_anteriores,
          licencia_conducir: formData.licencia_conducir,
          tipo_licencia: formData.tipo_licencia,
          antecedentes_penales: formData.antecedentes_penales
        },
        disponibilidad: {
          horario: formData.disponibilidad_horario,
          dias: formData.disponibilidad_dias,
          rango_km: formData.rango_km
        },
        referencias: formData.referencias
      };

      // Actualizar el lead con los detalles completos
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          notas: JSON.stringify(candidateDetails)
        })
        .eq('id', leadData.id);

      if (updateError) throw updateError;

      toast({
        title: "Candidato registrado",
        description: "La información del candidato ha sido guardada exitosamente.",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información del candidato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEtapaPersonal = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre Completo *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            placeholder="Ingresa el nombre completo"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            placeholder="10 dígitos sin espacios"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edad">Edad</Label>
          <Select onValueChange={(value) => handleInputChange('edad', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar edad" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 43 }, (_, i) => i + 18).map(age => (
                <SelectItem key={age} value={age.toString()}>
                  {age} años
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderEtapaUbicacion = () => (
    <div className="space-y-6">
      {estadosError && (
        <div className="text-red-600 text-sm">
          Error cargando estados: {estadosError}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Select 
            value={formData.estado_id}
            onValueChange={(value) => handleInputChange('estado_id', value)}
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
            onValueChange={(value) => handleInputChange('ciudad_id', value)}
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
            onChange={(e) => handleInputChange('direccion', e.target.value)}
            placeholder="Calle, número, colonia, código postal"
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="zona_trabajo">Zona de trabajo preferida</Label>
          <Select 
            value={formData.zona_trabajo_id}
            onValueChange={(value) => handleInputChange('zona_trabajo_id', value)}
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
          <Select onValueChange={(value) => handleInputChange('disponibilidad_horario', value)}>
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
          <Select onValueChange={(value) => handleInputChange('rango_km', value)}>
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
          <Select onValueChange={(value) => handleInputChange('disponibilidad_dias', value)}>
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

  const renderEtapaVehiculo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marca_vehiculo">Marca del Vehículo</Label>
          <Select onValueChange={(value) => handleInputChange('marca_vehiculo', value)}>
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
            onChange={(e) => handleInputChange('modelo_vehiculo', e.target.value)}
            placeholder="Ej: Sentra, Jetta, Aveo"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="año_vehiculo">Año</Label>
          <Select onValueChange={(value) => handleInputChange('año_vehiculo', value)}>
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
            onChange={(e) => handleInputChange('placas', e.target.value.toUpperCase())}
            placeholder="XXX-XXX"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color_vehiculo">Color</Label>
          <Select onValueChange={(value) => handleInputChange('color_vehiculo', value)}>
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
          <Select onValueChange={(value) => handleInputChange('tipo_vehiculo', value)}>
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
          <Select onValueChange={(value) => handleInputChange('seguro_vigente', value)}>
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

  const renderEtapaExperiencia = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experiencia_custodia">¿Tienes experiencia en custodia?</Label>
          <Select onValueChange={(value) => handleInputChange('experiencia_custodia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="similar">Experiencia similar (seguridad, vigilancia)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="años_experiencia">Años de experiencia</Label>
          <Select onValueChange={(value) => handleInputChange('años_experiencia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sin experiencia</SelectItem>
              <SelectItem value="0-1">Menos de 1 año</SelectItem>
              <SelectItem value="1-2">1-2 años</SelectItem>
              <SelectItem value="2-5">2-5 años</SelectItem>
              <SelectItem value="5+">Más de 5 años</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="licencia_conducir">¿Tienes licencia de conducir vigente?</Label>
          <Select onValueChange={(value) => handleInputChange('licencia_conducir', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí, vigente</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="tramite">En trámite</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tipo_licencia">Tipo de licencia</Label>
          <Select onValueChange={(value) => handleInputChange('tipo_licencia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automovilista">Automovilista</SelectItem>
              <SelectItem value="chofer">Chofer</SelectItem>
              <SelectItem value="motociclista">Motociclista</SelectItem>
              <SelectItem value="federal">Federal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="antecedentes_penales">¿Tienes antecedentes penales?</Label>
          <Select onValueChange={(value) => handleInputChange('antecedentes_penales', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no_se">No lo sé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="empresas_anteriores">Empresas anteriores (opcional)</Label>
          <Textarea
            id="empresas_anteriores"
            value={formData.empresas_anteriores}
            onChange={(e) => handleInputChange('empresas_anteriores', e.target.value)}
            placeholder="Menciona las empresas donde has trabajado en seguridad o custodia"
            rows={3}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="referencias">Referencias (opcional)</Label>
          <Textarea
            id="referencias"
            value={formData.referencias}
            onChange={(e) => handleInputChange('referencias', e.target.value)}
            placeholder="Nombres y teléfonos de referencias laborales o personales"
            rows={3}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="mensaje">Comentarios adicionales</Label>
          <Textarea
            id="mensaje"
            value={formData.mensaje}
            onChange={(e) => handleInputChange('mensaje', e.target.value)}
            placeholder="Cualquier información adicional que consideres relevante"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case 0:
        return renderEtapaPersonal();
      case 1:
        return renderEtapaUbicacion();
      case 2:
        return renderEtapaVehiculo();
      case 3:
        return renderEtapaExperiencia();
      default:
        return null;
    }
  };

  const EtapaActualIcon = ETAPAS[etapaActual].icono;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EtapaActualIcon className="h-5 w-5" />
          Registro de Candidato - {ETAPAS[etapaActual].titulo}
        </CardTitle>
        <CardDescription>
          Etapa {etapaActual + 1} de {ETAPAS.length}: {ETAPAS[etapaActual].titulo}
        </CardDescription>
        
        {/* Indicador de progreso */}
        <div className="flex gap-2 mt-4">
          {ETAPAS.map((etapa, index) => (
            <div
              key={etapa.id}
              className={`flex-1 h-2 rounded-full ${
                index <= etapaActual ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderEtapaActual()}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={anteriorEtapa}
              disabled={etapaActual === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              
              {etapaActual < ETAPAS.length - 1 ? (
                <Button type="button" onClick={siguienteEtapa}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Candidato
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
