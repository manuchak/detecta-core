import { AssignedLead } from "@/types/leadTypes";
import { format } from "date-fns";

export const exportLeadsToCSV = (leads: AssignedLead[], filterName: string = "todos") => {
  // Definir las columnas del CSV
  const headers = [
    "ID Lead",
    "Nombre",
    "Email",
    "Teléfono",
    "Estado",
    "Fecha Creación",
    "Días desde Creación",
    "Decisión Final",
    "Etapa de Aprobación",
    "Entrevista Telefónica Completada",
    "Segunda Entrevista Requerida",
    "Analista Asignado",
    "Email Analista",
    "Intentos de Contacto",
    "Último Intento de Contacto",
    "Resultado Último Contacto",
    "Tiene Llamada Exitosa",
    "Tiene Llamada Programada",
    "Fecha/Hora Llamada Programada",
    "Entrevista Interrumpida",
    "Entrevista en Progreso",
    "Fecha Inicio Entrevista",
    "Motivo Interrupción",
    "Session ID",
    "Último Auto-guardado",
    "Zona Preferida ID",
    "Zona Nombre",
    "Fecha Entrada Pool",
    "Motivo Pool",
    "Notas"
  ];

  // Función helper para escapar valores CSV
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    
    const stringValue = String(value);
    // Si contiene comas, comillas o saltos de línea, envolver en comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Función helper para formatear fechas
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  // Función helper para calcular días desde creación
  const getDaysSinceCreation = (creationDate: string): string => {
    try {
      const now = new Date();
      const creation = new Date(creationDate);
      const days = Math.floor((now.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24));
      return String(days);
    } catch {
      return "N/A";
    }
  };

  // Convertir estado a texto legible
  const getEstadoLabel = (estado: string): string => {
    const estados: Record<string, string> = {
      'nuevo': 'Nuevo',
      'contactado': 'Contactado',
      'en_revision': 'En Revisión',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado',
      'aprobado_en_espera': 'Aprobado en Espera (Pool)'
    };
    return estados[estado] || estado;
  };

  // Convertir resultado de contacto a texto legible
  const getOutcomeLabel = (outcome: string | undefined): string => {
    if (!outcome) return "N/A";
    const outcomes: Record<string, string> = {
      'successful': 'Exitoso',
      'no_answer': 'No Contestó',
      'busy': 'Ocupado',
      'voicemail': 'Buzón',
      'wrong_number': 'Número Equivocado',
      'non_existent_number': 'Número No Existe',
      'call_failed': 'Llamada Fallida',
      'reschedule_requested': 'Reprogramación Solicitada',
      'numero_no_disponible': 'Número No Disponible'
    };
    return outcomes[outcome] || outcome;
  };

  // Mapear los datos de leads a filas CSV
  const rows = leads.map(lead => [
    escapeCsvValue(lead.lead_id),
    escapeCsvValue(lead.lead_nombre),
    escapeCsvValue(lead.lead_email),
    escapeCsvValue(lead.lead_telefono || "N/A"),
    escapeCsvValue(getEstadoLabel(lead.lead_estado)),
    escapeCsvValue(formatDate(lead.lead_fecha_creacion)),
    escapeCsvValue(getDaysSinceCreation(lead.lead_fecha_creacion)),
    escapeCsvValue(lead.final_decision === 'approved' ? 'Aprobado' : 
                   lead.final_decision === 'rejected' ? 'Rechazado' : 
                   'Pendiente'),
    escapeCsvValue(lead.current_stage || "N/A"),
    escapeCsvValue(lead.phone_interview_completed ? "Sí" : "No"),
    escapeCsvValue(lead.second_interview_required ? "Sí" : "No"),
    escapeCsvValue(lead.analista_nombre || "Sin Asignar"),
    escapeCsvValue(lead.analista_email || "N/A"),
    escapeCsvValue(lead.contact_attempts_count !== undefined ? String(lead.contact_attempts_count) : "0"),
    escapeCsvValue(formatDate(lead.last_contact_attempt_at)),
    escapeCsvValue(getOutcomeLabel(lead.last_contact_outcome)),
    escapeCsvValue(lead.has_successful_call ? "Sí" : "No"),
    escapeCsvValue(lead.has_scheduled_call ? "Sí" : "No"),
    escapeCsvValue(formatDate(lead.scheduled_call_datetime)),
    escapeCsvValue(lead.interview_interrupted ? "Sí" : "No"),
    escapeCsvValue(lead.interview_in_progress ? "Sí" : "No"),
    escapeCsvValue(formatDate(lead.interview_started_at)),
    escapeCsvValue(lead.interruption_reason || "N/A"),
    escapeCsvValue(lead.interview_session_id || "N/A"),
    escapeCsvValue(formatDate(lead.last_autosave_at)),
    escapeCsvValue(lead.zona_preferida_id || "N/A"),
    escapeCsvValue(lead.zona_nombre || "N/A"),
    escapeCsvValue(formatDate(lead.fecha_entrada_pool)),
    escapeCsvValue(lead.motivo_pool || "N/A"),
    escapeCsvValue(lead.notas || "N/A")
  ]);

  // Construir el contenido CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Agregar BOM para compatibilidad con Excel en español
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Crear blob y descargar
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generar nombre de archivo descriptivo
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
  const fileName = `leads_aprobacion_${filterName}_${timestamp}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return fileName;
};
