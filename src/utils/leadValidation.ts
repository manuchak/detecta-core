
import { AssignedLead } from "@/types/leadTypes";

interface LeadNotesData {
  datos_personales?: {
    edad?: string;
    direccion?: string;
    estado_id?: string;
    ciudad_id?: string;
    zona_trabajo_id?: string;
  };
  tipo_custodio?: string;
  vehiculo?: {
    marca_vehiculo?: string;
    modelo_vehiculo?: string;
    año_vehiculo?: string;
    placas?: string;
    color_vehiculo?: string;
    tipo_vehiculo?: string;
    seguro_vigente?: string;
  };
  seguridad_armada?: {
    licencia_armas?: string;
    experiencia_militar?: string;
    años_experiencia_armada?: string;
  };
  custodio_abordo?: {
    especialidad_abordo?: string;
  };
  experiencia?: {
    experiencia_custodia?: string;
    años_experiencia?: string;
    licencia_conducir?: string;
    tipo_licencia?: string;
    antecedentes_penales?: string;
  };
  disponibilidad?: {
    horario?: string;
    dias?: string;
  };
}

export const validateLeadForApproval = (lead: AssignedLead): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  // Helper function to safely check if a value is empty
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return false; // Numbers are not empty
    if (typeof value === 'boolean') return false; // Booleans are not empty
    return true; // Other types are considered empty
  };
  
  // Campos básicos del lead que siempre se requieren
  if (isEmpty(lead.lead_nombre)) {
    missingFields.push("Nombre completo");
  }
  
  if (isEmpty(lead.lead_email)) {
    missingFields.push("Email");
  }
  
  if (isEmpty(lead.lead_telefono)) {
    missingFields.push("Teléfono");
  }

  // Intentar parsear las notas para obtener información adicional
  let notesData: LeadNotesData = {};
  try {
    if (lead.notas) {
      notesData = JSON.parse(lead.notas);
    }
  } catch (error) {
    console.warn("Error parsing lead notes:", error);
  }

  // Validar datos personales adicionales
  if (isEmpty(notesData.datos_personales?.edad)) {
    missingFields.push("Edad");
  }
  
  if (isEmpty(notesData.datos_personales?.direccion)) {
    missingFields.push("Dirección");
  }
  
  if (isEmpty(notesData.datos_personales?.estado_id)) {
    missingFields.push("Estado");
  }
  
  if (isEmpty(notesData.datos_personales?.ciudad_id)) {
    missingFields.push("Ciudad");
  }
  
  if (isEmpty(notesData.datos_personales?.zona_trabajo_id)) {
    missingFields.push("Zona de trabajo");
  }

  // Validar tipo de custodio
  if (isEmpty(notesData.tipo_custodio)) {
    missingFields.push("Tipo de custodio");
  }

  // Validaciones específicas según el tipo de custodio
  const tipoCustodio = notesData.tipo_custodio;
  const requiereVehiculo = tipoCustodio === 'custodio_vehiculo' || tipoCustodio === 'armado_vehiculo';
  const esArmado = tipoCustodio === 'armado' || tipoCustodio === 'armado_vehiculo';
  const esAbordo = tipoCustodio === 'abordo';

  // Validar datos del vehículo si es requerido
  if (requiereVehiculo) {
    if (isEmpty(notesData.vehiculo?.marca_vehiculo)) {
      missingFields.push("Marca del vehículo");
    }
    if (isEmpty(notesData.vehiculo?.modelo_vehiculo)) {
      missingFields.push("Modelo del vehículo");
    }
    if (isEmpty(notesData.vehiculo?.año_vehiculo)) {
      missingFields.push("Año del vehículo");
    }
    if (isEmpty(notesData.vehiculo?.placas)) {
      missingFields.push("Placas del vehículo");
    }
    if (isEmpty(notesData.vehiculo?.seguro_vigente)) {
      missingFields.push("Seguro vigente");
    }
  }

  // Validar datos de seguridad armada si es requerido
  if (esArmado) {
    if (isEmpty(notesData.seguridad_armada?.licencia_armas)) {
      missingFields.push("Licencia de armas");
    }
  }

  // Validar especialidad para custodios abordo
  if (esAbordo) {
    if (isEmpty(notesData.custodio_abordo?.especialidad_abordo)) {
      missingFields.push("Especialidad abordo");
    }
  }

  // Validar experiencia general
  if (isEmpty(notesData.experiencia?.experiencia_custodia)) {
    missingFields.push("Experiencia en custodia");
  }
  
  if (isEmpty(notesData.experiencia?.años_experiencia)) {
    missingFields.push("Años de experiencia");
  }
  
  if (isEmpty(notesData.experiencia?.licencia_conducir)) {
    missingFields.push("Licencia de conducir");
  }
  
  if (isEmpty(notesData.experiencia?.antecedentes_penales)) {
    missingFields.push("Antecedentes penales");
  }

  // Validar disponibilidad
  if (isEmpty(notesData.disponibilidad?.horario)) {
    missingFields.push("Disponibilidad de horario");
  }
  
  if (isEmpty(notesData.disponibilidad?.dias)) {
    missingFields.push("Disponibilidad de días");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

export const getValidationMessage = (missingFields: string[]): string => {
  if (missingFields.length === 0) return "";
  
  if (missingFields.length === 1) {
    return `Falta completar el campo: ${missingFields[0]}`;
  }
  
  if (missingFields.length <= 3) {
    return `Faltan completar los campos: ${missingFields.join(", ")}`;
  }
  
  return `Faltan completar ${missingFields.length} campos: ${missingFields.slice(0, 3).join(", ")} y ${missingFields.length - 3} más`;
};
