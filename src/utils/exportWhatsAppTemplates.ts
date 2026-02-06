/**
 * Utilidades para exportar templates de WhatsApp para Meta Business Suite
 * Genera JSON, CSV y Markdown
 */

import { 
  TEMPLATE_CONFIGS, 
  TEMPLATE_CONTENT, 
  TEMPLATE_VARIABLES,
  TEMPLATE_CATEGORIES,
  DetectaTemplateName,
  TemplateCategoryKey
} from '@/types/kapso';

// ==================== EXAMPLE VALUES ====================

const EXAMPLE_VALUES: Record<string, string> = {
  custodio_nombre: 'Juan Pérez',
  nombre: 'María García',
  fecha: '15 de febrero 2026',
  hora: '09:00',
  cliente: 'Grupo Carso',
  origen: 'CDMX Centro',
  destino: 'Santa Fe',
  servicio_id: 'SRV-2026-001234',
  folio: 'SRV-2026-001234',
  motivo: 'Solicitud del cliente',
  ubicacion: 'Av. Reforma 222, CDMX',
  puntos: '150',
  hora_cita: '10:30',
  distancia_metros: '500',
  item_critico: 'Llantas en mal estado',
  ticket_number: 'TKT-2026-5678',
  categoria: 'Soporte Técnico',
  tiempo_respuesta: '2 horas',
  agente: 'Carlos López',
  departamento: 'Operaciones',
  estado: 'En progreso',
  mensaje: 'Estamos trabajando en tu solicitud',
  solucion: 'Se reinició el dispositivo GPS',
  link: 'https://app.detecta.mx/onboarding/abc123',
  documentos_lista: '• INE vigente\n• Comprobante de domicilio\n• Licencia de conducir',
  portal_link: 'https://portal.detecta.mx',
  dias_restantes: '7',
  tipo_documento: 'Licencia de conducir',
  fecha_vencimiento: '28 de febrero 2026',
  link_android: 'https://play.google.com/detecta',
  link_ios: 'https://apps.apple.com/detecta',
  horas_validez: '48',
  horas_restantes: '24',
  curso_nombre: 'Protocolos de Seguridad 2026',
  duracion: '2 horas',
  fecha_limite: '28 de febrero 2026',
  dias_plazo: '5',
  progreso_pct: '65',
  modulo_nombre: 'Seguridad en Traslados',
  tiempo_minutos: '30',
  intentos: '2',
  codigo_certificado: 'CERT-2026-ABC123',
  link_descarga: 'https://detecta.mx/cert/ABC123',
  zonas_demanda: 'CDMX, Guadalajara, Monterrey',
  modalidad: 'Virtual (Google Meet)',
  entrevistador: 'Ana Martínez',
  instrucciones: 'Te enviaremos el link de la videollamada 15 minutos antes.',
  rol: 'Custodio de Seguridad'
};

// ==================== BUTTON DEFINITIONS ====================

const TEMPLATE_BUTTONS: Record<string, string[]> = {
  servicio_asignado: ['✅ Confirmar', '❌ No disponible'],
  servicio_reasignado: ['✅ Aceptar', '❌ Reportar problema'],
  recordatorio_servicio_60min: ['🚗 Voy en camino', '⚠️ Tengo un retraso'],
  recordatorio_servicio_30min: ['✅ En camino', '📞 Necesito ayuda'],
  alerta_checklist_pendiente: ['✅ Ya lo completé', '❓ Necesito ayuda'],
  alerta_gps_fuera_rango: ['✅ Problema resuelto', '📞 Llamar a monitoreo'],
  alerta_gps_sin_datos: ['✅ GPS activado', '📞 Contactar soporte'],
  alerta_item_critico: ['✅ Problema resuelto', '📞 Contactar supervisor'],
  ticket_resuelto: ['✅ Sí, resuelto', '❌ No resuelto', '🔄 Reabrir'],
  ticket_encuesta_csat: ['⭐ Excelente', '😐 Regular', '😞 Malo'],
  onboarding_documentos_pendientes: ['📤 Subir documentos', '❓ Necesito ayuda'],
  onboarding_documento_vencido: ['📤 Actualizar documento', '❓ Tengo dudas'],
  siercp_invitacion: ['📝 Iniciar evaluación', '❓ Tengo preguntas'],
  siercp_recordatorio: ['📝 Completar ahora'],
  lms_curso_asignado: ['📚 Ir al curso', '⏰ Recordar después'],
  lms_curso_recordatorio: ['📚 Continuar curso'],
  lms_quiz_disponible: ['📝 Iniciar quiz'],
  lead_bienvenida: ['✅ Completar registro', 'ℹ️ Más información'],
  lead_seguimiento: ['✅ Continuar proceso', '💬 Hablar con reclutador'],
  lead_armados_campana: ['✅ Me interesa', 'ℹ️ Más información'],
  supply_entrevista_programada: ['✅ Confirmo asistencia', '🔄 Necesito reagendar'],
  supply_documentacion_solicitada: ['📤 Subir documentos', '❓ Tengo dudas'],
  supply_aprobacion_final: ['🚀 Iniciar onboarding']
};

