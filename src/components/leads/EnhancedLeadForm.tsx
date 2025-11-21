// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";
import { LeadEstado } from "@/types/leadTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { LocationForm } from "./forms/LocationForm";
import { VehicleForm } from "./forms/VehicleForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { ReferralForm } from "./forms/ReferralForm";
import { useLeadsStable as useLeads } from "@/hooks/useLeadsStable";
import { Lead } from "@/types/leadTypes";
import { useSandboxAwareSupabase } from "@/hooks/useSandboxAwareSupabase";
import { SandboxDataWarning } from "@/components/sandbox/SandboxDataWarning";

interface EnhancedLeadFormProps {
  editingLead?: Lead | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  // Información personal
  nombre: string;
  email: string;
  telefono: string;
  edad: string;
  nivel_escolaridad: string;
  
  // Ubicación
  direccion: string;
  estado_id: string;
  ciudad_id: string;
  zona_trabajo_id: string;
  
  // Vehículo
  vehiculo_propio: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  año_vehiculo: string;
  
  // Experiencia
  experiencia_custodia: string;
  años_experiencia: string;
  empresas_anteriores: string;
  licencia_conducir: string;
  tipo_licencia: string;
  antecedentes_penales: string;
  institucion_publica: string;
  baja_institucion: string;
  referencias: string;
  mensaje: string;
  
  // Referidos
  custodio_referente_id: string;
  custodio_referente_nombre: string;
  
  // Estado del lead
  estado_lead: string;
  notas: string;
}

interface ValidationResult {
  isValid: boolean;
  isDuplicate: boolean;
  message: string;
  duplicateInfo?: {
    nombre: string;
    email: string;
    telefono: string;
    fecha_creacion: string;
    estado: string;
  };
}

