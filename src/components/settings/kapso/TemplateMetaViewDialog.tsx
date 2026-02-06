import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy,
  Check,
  Download,
  Globe,
  FileText,
  Type,
  Hash,
  MessageSquare,
  MousePointer,
  Info
} from 'lucide-react';
import { 
  WhatsAppTemplateRecord, 
  TEMPLATE_CONFIGS, 
  TEMPLATE_VARIABLES,
  TEMPLATE_CONTENT,
  DetectaTemplateName 
} from '@/types/kapso';
import { cn } from '@/lib/utils';
import { exportSingleTemplateJSON, downloadSingleTemplateJSON } from '@/utils/exportWhatsAppTemplates';

interface TemplateMetaViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WhatsAppTemplateRecord | null;
}

// Example values for variables
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

// Button definitions for templates
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

export const TemplateMetaViewDialog = ({ open, onOpenChange, template }: TemplateMetaViewDialogProps) => {
  const [copied, setCopied] = useState(false);

  if (!template) return null;

  const templateName = template.name as DetectaTemplateName;
  const config = TEMPLATE_CONFIGS[templateName];
  const variables = TEMPLATE_VARIABLES[templateName] || [];
  const content = TEMPLATE_CONTENT[templateName] || template.content;
  const buttons = TEMPLATE_BUTTONS[templateName] || [];

  // Get example values for this template's variables
  const exampleValues = variables.map((v, i) => ({
    position: i + 1,
    name: v,
    example: EXAMPLE_VALUES[v] || `[${v}]`
  }));

  // Replace {{n}} with example values for preview
  const getPreviewContent = () => {
    let previewText = content;
    exampleValues.forEach((v) => {
      previewText = previewText.replace(`{{${v.position}}}`, v.example);
    });
    return previewText;
  };

  const handleCopyJSON = async () => {
    const json = exportSingleTemplateJSON(templateName);
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadSingleTemplateJSON(templateName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-mono">{template.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {config?.category || template.meta_category}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            Spanish (MEX) - es_MX
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="space-y-6 pr-4">
            {/* Template Name Section - Like Meta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Nombre e idioma de la plantilla</Label>
                <Badge variant="secondary" className="text-xs">
                  {template.name.length}/512
                </Badge>
              </div>
              <Input 
                value={template.name} 
                readOnly 
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Asigna un nombre a la plantilla. El nombre debe coincidir exactamente al registrarlo en Meta.
              </p>
            </div>

            <Separator />

            {/* Content Section - Like Meta */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Contenido</Label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Agrega un encabezado, cuerpo y pie de página a tu plantilla. La API de la nube, alojada por Meta, 
                revisará el contenido y las variables de la plantilla para garantizar la seguridad e integridad de nuestros servicios.
              </p>

              {/* Variable Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Tipo de variable</Label>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-muted">
                    <Hash className="h-3 w-3 mr-1" />
                    Número
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({variables.length} variables)
                  </span>
                </div>
              </div>

              {/* Body - Main Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Cuerpo</Label>
                  <span className="text-xs text-muted-foreground">
                    {content.length}/1024
                  </span>
                </div>
                <Textarea 
                  value={content}
                  readOnly
                  className="min-h-[150px] font-mono text-sm bg-muted resize-none"
                />
              </div>

              {/* Variables Reference Table */}
              {exampleValues.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Type className="h-3 w-3" />
                    Variables y ejemplos
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Placeholder</th>
                          <th className="px-3 py-2 text-left font-medium">Variable</th>
                          <th className="px-3 py-2 text-left font-medium">Ejemplo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {exampleValues.map((v) => (
                          <tr key={v.position}>
                            <td className="px-3 py-2 font-mono text-primary">
                              {`{{${v.position}}}`}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {v.name}
                            </td>
                            <td className="px-3 py-2">
                              {v.example}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons Section */}
            {buttons.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Botones</Label>
                    <Badge variant="secondary" className="text-xs">
                      {buttons.length} botones
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Crea botones para que los clientes puedan responder tu mensaje o realizar una acción.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buttons.map((btn, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="px-3 py-1.5 text-sm bg-primary/5"
                      >
                        {btn}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Preview Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Vista previa del mensaje</Label>
              <div className="bg-[#e5ddd5] dark:bg-muted/50 rounded-lg p-4">
                <div className="bg-white dark:bg-background rounded-lg p-3 max-w-[280px] shadow-sm">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {getPreviewContent()}
                  </pre>
                  {buttons.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {buttons.map((btn, i) => (
                        <div 
                          key={i}
                          className="text-center text-sm text-primary py-1"
                        >
                          {btn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* JSON for API */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">JSON para Meta API</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyJSON}
                  className="gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar JSON
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs font-mono text-muted-foreground">
                  {exportSingleTemplateJSON(templateName)}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar JSON
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