// ==================== HELPER FUNCTIONS ====================

const getExampleValues = (variables: string[]): string[] => {
  return variables.map(v => EXAMPLE_VALUES[v] || `[${v}]`);
};

const getCategoryForTemplate = (templateName: string): TemplateCategoryKey => {
  for (const [key, category] of Object.entries(TEMPLATE_CATEGORIES)) {
    if ((category.templates as readonly string[]).includes(templateName)) {
      return key as TemplateCategoryKey;
    }
  }
  return 'servicios';
};

// ==================== JSON EXPORT ====================

interface ExportedTemplate {
  name: string;
  category: string;
  language: string;
  internal_category: string;
  components: {
    body: {
      text: string;
      example: string[];
    };
    buttons?: Array<{ type: string; text: string }>;
  };
  variables: Record<string, string>;
  variable_count: number;
  has_buttons: boolean;
}

export const exportToJSON = (): string => {
  const templates: ExportedTemplate[] = Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => {
    const templateName = key as DetectaTemplateName;
    const variables = TEMPLATE_VARIABLES[templateName] || [];
    const buttons = TEMPLATE_BUTTONS[templateName] || [];
    const internalCategory = getCategoryForTemplate(templateName);

    return {
      name: config.name,
      category: config.category,
      language: 'es',
      internal_category: internalCategory,
      components: {
        body: {
          text: TEMPLATE_CONTENT[templateName],
          example: getExampleValues(variables)
        },
        ...(config.hasButtons && buttons.length > 0 && {
          buttons: buttons.map(text => ({ type: 'QUICK_REPLY', text }))
        })
      },
      variables: variables.reduce((acc, v, i) => {
        acc[String(i + 1)] = v;
        return acc;
      }, {} as Record<string, string>),
      variable_count: config.variableCount,
      has_buttons: config.hasButtons
    };
  });

  const exportData = {
    exportDate: new Date().toISOString(),
    totalTemplates: templates.length,
    metaInfo: {
      language: 'es_MX',
      businessId: '[TU_BUSINESS_ID]',
      note: 'Reemplaza {{n}} con los valores de ejemplo al crear en Meta Business Suite'
    },
    categorySummary: Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => ({
      key,
      label: cat.label,
      count: cat.count
    })),
    templates
  };

  return JSON.stringify(exportData, null, 2);
};

// ==================== CSV EXPORT ====================

