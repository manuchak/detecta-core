import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertTriangle } from 'lucide-react';
import { WhatsAppTemplateRecord, TEMPLATE_VARIABLES, DetectaTemplateName } from '@/types/kapso';

interface TemplateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WhatsAppTemplateRecord | null;
  onSend: (phone: string, variables: Record<string, string>) => Promise<void>;
  isSending?: boolean;
}

// Sample values for testing
const SAMPLE_VALUES: Record<string, string> = {
  custodio_nombre: 'Juan Pérez',
  nombre: 'María García',
  fecha: '15 de febrero 2025',
  hora: '09:00',
  hora_cita: '09:00',
  cliente: 'Grupo Carso',
  origen: 'CDMX Centro',
  destino: 'Santa Fe',
  ubicacion: 'Av. Reforma 123',
  servicio_id: 'SRV-2025-001',
  folio: 'SRV-2025-001',
  motivo: 'Solicitud del cliente',
  puntos: '50',
  distancia_metros: '850',
  item_critico: 'Estado de frenos - Deficiente',
  ticket_number: 'TKT-2025-001',
  categoria: 'Soporte Técnico',
  tiempo_respuesta: '24 horas',
  agente: 'Carlos Martínez',
  departamento: 'Operaciones',
  estado: 'En revisión',
  mensaje: 'Estamos trabajando en tu solicitud',
  solucion: 'Se realizó la actualización solicitada',
  link: 'https://detecta.app/activate/abc123',
  documentos_lista: '• INE vigente\n• Comprobante de domicilio\n• Licencia de conducir',
  portal_link: 'https://portal.detecta.app',
  dias_restantes: '7',
  tipo_documento: 'Licencia de conducir',
  fecha_vencimiento: '28 de febrero 2025',
  link_android: 'https://play.google.com/store/apps/detecta',
  link_ios: 'https://apps.apple.com/detecta',
  horas_validez: '48',
  horas_restantes: '12',
  curso_nombre: 'Protocolo de Seguridad Básica',
  duracion: '2 horas',
  fecha_limite: '20 de febrero 2025',
  dias_plazo: '5',
  progreso_pct: '45',
  modulo_nombre: 'Manejo Defensivo',
  tiempo_minutos: '30',
  intentos: '1',
  codigo_certificado: 'CERT-2025-001',
  link_descarga: 'https://lms.detecta.app/cert/abc123',
  zonas_demanda: 'CDMX, Monterrey, Guadalajara',
  modalidad: 'Videollamada',
  entrevistador: 'Ana López',
  instrucciones: 'Te enviaremos el link de Zoom 15 minutos antes.',
  rol: 'Custodio de Valores'
};

export const TemplateTestDialog = ({
  open,
  onOpenChange,
  template,
  onSend,
  isSending = false
}: TemplateTestDialogProps) => {
  const [phone, setPhone] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Initialize variables when template changes
  useEffect(() => {
    if (template) {
      const templateVars = TEMPLATE_VARIABLES[template.name as DetectaTemplateName] || [];
      const initialValues: Record<string, string> = {};
      templateVars.forEach(varName => {
        initialValues[varName] = SAMPLE_VALUES[varName] || '';
      });
      setVariables(initialValues);
    }
  }, [template]);

  const handleSend = async () => {
    if (!template || !phone) return;
    
    try {
      await onSend(phone, variables);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const templateVars = template 
    ? TEMPLATE_VARIABLES[template.name as DetectaTemplateName] || []
    : [];

  const isApproved = template?.meta_status === 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🧪 Probar Template
          </DialogTitle>
          <DialogDescription>
            {template?.name && (
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {template.name}
              </code>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning if not approved */}
          {!isApproved && (
            <Alert variant="destructive" className="bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este template no está aprobado en Meta. La prueba puede fallar.
              </AlertDescription>
            </Alert>
          )}

          {/* Phone input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número de prueba</Label>
            <Input
              id="phone"
              placeholder="+52 55 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Incluye código de país (ej: 5215512345678)
            </p>
          </div>

          {/* Variables */}
          {templateVars.length > 0 && (
            <div className="space-y-3">
              <Label>Variables del template</Label>
              <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                {templateVars.map((varName, index) => (
                  <div key={varName} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6 shrink-0">
                      {`{{${index + 1}}}`}
                    </span>
                    <Label htmlFor={varName} className="text-xs w-32 shrink-0 truncate">
                      {varName}:
                    </Label>
                    <Input
                      id={varName}
                      value={variables[varName] || ''}
                      onChange={(e) => setVariables(prev => ({
                        ...prev,
                        [varName]: e.target.value
                      }))}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {template?.content && (
            <div className="space-y-2">
              <Label>Vista previa</Label>
              <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                  {template.content}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!phone || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Prueba
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
