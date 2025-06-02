import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/useAuth";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { LocationForm } from "./forms/LocationForm";
import { VehicleForm } from "./forms/VehicleForm";
import { ExperienceForm } from "./forms/ExperienceForm";

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

export const LeadForm = ({ onSuccess, onCancel }: LeadFormProps) => {
  const [etapaActual, setEtapaActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
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
      case 0: 
        return !!(formData.nombre && formData.email && formData.telefono);
      case 1: 
        return !!(formData.estado_id && formData.ciudad_id && formData.direccion);
      case 2: 
        return true; 
      case 3: 
        return true; 
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
      // Obtener nombres para el JSON
      let estadoNombre = '';
      let ciudadNombre = '';
      let zonaNombre = '';

      if (formData.estado_id) {
        const { data: estados } = await supabase
          .from('estados')
          .select('nombre')
          .eq('id', formData.estado_id)
          .single();
        estadoNombre = estados?.nombre || '';
      }

      if (formData.ciudad_id) {
        const { data: ciudades } = await supabase
          .from('ciudades')
          .select('nombre')
          .eq('id', formData.ciudad_id)
          .single();
        ciudadNombre = ciudades?.nombre || '';
      }

      if (formData.zona_trabajo_id) {
        const { data: zonas } = await supabase
          .from('zonas_trabajo')
          .select('nombre')
          .eq('id', formData.zona_trabajo_id)
          .single();
        zonaNombre = zonas?.nombre || '';
      }

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
          estado: estadoNombre,
          ciudad: ciudadNombre,
          zona_trabajo: zonaNombre,
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

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case 0:
        return <PersonalInfoForm formData={formData} onInputChange={handleInputChange} />;
      case 1:
        return <LocationForm formData={formData} onInputChange={handleInputChange} />;
      case 2:
        return <VehicleForm formData={formData} onInputChange={handleInputChange} />;
      case 3:
        return <ExperienceForm formData={formData} onInputChange={handleInputChange} />;
      default:
        return null;
    }
  };

  const EtapaActualIcon = ETAPAS[etapaActual].icono;

  // Mostrar mensaje si no hay usuario autenticado
  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Acceso requerido</CardTitle>
          <CardDescription>
            Debes estar autenticado para acceder al formulario de candidatos.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