export const EnhancedLeadForm = ({ editingLead, onSuccess, onCancel }: EnhancedLeadFormProps) => {
  const { createLead, updateLead } = useLeads();
  const sbx = useSandboxAwareSupabase(); // Hook seguro para Sandbox
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    // Información personal
    nombre: "",
    email: "",
    telefono: "",
    edad: "",
    nivel_escolaridad: "",
    
    // Ubicación
    direccion: "",
    estado_id: "",
    ciudad_id: "",
    zona_trabajo_id: "",
    
    // Vehículo
    vehiculo_propio: "",
    marca_vehiculo: "",
    modelo_vehiculo: "",
    año_vehiculo: "",
    
    // Experiencia
    experiencia_custodia: "",
    años_experiencia: "",
    empresas_anteriores: "",
    licencia_conducir: "",
    tipo_licencia: "",
    antecedentes_penales: "",
    institucion_publica: "",
    baja_institucion: "",
    referencias: "",
    mensaje: "",
    
    // Referidos
    custodio_referente_id: "",
    custodio_referente_nombre: "",
    
    // Estado del lead
    estado_lead: "nuevo",
    notas: "",
  });

  useEffect(() => {
    if (editingLead) {
      setFormData({
        // Información personal
        nombre: editingLead.nombre || "",
        email: editingLead.email || "",
        telefono: editingLead.telefono || "",
        edad: "",
        nivel_escolaridad: "",
        
        // Ubicación
        direccion: "",
        estado_id: "",
        ciudad_id: "",
        zona_trabajo_id: "",
        
        // Vehículo
        vehiculo_propio: "",
        marca_vehiculo: "",
        modelo_vehiculo: "",
        año_vehiculo: "",
        
        // Experiencia
        experiencia_custodia: "",
        años_experiencia: "",
        empresas_anteriores: "",
        licencia_conducir: "",
        tipo_licencia: "",
        antecedentes_penales: "",
        institucion_publica: "",
        baja_institucion: "",
        referencias: "",
        mensaje: editingLead.mensaje || "",
        
        // Referidos
        custodio_referente_id: "",
        custodio_referente_nombre: "",
        
        // Estado del lead
        estado_lead: editingLead.estado || "nuevo",
        notas: editingLead.notas || "",
      });
    }
  }, [editingLead]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar validación cuando se cambian datos críticos
    if (['nombre', 'email', 'telefono'].includes(field)) {
      setValidationResult(null);
    }
  };

  const handleReferralChange = (referralData: { custodio_referente_id: string; custodio_referente_nombre: string } | null) => {
    if (referralData) {
      setFormData(prev => ({
        ...prev,
        custodio_referente_id: referralData.custodio_referente_id,
        custodio_referente_nombre: referralData.custodio_referente_nombre
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        custodio_referente_id: "",
        custodio_referente_nombre: ""
      }));
    }
  };

  const validateAgainstHistory = async () => {
    if (!formData.nombre || !formData.email || !formData.telefono) {
      return;
    }

    setIsValidating(true);
    
    try {
      // Buscar duplicados por email o teléfono
      const { data: duplicates, error } = await supabase
        .from('leads')
        .select('nombre, email, telefono, fecha_creacion, estado')
        .or(`email.eq.${formData.email},telefono.eq.${formData.telefono}`)
        .neq('id', editingLead?.id || 'none');

      if (error) {
        console.error('Error validating against history:', error);
        setValidationResult({
          isValid: false,
          isDuplicate: false,
          message: "Error al validar contra el histórico"
        });
        return;
      }

      if (duplicates && duplicates.length > 0) {
        const duplicate = duplicates[0];
        setValidationResult({
          isValid: false,
          isDuplicate: true,
          message: "Este candidato ya existe en el sistema",
          duplicateInfo: {
            nombre: duplicate.nombre,
            email: duplicate.email,
            telefono: duplicate.telefono,
            fecha_creacion: duplicate.fecha_creacion,
            estado: duplicate.estado
          }
        });
      } else {
        setValidationResult({
          isValid: true,
          isDuplicate: false,
          message: "Candidato validado correctamente"
        });
      }
    } catch (error) {
      console.error('Error during validation:', error);
      setValidationResult({
        isValid: false,
        isDuplicate: false,
        message: "Error al validar candidato"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    // Validar contra histórico si no es edición
    if (!editingLead) {
      await validateAgainstHistory();
      
      if (validationResult && !validationResult.isValid) {
        toast({
          title: "Error de validación",
          description: validationResult.message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const leadData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        estado: formData.estado_lead as LeadEstado,
        mensaje: formData.mensaje,
        notas: formData.notas,
        empresa: "",
        fuente: "form_robusto",
        last_interview_data: {
          edad: formData.edad,
          nivel_escolaridad: formData.nivel_escolaridad,
          ubicacion: {
            estado_id: formData.estado_id,
            ciudad_id: formData.ciudad_id,
            direccion: formData.direccion,
            zona_trabajo_id: formData.zona_trabajo_id
          },
          vehiculo: {
            propio: formData.vehiculo_propio,
            marca: formData.marca_vehiculo,
            modelo: formData.modelo_vehiculo,
            año: formData.año_vehiculo
          },
          experiencia: {
            custodia: formData.experiencia_custodia,
            años: formData.años_experiencia,
            empresas_anteriores: formData.empresas_anteriores,
            licencia: formData.licencia_conducir,
            tipo_licencia: formData.tipo_licencia,
            antecedentes: formData.antecedentes_penales,
            institucion_publica: formData.institucion_publica,
            baja_institucion: formData.baja_institucion,
            referencias: formData.referencias
          },
          referido: {
            custodio_id: formData.custodio_referente_id || null,
            custodio_nombre: formData.custodio_referente_nombre || null
          },
          form_type: 'form_robusto',
          fecha_llenado: new Date().toISOString()
        }
      };

      if (editingLead) {
        await updateLead.mutateAsync({
          leadId: editingLead.id,
          updates: leadData
        });
      } else {
        await createLead.mutateAsync(leadData);
      }

      toast({
        title: "Éxito",
        description: `Candidato ${editingLead ? 'actualizado' : 'creado'} correctamente`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving lead:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Error desconocido al guardar el candidato";
      
      toast({
        title: "Error",
        description: `Error al guardar el candidato: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Advertencia de Sandbox */}
      <SandboxDataWarning entityType="lead" action={editingLead ? "update" : "create"} />
      
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalInfoForm formData={formData} onInputChange={handleInputChange} />
        </CardContent>
      </Card>

      {/* Validación contra histórico */}
      {(formData.nombre && formData.email && formData.telefono) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validación de Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={validateAgainstHistory}
              disabled={isValidating}
              className="mb-4"
            >
              {isValidating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar contra histórico
                </>
              )}
            </Button>

            {validationResult && (
              <Alert className={validationResult.isValid ? "border-green-500" : "border-red-500"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationResult.message}
                  {validationResult.duplicateInfo && (
                    <div className="mt-2 p-2 bg-red-50 rounded-md">
                      <p className="text-sm font-medium">Candidato existente:</p>
                      <p className="text-sm">Nombre: {validationResult.duplicateInfo.nombre}</p>
                      <p className="text-sm">Email: {validationResult.duplicateInfo.email}</p>
                      <p className="text-sm">Teléfono: {validationResult.duplicateInfo.telefono}</p>
                      <p className="text-sm">Estado: {validationResult.duplicateInfo.estado}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationForm formData={formData} onInputChange={handleInputChange} />
        </CardContent>
      </Card>

      {/* Vehículo */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm formData={formData} onInputChange={handleInputChange} />
        </CardContent>
      </Card>

      {/* Experiencia */}
      <Card>
        <CardHeader>
          <CardTitle>Experiencia y Documentación</CardTitle>
        </CardHeader>
        <CardContent>
          <ExperienceForm formData={formData} onInputChange={handleInputChange} />
        </CardContent>
      </Card>

      {/* Referidos */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralForm onReferralChange={handleReferralChange} />
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || createLead.isPending || updateLead.isPending || (validationResult && !validationResult.isValid)}
        >
          {loading ? 'Guardando...' : editingLead ? 'Actualizar' : 'Crear'} Candidato
        </Button>
      </div>
    </form>
  );
};