const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const exportToCSV = (): string => {
  const headers = [
    'nombre',
    'categoria_meta',
    'categoria_interna',
    'num_variables',
    'variables',
    'texto',
    'tiene_botones',
    'boton_1',
    'boton_2',
    'boton_3',
    'valores_ejemplo'
  ];

  const rows = Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => {
    const templateName = key as DetectaTemplateName;
    const variables = TEMPLATE_VARIABLES[templateName] || [];
    const buttons = TEMPLATE_BUTTONS[templateName] || [];
    const content = TEMPLATE_CONTENT[templateName];
    const internalCategory = getCategoryForTemplate(templateName);
    const exampleValues = getExampleValues(variables);

    return [
      escapeCSV(config.name),
      escapeCSV(config.category),
      escapeCSV(TEMPLATE_CATEGORIES[internalCategory].label),
      String(config.variableCount),
      escapeCSV(variables.join(', ')),
      escapeCSV(content.replace(/\n/g, '\\n')),
      config.hasButtons ? 'Sí' : 'No',
      escapeCSV(buttons[0] || ''),
      escapeCSV(buttons[1] || ''),
      escapeCSV(buttons[2] || ''),
      escapeCSV(exampleValues.join(', '))
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// ==================== MARKDOWN EXPORT ====================

export const exportToMarkdown = (): string => {
  const sections: string[] = [];

  // Header
  sections.push(`# Templates de WhatsApp - Detecta

Exportado: ${new Date().toLocaleString('es-MX')}

Total: **34 templates**

---

## Índice

`);

  // Table of contents
  Object.entries(TEMPLATE_CATEGORIES).forEach(([key, category], index) => {
    sections.push(`${index + 1}. [${category.label}](#${key}) (${category.count} templates)`);
  });

  sections.push('\n---\n');

  // Templates by category
  Object.entries(TEMPLATE_CATEGORIES).forEach(([key, category]) => {
    sections.push(`## ${category.label} {#${key}}\n`);

    const categoryTemplates = category.templates as readonly string[];
    
    categoryTemplates.forEach(templateName => {
      const config = TEMPLATE_CONFIGS[templateName as DetectaTemplateName];
      const content = TEMPLATE_CONTENT[templateName as DetectaTemplateName];
      const variables = TEMPLATE_VARIABLES[templateName as DetectaTemplateName] || [];
      const buttons = TEMPLATE_BUTTONS[templateName] || [];
      const exampleValues = getExampleValues(variables);

      sections.push(`### \`${templateName}\`\n`);
      sections.push(`| Propiedad | Valor |`);
      sections.push(`|-----------|-------|`);
      sections.push(`| **Categoría Meta** | ${config.category} |`);
      sections.push(`| **Variables** | ${config.variableCount} |`);
      sections.push(`| **Botones** | ${config.hasButtons ? `Sí (${config.buttonCount || buttons.length})` : 'No'} |`);
      sections.push(`| **Idioma** | es_MX |\n`);

      sections.push(`#### Texto del mensaje\n`);
      sections.push('```');
      sections.push(content);
      sections.push('```\n');

      if (variables.length > 0) {
        sections.push(`#### Variables\n`);
        sections.push(`| Placeholder | Nombre | Ejemplo |`);
        sections.push(`|-------------|--------|---------|`);
        variables.forEach((v, i) => {
          sections.push(`| {{${i + 1}}} | ${v} | ${exampleValues[i]} |`);
        });
        sections.push('');
      }

      if (buttons.length > 0) {
        sections.push(`#### Botones\n`);
        buttons.forEach((btn, i) => {
          sections.push(`${i + 1}. \`${btn}\``);
        });
        sections.push('');
      }

      sections.push('---\n');
    });
  });

  // Footer with instructions
  sections.push(`## Instrucciones para Meta Business Suite

### Crear un template

1. Ve a **Meta Business Suite** → **WhatsApp Manager** → **Templates**
2. Click en **Create Template**
3. Selecciona la categoría (**UTILITY** o **MARKETING**)
4. Ingresa el nombre exacto del template (snake_case)
5. Selecciona idioma **Español (México)** - es_MX
6. Copia el texto del mensaje y reemplaza los valores de ejemplo
7. Agrega los botones si aplica (Quick Reply)
8. Envía para aprobación

### Notas importantes

- Los nombres deben coincidir exactamente con los documentados aquí
- Los placeholders {{n}} deben ser reemplazados con ejemplos reales
- Meta requiere que los ejemplos sean realistas pero no datos reales de usuarios
- La aprobación puede tomar de 24 a 72 horas
`);

  return sections.join('\n');
};

// ==================== DOWNLOAD HELPER ====================

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadJSON = (): void => {
  downloadFile(exportToJSON(), 'detecta-whatsapp-templates.json', 'application/json');
};

export const downloadCSV = (): void => {
  downloadFile(exportToCSV(), 'detecta-whatsapp-templates.csv', 'text/csv;charset=utf-8');
};

export const downloadMarkdown = (): void => {
  downloadFile(exportToMarkdown(), 'detecta-whatsapp-templates.md', 'text/markdown');
};
