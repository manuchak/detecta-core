
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
  estado: string;
  ciudad: string;
  zona_trabajo: string;
  
  // Tipo de custodio
  tipo_custodio: string;
  
  // Vehículo
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_año: string;
  vehiculo_placas: string;
  vehiculo_color: string;
  vehiculo_tipo: string;
  seguro_vigente: string;
  
  // Seguridad armada
  licencia_armas: string;
  experiencia_militar: string;
  años_experiencia_armada: string;
  
  // Custodio abordo
  especialidad: string;
  
  // Experiencia
  experiencia_custodia: string;
  años_experiencia: string;
  licencia_conducir: string;
  tipo_licencia: string;
  antecedentes_penales: string;
  
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
    estado: "",
    ciudad: "",
    zona_trabajo: "",
    
    // Tipo de custodio
    tipo_custodio: "",
    
    // Vehículo
    vehiculo_marca: "",
    vehiculo_modelo: "",
    vehiculo_año: "",
    vehiculo_placas: "",
    vehiculo_color: "",
    vehiculo_tipo: "",
    seguro_vigente: "",
    
    // Seguridad armada
    licencia_armas: "",
    experiencia_militar: "",
    años_experiencia_armada: "",
    
    // Custodio abordo
    especialidad: "",
    
    // Experiencia
    experiencia_custodia: "",
    años_experiencia: "",
    licencia_conducir: "",
    tipo_licencia: "",
    antecedentes_penales: "",
    
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
        estado: notesData.datos_personales?.estado || "",
        ciudad: notesData.datos_personales?.ciudad || "",
        zona_trabajo: notesData.datos_personales?.zona_trabajo || "",
        
        // Tipo de custodio
        tipo_custodio: notesData.tipo_custodio || "",
        
        // Vehículo
        vehiculo_marca: notesData.vehiculo?.marca || "",
        vehiculo_modelo: notesData.vehiculo?.modelo || "",
        vehiculo_año: notesData.vehiculo?.año || "",
        vehiculo_placas: notesData.vehiculo?.placas || "",
        vehiculo_color: notesData.vehiculo?.color || "",
        vehiculo_tipo: notesData.vehiculo?.tipo || "",
        seguro_vigente: notesData.vehiculo?.seguro_vigente || "",
        
        // Seguridad armada
        licencia_armas: notesData.seguridad_armada?.licencia_armas || "",
        experiencia_militar: notesData.seguridad_armada?.experiencia_militar || "",
        años_experiencia_armada: notesData.seguridad_armada?.años_experiencia_armada || "",
        
        // Custodio abordo
        especialidad: notesData.custodio_abordo?.especialidad || "",
        
        // Experiencia
        experiencia_custodia: notesData.experiencia?.experiencia_custodia || "",
        años_experiencia: notesData.experiencia?.años_experiencia || "",
        licencia_conducir: notesData.experiencia?.licencia_conducir || "",
        tipo_licencia: notesData.experiencia?.tipo_licencia || "",
        antecedentes_penales: notesData.experiencia?.antecedentes_penales || "",
        
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
        estado: data.estado,
        ciudad: data.ciudad,
        zona_trabajo: data.zona_trabajo
      },
      tipo_custodio: data.tipo_custodio,
      vehiculo: {
        marca: data.vehiculo_marca,
        modelo: data.vehiculo_modelo,
        año: data.vehiculo_año,
        placas: data.vehiculo_placas,
        color: data.vehiculo_color,
        tipo: data.vehiculo_tipo,
        seguro_vigente: data.seguro_vigente
      },
      seguridad_armada: {
        licencia_armas: data.licencia_armas,
        experiencia_militar: data.experiencia_militar,
        años_experiencia_armada: data.años_experiencia_armada
      },
      custodio_abordo: {
        especialidad: data.especialidad
      },
      experiencia: {
        experiencia_custodia: data.experiencia_custodia,
        años_experiencia: data.años_experiencia,
        licencia_conducir: data.licencia_conducir,
        tipo_licencia: data.tipo_licencia,
        antecedentes_penales: data.antecedentes_penales
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
          estado: formData.estado,
          ciudad: formData.ciudad,
          zona_trabajo: formData.zona_trabajo
        },
        tipo_custodio: formData.tipo_custodio,
        vehiculo: {
          marca: formData.vehiculo_marca,
          modelo: formData.vehiculo_modelo,
          año: formData.vehiculo_año,
          placas: formData.vehiculo_placas,
          color: formData.vehiculo_color,
          tipo: formData.vehiculo_tipo,
          seguro_vigente: formData.seguro_vigente
        },
        seguridad_armada: {
          licencia_armas: formData.licencia_armas,
          experiencia_militar: formData.experiencia_militar,
          años_experiencia_armada: formData.años_experiencia_armada
        },
        custodio_abordo: {
          especialidad: formData.especialidad
        },
        experiencia: {
          experiencia_custodia: formData.experiencia_custodia,
          años_experiencia: formData.años_experiencia,
          licencia_conducir: formData.licencia_conducir,
          tipo_licencia: formData.tipo_licencia,
          antecedentes_penales: formData.antecedentes_penales
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

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <div className="space-y-6">
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
          <Accordion type="multiple" defaultValue={["basic", "personal", "type", "experience", "availability"]} className="w-full">
            
            {/* Información Básica */}
            <AccordionItem value="basic">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información Básica
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-sm font-medium">
                      Nombre completo *
                      {missingFields.includes('Nombre completo') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Ingrese el nombre completo"
                      className={missingFields.includes('Nombre completo') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                      {missingFields.includes('Email') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={missingFields.includes('Email') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="text-sm font-medium">
                      Teléfono *
                      {missingFields.includes('Teléfono') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className={missingFields.includes('Teléfono') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

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

            {/* Datos Personales */}
            <AccordionItem value="personal">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Datos Personales
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edad" className="text-sm font-medium">
                      Edad *
                      {missingFields.includes('Edad') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="edad"
                      value={formData.edad}
                      onChange={(e) => handleInputChange('edad', e.target.value)}
                      placeholder="Ejemplo: 30"
                      className={missingFields.includes('Edad') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion" className="text-sm font-medium">
                      Dirección *
                      {missingFields.includes('Dirección') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      placeholder="Dirección completa"
                      className={missingFields.includes('Dirección') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-sm font-medium">
                      Estado *
                      {missingFields.includes('Estado') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      placeholder="Estado de residencia"
                      className={missingFields.includes('Estado') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ciudad" className="text-sm font-medium">
                      Ciudad *
                      {missingFields.includes('Ciudad') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                      placeholder="Ciudad de residencia"
                      className={missingFields.includes('Ciudad') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="zona_trabajo" className="text-sm font-medium">
                      Zona de trabajo *
                      {missingFields.includes('Zona de trabajo') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="zona_trabajo"
                      value={formData.zona_trabajo}
                      onChange={(e) => handleInputChange('zona_trabajo', e.target.value)}
                      placeholder="Zona donde puede trabajar"
                      className={missingFields.includes('Zona de trabajo') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Tipo de Custodio */}
            <AccordionItem value="type">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Tipo de Custodio
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_custodio" className="text-sm font-medium">
                      Tipo de custodio *
                      {missingFields.includes('Tipo de custodio') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Select value={formData.tipo_custodio} onValueChange={(value) => handleInputChange('tipo_custodio', value)}>
                      <SelectTrigger className={missingFields.includes('Tipo de custodio') ? 'border-red-300 focus:border-red-500' : ''}>
                        <SelectValue placeholder="Seleccione el tipo de custodio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custodio">Custodio</SelectItem>
                        <SelectItem value="custodio_vehiculo">Custodio con vehículo</SelectItem>
                        <SelectItem value="armado">Seguridad armada</SelectItem>
                        <SelectItem value="armado_vehiculo">Seguridad armada con vehículo</SelectItem>
                        <SelectItem value="abordo">Custodio abordo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campos específicos según tipo de custodio */}
                  {requiereVehiculo && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Información del Vehículo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vehiculo_marca" className="text-sm font-medium">
                            Marca del vehículo *
                            {missingFields.includes('Marca del vehículo') && (
                              <span className="text-red-500 ml-1">Requerido</span>
                            )}
                          </Label>
                          <Input
                            id="vehiculo_marca"
                            value={formData.vehiculo_marca}
                            onChange={(e) => handleInputChange('vehiculo_marca', e.target.value)}
                            placeholder="Marca del vehículo"
                            className={missingFields.includes('Marca del vehículo') ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vehiculo_modelo" className="text-sm font-medium">
                            Modelo del vehículo *
                            {missingFields.includes('Modelo del vehículo') && (
                              <span className="text-red-500 ml-1">Requerido</span>
                            )}
                          </Label>
                          <Input
                            id="vehiculo_modelo"
                            value={formData.vehiculo_modelo}
                            onChange={(e) => handleInputChange('vehiculo_modelo', e.target.value)}
                            placeholder="Modelo del vehículo"
                            className={missingFields.includes('Modelo del vehículo') ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vehiculo_año" className="text-sm font-medium">
                            Año del vehículo *
                            {missingFields.includes('Año del vehículo') && (
                              <span className="text-red-500 ml-1">Requerido</span>
                            )}
                          </Label>
                          <Input
                            id="vehiculo_año"
                            value={formData.vehiculo_año}
                            onChange={(e) => handleInputChange('vehiculo_año', e.target.value)}
                            placeholder="Año del vehículo"
                            className={missingFields.includes('Año del vehículo') ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="vehiculo_placas" className="text-sm font-medium">
                            Placas del vehículo *
                            {missingFields.includes('Placas del vehículo') && (
                              <span className="text-red-500 ml-1">Requerido</span>
                            )}
                          </Label>
                          <Input
                            id="vehiculo_placas"
                            value={formData.vehiculo_placas}
                            onChange={(e) => handleInputChange('vehiculo_placas', e.target.value)}
                            placeholder="Placas del vehículo"
                            className={missingFields.includes('Placas del vehículo') ? 'border-red-300 focus:border-red-500' : ''}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="seguro_vigente" className="text-sm font-medium">
                            Seguro vigente *
                            {missingFields.includes('Seguro vigente') && (
                              <span className="text-red-500 ml-1">Requerido</span>
                            )}
                          </Label>
                          <Select value={formData.seguro_vigente} onValueChange={(value) => handleInputChange('seguro_vigente', value)}>
                            <SelectTrigger className={missingFields.includes('Seguro vigente') ? 'border-red-300 focus:border-red-500' : ''}>
                              <SelectValue placeholder="¿Tiene seguro vigente?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {esArmado && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Seguridad Armada
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="licencia_armas" className="text-sm font-medium">
                            Licencia de armas *
                            {missingFields.includes('Licencia de armas') && (
                              <span className="text-red-500 ml-1">Requerido</span>
                            )}
                          </Label>
                          <Select value={formData.licencia_armas} onValueChange={(value) => handleInputChange('licencia_armas', value)}>
                            <SelectTrigger className={missingFields.includes('Licencia de armas') ? 'border-red-300 focus:border-red-500' : ''}>
                              <SelectValue placeholder="¿Tiene licencia de armas?" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Sí</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="en_tramite">En trámite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {esAbordo && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Custodio Abordo</h4>
                      <div className="space-y-2">
                        <Label htmlFor="especialidad" className="text-sm font-medium">
                          Especialidad abordo *
                          {missingFields.includes('Especialidad abordo') && (
                            <span className="text-red-500 ml-1">Requerido</span>
                          )}
                        </Label>
                        <Input
                          id="especialidad"
                          value={formData.especialidad}
                          onChange={(e) => handleInputChange('especialidad', e.target.value)}
                          placeholder="Especialidad para custodio abordo"
                          className={missingFields.includes('Especialidad abordo') ? 'border-red-300 focus:border-red-500' : ''}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Experiencia */}
            <AccordionItem value="experience">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Experiencia
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experiencia_custodia" className="text-sm font-medium">
                      Experiencia en custodia *
                      {missingFields.includes('Experiencia en custodia') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Select value={formData.experiencia_custodia} onValueChange={(value) => handleInputChange('experiencia_custodia', value)}>
                      <SelectTrigger className={missingFields.includes('Experiencia en custodia') ? 'border-red-300 focus:border-red-500' : ''}>
                        <SelectValue placeholder="¿Tiene experiencia en custodia?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="años_experiencia" className="text-sm font-medium">
                      Años de experiencia *
                      {missingFields.includes('Años de experiencia') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Input
                      id="años_experiencia"
                      value={formData.años_experiencia}
                      onChange={(e) => handleInputChange('años_experiencia', e.target.value)}
                      placeholder="Años de experiencia"
                      className={missingFields.includes('Años de experiencia') ? 'border-red-300 focus:border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licencia_conducir" className="text-sm font-medium">
                      Licencia de conducir *
                      {missingFields.includes('Licencia de conducir') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Select value={formData.licencia_conducir} onValueChange={(value) => handleInputChange('licencia_conducir', value)}>
                      <SelectTrigger className={missingFields.includes('Licencia de conducir') ? 'border-red-300 focus:border-red-500' : ''}>
                        <SelectValue placeholder="¿Tiene licencia de conducir?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="antecedentes_penales" className="text-sm font-medium">
                      Antecedentes penales *
                      {missingFields.includes('Antecedentes penales') && (
                        <span className="text-red-500 ml-1">Requerido</span>
                      )}
                    </Label>
                    <Select value={formData.antecedentes_penales} onValueChange={(value) => handleInputChange('antecedentes_penales', value)}>
                      <SelectTrigger className={missingFields.includes('Antecedentes penales') ? 'border-red-300 focus:border-red-500' : ''}>
                        <SelectValue placeholder="¿Tiene antecedentes penales?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="si">Sí</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Disponibilidad */}
            <AccordionItem value="availability">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Disponibilidad
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
