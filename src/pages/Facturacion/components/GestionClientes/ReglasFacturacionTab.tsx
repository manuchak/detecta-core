import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ReglasFormData {
  requiere_portal?: boolean;
  url_portal?: string;
  dia_entrega_factura?: string;
  descripcion_factura_formato?: string;
  requiere_prefactura?: boolean;
  requiere_tickets_estadia?: boolean;
  evidencia_requerida?: string[];
  observaciones_facturacion?: string;
  facturacion_intercompania?: boolean;
}

interface ReglasFacturacionTabProps {
  formData: ReglasFormData;
  onChange: (data: Partial<ReglasFormData>) => void;
}

const DIAS_ENTREGA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'cada_1', label: 'Cada día 1°' },
  { value: '1_y_16', label: 'Cada 1° y 16' },
  { value: 'inmediata', label: 'Inmediata' },
  { value: 'variable', label: 'Variable' },
];

const FORMATOS_DESCRIPCION = [
  { value: 'ruta_fecha', label: 'Ruta + Fecha' },
  { value: 'referencia', label: 'Referencia del cliente' },
  { value: 'oc', label: 'Orden de Compra' },
  { value: 'contenedor', label: 'Contenedor' },
  { value: 'desglose_detallado', label: 'Desglose detallado' },
  { value: 'personalizado', label: 'Personalizado' },
];

const EVIDENCIAS = [
  { value: 'bitacora', label: 'Bitácora' },
  { value: 'tickets_estadia', label: 'Tickets de estadía' },
  { value: 'drive', label: 'Drive compartido' },
  { value: 'opinion_cumplimiento', label: 'Opinión de cumplimiento' },
  { value: 'fotos', label: 'Fotos' },
  { value: 'xml_pdf', label: 'XML + PDF' },
];

export function ReglasFacturacionTab({ formData, onChange }: ReglasFacturacionTabProps) {
  const toggleEvidencia = (val: string) => {
    const current = formData.evidencia_requerida || [];
    const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
    onChange({ evidencia_requerida: next });
  };

  return (
    <div className="space-y-4">
      {/* Portal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="requiere_portal" checked={formData.requiere_portal ?? false}
              onChange={e => onChange({ requiere_portal: e.target.checked })}
              className="h-4 w-4 rounded border-border" />
            <Label htmlFor="requiere_portal">Requiere portal</Label>
          </div>
          {formData.requiere_portal && (
            <Input value={formData.url_portal || ''} onChange={e => onChange({ url_portal: e.target.value })}
              placeholder="https://portal.cliente.com" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="requiere_prefactura" checked={formData.requiere_prefactura ?? false}
              onChange={e => onChange({ requiere_prefactura: e.target.checked })}
              className="h-4 w-4 rounded border-border" />
            <Label htmlFor="requiere_prefactura">Requiere prefactura</Label>
          </div>
        </div>
      </div>

      {/* Dia entrega + formato */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Día de entrega de factura</Label>
          <Select value={formData.dia_entrega_factura || ''} onValueChange={v => onChange({ dia_entrega_factura: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {DIAS_ENTREGA.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Formato descripción factura</Label>
          <Select value={formData.descripcion_factura_formato || ''} onValueChange={v => onChange({ descripcion_factura_formato: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {FORMATOS_DESCRIPCION.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets + Intercompania */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="requiere_tickets" checked={formData.requiere_tickets_estadia ?? false}
            onChange={e => onChange({ requiere_tickets_estadia: e.target.checked })}
            className="h-4 w-4 rounded border-border" />
          <Label htmlFor="requiere_tickets">Requiere tickets de estadía</Label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="intercompania" checked={formData.facturacion_intercompania ?? false}
            onChange={e => onChange({ facturacion_intercompania: e.target.checked })}
            className="h-4 w-4 rounded border-border" />
          <Label htmlFor="intercompania">Facturación intercompañía</Label>
        </div>
      </div>

      {/* Evidencia requerida */}
      <div className="space-y-2">
        <Label>Evidencia requerida</Label>
        <div className="flex flex-wrap gap-2">
          {EVIDENCIAS.map(ev => {
            const selected = (formData.evidencia_requerida || []).includes(ev.value);
            return (
              <Badge key={ev.value}
                variant={selected ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleEvidencia(ev.value)}>
                {ev.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-2">
        <Label>Observaciones de facturación</Label>
        <Textarea value={formData.observaciones_facturacion || ''}
          onChange={e => onChange({ observaciones_facturacion: e.target.value })}
          placeholder="Reglas especiales, condiciones particulares del cliente..."
          rows={3} />
      </div>
    </div>
  );
}
