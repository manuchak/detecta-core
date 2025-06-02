
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Car, MapPin, Briefcase } from "lucide-react";

interface LeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LeadForm = ({ onSuccess, onCancel }: LeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Datos personales
    nombre: "",
    email: "",
    telefono: "",
    edad: "",
    direccion: "",
    ciudad: "",
    estado: "",
    codigo_postal: "",
    
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
    
    // Zona de trabajo
    zona_preferida: "",
    disponibilidad_horario: "",
    disponibilidad_dias: "",
    rango_km: "",
    
    // Información adicional
    mensaje: "",
    referencias: "",
    estado_solicitud: "nuevo",
    fuente: "web"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear el lead básico en la tabla leads
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

      // Crear un registro detallado del candidato (usaremos la tabla leads con campos JSON)
      const candidateDetails = {
        lead_id: leadData.id,
        datos_personales: {
          edad: formData.edad,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          estado: formData.estado,
          codigo_postal: formData.codigo_postal
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
        zona_trabajo: {
          zona_preferida: formData.zona_preferida,
          disponibilidad_horario: formData.disponibilidad_horario,
          disponibilidad_dias: formData.disponibilidad_dias,
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Registro de Candidato a Custodio
        </CardTitle>
        <CardDescription>
          Completa la información del candidato para iniciar el proceso de evaluación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="vehiculo" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehículo
              </TabsTrigger>
              <TabsTrigger value="experiencia" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Experiencia
              </TabsTrigger>
              <TabsTrigger value="zona" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Zona
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    value={formData.edad}
                    onChange={(e) => handleInputChange('edad', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vehiculo" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca_vehiculo">Marca del Vehículo</Label>
                  <Input
                    id="marca_vehiculo"
                    value={formData.marca_vehiculo}
                    onChange={(e) => handleInputChange('marca_vehiculo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo_vehiculo">Modelo</Label>
                  <Input
                    id="modelo_vehiculo"
                    value={formData.modelo_vehiculo}
                    onChange={(e) => handleInputChange('modelo_vehiculo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="año_vehiculo">Año</Label>
                  <Input
                    id="año_vehiculo"
                    type="number"
                    value={formData.año_vehiculo}
                    onChange={(e) => handleInputChange('año_vehiculo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placas">Placas</Label>
                  <Input
                    id="placas"
                    value={formData.placas}
                    onChange={(e) => handleInputChange('placas', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color_vehiculo">Color</Label>
                  <Input
                    id="color_vehiculo"
                    value={formData.color_vehiculo}
                    onChange={(e) => handleInputChange('color_vehiculo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_vehiculo">Tipo de Vehículo</Label>
                  <Select onValueChange={(value) => handleInputChange('tipo_vehiculo', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedán">Sedán</SelectItem>
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
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="en_tramite">En trámite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experiencia" className="space-y-4">
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
                      <SelectItem value="similar">Experiencia similar</SelectItem>
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
                      <SelectItem value="1">1 año</SelectItem>
                      <SelectItem value="2-3">2-3 años</SelectItem>
                      <SelectItem value="4-5">4-5 años</SelectItem>
                      <SelectItem value="5+">Más de 5 años</SelectItem>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licencia_conducir">¿Tienes licencia de conducir vigente?</Label>
                  <Select onValueChange={(value) => handleInputChange('licencia_conducir', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="tramite">En trámite</SelectItem>
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
              </div>
            </TabsContent>

            <TabsContent value="zona" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zona_preferida">Zona de trabajo preferida</Label>
                  <Input
                    id="zona_preferida"
                    value={formData.zona_preferida}
                    onChange={(e) => handleInputChange('zona_preferida', e.target.value)}
                    placeholder="Ej: Norte de la ciudad, Centro, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rango_km">Rango de kilómetros dispuesto a trabajar</Label>
                  <Select onValueChange={(value) => handleInputChange('rango_km', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-50">0-50 km</SelectItem>
                      <SelectItem value="50-100">50-100 km</SelectItem>
                      <SelectItem value="100-200">100-200 km</SelectItem>
                      <SelectItem value="200+">Más de 200 km</SelectItem>
                      <SelectItem value="nacional">Nivel nacional</SelectItem>
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
                      <SelectItem value="matutino">Turno matutino</SelectItem>
                      <SelectItem value="vespertino">Turno vespertino</SelectItem>
                      <SelectItem value="nocturno">Turno nocturno</SelectItem>
                      <SelectItem value="fines_semana">Solo fines de semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disponibilidad_dias">Días disponibles</Label>
                  <Input
                    id="disponibilidad_dias"
                    value={formData.disponibilidad_dias}
                    onChange={(e) => handleInputChange('disponibilidad_dias', e.target.value)}
                    placeholder="Ej: Lunes a viernes, Fines de semana"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="referencias">Referencias (opcional)</Label>
                  <Textarea
                    id="referencias"
                    value={formData.referencias}
                    onChange={(e) => handleInputChange('referencias', e.target.value)}
                    placeholder="Nombres y teléfonos de referencias laborales o personales"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mensaje">Comentarios adicionales</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => handleInputChange('mensaje', e.target.value)}
                    placeholder="Cualquier información adicional que consideres relevante"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Candidato
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
