
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Save, User, Car, Shield, Clock } from "lucide-react";
import { AssignedLead } from "@/types/leadTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateLeadForApproval, getValidationMessage } from "@/utils/leadValidation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PersonalInfoForm } from "@/components/leads/forms/PersonalInfoForm";
import { LocationForm } from "@/components/leads/forms/LocationForm";
import { VehicleForm } from "@/components/leads/forms/VehicleForm";
import { ExperienceForm } from "@/components/leads/forms/ExperienceForm";
import { RecruitmentFaq } from "./RecruitmentFaq";

interface MissingInfoDialogProps {
  lead: AssignedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface FormDataInterface {
  // Campos básicos
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  notas: string;
  
  // Datos personales
  edad: string;
  direccion: string;
  estado_id: string;
  ciudad_id: string;
  zona_trabajo_id: string;
  
  // Tipo de custodio
  tipo_custodio: string;
  
  // Vehículo
  marca_vehiculo: string;
  modelo_vehiculo: string;
  año_vehiculo: string;
  placas: string;
  color_vehiculo: string;
  tipo_vehiculo: string;
  seguro_vigente: string;
  
  // Seguridad armada
  licencia_armas: string;
  experiencia_militar: string;
  años_experiencia_armada: string;
  
  // Custodio abordo
  especialidad_abordo: string;
  
  // Experiencia
  experiencia_custodia: string;
  años_experiencia: string;
  empresas_anteriores: string;
  licencia_conducir: string;
  tipo_licencia: string;
  antecedentes_penales: string;
  referencias: string;
  mensaje: string;
  
  // Disponibilidad
  horario: string;
  dias: string;
}

export const MissingInfoDialog = ({
  lead,
  open,
  onOpenChange,
  onUpdate
}: MissingInfoDialogProps) => {
  const [formData, setFormData] = useState<FormDataInterface>({
    // Campos básicos
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    notas: "",
    
    // Datos personales
    edad: "",
    direccion: "",
    estado_id: "",
    ciudad_id: "",
    zona_trabajo_id: "",
    
    // Tipo de custodio
    tipo_custodio: "",
    
    // Vehículo
    marca_vehiculo: "",
    modelo_vehiculo: "",
    año_vehiculo: "",
    placas: "",
    color_vehiculo: "",
    tipo_vehiculo: "",
    seguro_vigente: "",
    
    // Seguridad armada
    licencia_armas: "",
    experiencia_militar: "",
    años_experiencia_armada: "",
    
    // Custodio abordo
    especialidad_abordo: "",
    
    // Experiencia
    experiencia_custodia: "",
    años_experiencia: "",
    empresas_anteriores: "",
    licencia_conducir: "",
    tipo_licencia: "",
    antecedentes_penales: "",
    referencias: "",
    mensaje: "",
    
    // Disponibilidad
    horario: "",
    dias: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (lead && open) {
      // Parsear datos existentes del lead
      let notesData: any = {};
      try {
        if (lead.notas) {
          notesData = JSON.parse(lead.notas);
        }
      } catch (error) {
        console.warn("Error parsing lead notes:", error);
      }

      // Cargar datos actuales del lead
      setFormData({
        // Campos básicos
        nombre: lead.lead_nombre || "",
        email: lead.lead_email || "",
        telefono: lead.lead_telefono || "",
        empresa: notesData.empresa || "",
        notas: typeof lead.notas === 'string' && lead.notas.trim() && !lead.notas.startsWith('{') ? lead.notas : "",
        
        // Datos personales
        edad: notesData.datos_personales?.edad || "",
        direccion: notesData.datos_personales?.direccion || "",
        estado_id: notesData.datos_personales?.estado_id || "",
        ciudad_id: notesData.datos_personales?.ciudad_id || "",
        zona_trabajo_id: notesData.datos_personales?.zona_trabajo_id || "",
        
        // Tipo de custodio
        tipo_custodio: notesData.tipo_custodio || "",
        
        // Vehículo
        marca_vehiculo: notesData.vehiculo?.marca_vehiculo || "",
        modelo_vehiculo: notesData.vehiculo?.modelo_vehiculo || "",
        año_vehiculo: notesData.vehiculo?.año_vehiculo || "",
        placas: notesData.vehiculo?.placas || "",
        color_vehiculo: notesData.vehiculo?.color_vehiculo || "",
        tipo_vehiculo: notesData.vehiculo?.tipo_vehiculo || "",
        seguro_vigente: notesData.vehiculo?.seguro_vigente || "",
        
        // Seguridad armada
        licencia_armas: notesData.seguridad_armada?.licencia_armas || "",
        experiencia_militar: notesData.seguridad_armada?.experiencia_militar || "",
        años_experiencia_armada: notesData.seguridad_armada?.años_experiencia_armada || "",
        
        // Custodio abordo
        especialidad_abordo: notesData.custodio_abordo?.especialidad_abordo || "",
        
        // Experiencia
        experiencia_custodia: notesData.experiencia?.experiencia_custodia || "",
        años_experiencia: notesData.experiencia?.años_experiencia || "",
        empresas_anteriores: notesData.experiencia?.empresas_anteriores || "",
        licencia_conducir: notesData.experiencia?.licencia_conducir || "",
        tipo_licencia: notesData.experiencia?.tipo_licencia || "",
        antecedentes_penales: notesData.experiencia?.antecedentes_penales || "",
        referencias: notesData.experiencia?.referencias || "",
        mensaje: notesData.experiencia?.mensaje || "",
        
        // Disponibilidad
        horario: notesData.disponibilidad?.horario || "",
        dias: notesData.disponibilidad?.dias || ""
      });

      // Validar campos faltantes
      const validation = validateLeadForApproval(lead);
      setMissingFields(validation.missingFields);
    }
  }, [lead, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Actualizar lista de campos faltantes en tiempo real
    const updatedFormData = { ...formData, [field]: value };
    const mockLead = createMockLeadFromFormData(updatedFormData);
    const validation = validateLeadForApproval(mockLead);
    setMissingFields(validation.missingFields);
  };

  const createMockLeadFromFormData = (data: FormDataInterface) => {
    const notesData = {
      datos_personales: {
        edad: data.edad,
        direccion: data.direccion,
        estado_id: data.estado_id,
        ciudad_id: data.ciudad_id,
        zona_trabajo_id: data.zona_trabajo_id
      },
      tipo_custodio: data.tipo_custodio,
      vehiculo: {
        marca_vehiculo: data.marca_vehiculo,
        modelo_vehiculo: data.modelo_vehiculo,
        año_vehiculo: data.año_vehiculo,
        placas: data.placas,
        color_vehiculo: data.color_vehiculo,
        tipo_vehiculo: data.tipo_vehiculo,
        seguro_vigente: data.seguro_vigente
      },
      seguridad_armada: {
        licencia_armas: data.licencia_armas,
        experiencia_militar: data.experiencia_militar,
        años_experiencia_armada: data.años_experiencia_armada
      },
      custodio_abordo: {
        especialidad_abordo: data.especialidad_abordo
      },
      experiencia: {
        experiencia_custodia: data.experiencia_custodia,
        años_experiencia: data.años_experiencia,
        empresas_anteriores: data.empresas_anteriores,
        licencia_conducir: data.licencia_conducir,
        tipo_licencia: data.tipo_licencia,
        antecedentes_penales: data.antecedentes_penales,
        referencias: data.referencias,
        mensaje: data.mensaje
      },
      disponibilidad: {
        horario: data.horario,
        dias: data.dias
      },
      empresa: data.empresa
    };

    return {
      ...lead!,
      lead_nombre: data.nombre,
      lead_email: data.email,
      lead_telefono: data.telefono,
      notas: JSON.stringify(notesData)
    };
  };

  const handleSave = async () => {
    if (!lead) return;

    try {
      setLoading(true);

      // Crear objeto de notas estructurado
      const notesData = {
        datos_personales: {
          edad: formData.edad,
          direccion: formData.direccion,
          estado_id: formData.estado_id,
          ciudad_id: formData.ciudad_id,
          zona_trabajo_id: formData.zona_trabajo_id
        },
        tipo_custodio: formData.tipo_custodio,
        vehiculo: {
          marca_vehiculo: formData.marca_vehiculo,
          modelo_vehiculo: formData.modelo_vehiculo,
          año_vehiculo: formData.año_vehiculo,
          placas: formData.placas,
          color_vehiculo: formData.color_vehiculo,
          tipo_vehiculo: formData.tipo_vehiculo,
          seguro_vigente: formData.seguro_vigente
        },
        seguridad_armada: {
          licencia_armas: formData.licencia_armas,
          experiencia_militar: formData.experiencia_militar,
          años_experiencia_armada: formData.años_experiencia_armada
        },
        custodio_abordo: {
          especialidad_abordo: formData.especialidad_abordo
        },
        experiencia: {
          experiencia_custodia: formData.experiencia_custodia,
          años_experiencia: formData.años_experiencia,
          empresas_anteriores: formData.empresas_anteriores,
          licencia_conducir: formData.licencia_conducir,
          tipo_licencia: formData.tipo_licencia,
          antecedentes_penales: formData.antecedentes_penales,
          referencias: formData.referencias,
          mensaje: formData.mensaje
        },
        disponibilidad: {
          horario: formData.horario,
          dias: formData.dias
        },
        empresa: formData.empresa,
        notas_adicionales: formData.notas
      };

      const { error } = await supabase
        .from('leads')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          empresa: formData.empresa,
          notas: JSON.stringify(notesData),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      if (error) throw error;

      toast({
        title: "Información actualizada",
        description: "La información del candidato ha sido actualizada exitosamente.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del candidato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = missingFields.length === 0;
  const requiereVehiculo = formData.tipo_custodio === 'custodio_vehiculo' || formData.tipo_custodio === 'armado_vehiculo';
  const esArmado = formData.tipo_custodio === 'armado' || formData.tipo_custodio === 'armado_vehiculo';
  const esAbordo = formData.tipo_custodio === 'abordo';

  // Calcular campos faltantes por categoría
  const getFieldsByCategory = () => {
    const basicFields = ['Nombre', 'Email', 'Teléfono', 'Empresa', 'Edad'];
    const locationFields = ['Dirección', 'Estado'];
    const vehicleFields = ['Tipo de custodio', 'Marca del vehículo', 'Modelo del vehículo', 'Año del vehículo', 'Licencia armas', 'Especialidad a bordo'];
    const experienceFields = ['Experiencia en custodia', 'Años de experiencia', 'Empresas anteriores', 'Licencia de conducir', 'Antecedentes penales', 'Referencias'];
    const availabilityFields = ['Disponibilidad de horario', 'Disponibilidad de días'];

    return {
      basic: missingFields.filter(field => basicFields.includes(field)).length,
      location: missingFields.filter(field => locationFields.includes(field)).length,
      vehicle: missingFields.filter(field => vehicleFields.includes(field)).length,
      experience: missingFields.filter(field => experienceFields.includes(field)).length,
      availability: missingFields.filter(field => availabilityFields.includes(field)).length
    };
  };

  const missingByCategory = getFieldsByCategory();

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Completar Información del Candidato
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Complete los campos faltantes para proceder con la aprobación
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Panel principal del formulario */}
          <div className="flex-1 space-y-6">
          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Estado de la información</h3>
              {isFormValid ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completa
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {missingFields.length} campos faltantes
                </Badge>
              )}
            </div>
            
            {!isFormValid && (
              <p className="text-sm text-gray-600">
                {getValidationMessage(missingFields)}
              </p>
            )}
          </div>

          {/* Formulario en acordeón */}
          <Accordion type="multiple" defaultValue={[]} className="w-full">
            
            {/* Información Básica */}
            <AccordionItem value="basic">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Información Básica
                  </div>
                  {missingByCategory.basic > 0 && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 ml-2">
                      {missingByCategory.basic}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <PersonalInfoForm
                  formData={{
                    nombre: formData.nombre,
                    email: formData.email,
                    telefono: formData.telefono,
                    edad: formData.edad
                  }}
                  onInputChange={handleInputChange}
                />
                <div className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa" className="text-sm font-medium">
                      Empresa
                    </Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ubicación */}
            <AccordionItem value="location">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ubicación y Datos Personales
                  </div>
                  {missingByCategory.location > 0 && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 ml-2">
                      {missingByCategory.location}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <LocationForm
                  formData={{
                    direccion: formData.direccion,
                    estado_id: formData.estado_id,
                    ciudad_id: formData.ciudad_id,
                    zona_trabajo_id: formData.zona_trabajo_id
                  }}
                  onInputChange={handleInputChange}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Vehículo y Tipo de Custodio */}
            <AccordionItem value="vehicle">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Tipo de Custodio y Vehículo
                  </div>
                  {missingByCategory.vehicle > 0 && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 ml-2">
                      {missingByCategory.vehicle}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <VehicleForm
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Experiencia */}
            <AccordionItem value="experience">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Experiencia
                  </div>
                  {missingByCategory.experience > 0 && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 ml-2">
                      {missingByCategory.experience}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ExperienceForm
                  formData={{
                    experiencia_custodia: formData.experiencia_custodia,
                    años_experiencia: formData.años_experiencia,
                    empresas_anteriores: formData.empresas_anteriores,
                    licencia_conducir: formData.licencia_conducir,
                    tipo_licencia: formData.tipo_licencia,
                    antecedentes_penales: formData.antecedentes_penales,
                    referencias: formData.referencias,
                    mensaje: formData.mensaje
                  }}
                  onInputChange={handleInputChange}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Disponibilidad */}
            <AccordionItem value="availability">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Disponibilidad
                  </div>
                  {missingByCategory.availability > 0 && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 ml-2">
                      {missingByCategory.availability}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horario" className="text-sm font-medium">
                      Disponibilidad de horario *
                      {missingFields.includes('Disponibilidad de horario') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Select value={formData.horario} onValueChange={(value) => handleInputChange('horario', value)}>
                      <SelectTrigger className={missingFields.includes('Disponibilidad de horario') ? 'border-red-300 focus:border-red-500' : ''}>
                        <SelectValue placeholder="Seleccione disponibilidad de horario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matutino">Matutino</SelectItem>
                        <SelectItem value="vespertino">Vespertino</SelectItem>
                        <SelectItem value="nocturno">Nocturno</SelectItem>
                        <SelectItem value="24_horas">24 horas</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dias" className="text-sm font-medium">
                      Disponibilidad de días *
                      {missingFields.includes('Disponibilidad de días') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Select value={formData.dias} onValueChange={(value) => handleInputChange('dias', value)}>
                      <SelectTrigger className={missingFields.includes('Disponibilidad de días') ? 'border-red-300 focus:border-red-500' : ''}>
                        <SelectValue placeholder="Seleccione disponibilidad de días" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lunes_viernes">Lunes a Viernes</SelectItem>
                        <SelectItem value="fines_semana">Fines de semana</SelectItem>
                        <SelectItem value="todos_dias">Todos los días</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notas" className="text-sm font-medium">
              Notas adicionales
            </Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleInputChange('notas', e.target.value)}
              placeholder="Agregar comentarios, observaciones o información relevante..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
          
        {/* Panel FAQ lateral */}
        <div className="w-80 flex-shrink-0">
          <RecruitmentFaq />
        </div>
      </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !isFormValid}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
