
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
    marca?: string;
    modelo?: string;
    año?: string;
    placas?: string;
    color?: string;
    tipo?: string;
    seguro_vigente?: string;
  };
  seguridad_armada?: {
    licencia_armas?: string;
    experiencia_militar?: string;
    años_experiencia_armada?: string;
  };
  custodio_abordo?: {
    especialidad?: string;
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
  
  // Campos básicos del lead que siempre se requieren
  if (!lead.lead_nombre?.trim()) {
    missingFields.push("Nombre completo");
  }
  
  if (!lead.lead_email?.trim()) {
    missingFields.push("Email");
  }
  
  if (!lead.lead_telefono?.trim()) {
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
  if (!notesData.datos_personales?.edad?.trim()) {
    missingFields.push("Edad");
  }
  
  if (!notesData.datos_personales?.direccion?.trim()) {
    missingFields.push("Dirección");
  }
  
  if (!notesData.datos_personales?.estado_id?.trim()) {
    missingFields.push("Estado");
  }
  
  if (!notesData.datos_personales?.ciudad_id?.trim()) {
    missingFields.push("Ciudad");
  }
  
  if (!notesData.datos_personales?.zona_trabajo_id?.trim()) {
    missingFields.push("Zona de trabajo");
  }

  // Validar tipo de custodio
  if (!notesData.tipo_custodio?.trim()) {
    missingFields.push("Tipo de custodio");
  }

  // Validaciones específicas según el tipo de custodio
  const tipoCustodio = notesData.tipo_custodio;
  const requiereVehiculo = tipoCustodio === 'custodio_vehiculo' || tipoCustodio === 'armado_vehiculo';
  const esArmado = tipoCustodio === 'armado' || tipoCustodio === 'armado_vehiculo';
  const esAbordo = tipoCustodio === 'abordo';

  // Validar datos del vehículo si es requerido
  if (requiereVehiculo) {
    if (!notesData.vehiculo?.marca?.trim()) {
      missingFields.push("Marca del vehículo");
    }
    if (!notesData.vehiculo?.modelo?.trim()) {
      missingFields.push("Modelo del vehículo");
    }
    if (!notesData.vehiculo?.año?.trim()) {
      missingFields.push("Año del vehículo");
    }
    if (!notesData.vehiculo?.placas?.trim()) {
      missingFields.push("Placas del vehículo");
    }
    if (!notesData.vehiculo?.seguro_vigente?.trim()) {
      missingFields.push("Seguro vigente");
    }
  }

  // Validar datos de seguridad armada si es requerido
  if (esArmado) {
    if (!notesData.seguridad_armada?.licencia_armas?.trim()) {
      missingFields.push("Licencia de armas");
    }
  }

  // Validar especialidad para custodios abordo
  if (esAbordo) {
    if (!notesData.custodio_abordo?.especialidad?.trim()) {
      missingFields.push("Especialidad abordo");
    }
  }

  // Validar experiencia general
  if (!notesData.experiencia?.experiencia_custodia?.trim()) {
    missingFields.push("Experiencia en custodia");
  }
  
  if (!notesData.experiencia?.años_experiencia?.trim()) {
    missingFields.push("Años de experiencia");
  }
  
  if (!notesData.experiencia?.licencia_conducir?.trim()) {
    missingFields.push("Licencia de conducir");
  }
  
  if (!notesData.experiencia?.antecedentes_penales?.trim()) {
    missingFields.push("Antecedentes penales");
  }

  // Validar disponibilidad
  if (!notesData.disponibilidad?.horario?.trim()) {
    missingFields.push("Disponibilidad de horario");
  }
  
  if (!notesData.disponibilidad?.dias?.trim()) {
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
