import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ResponseTemplate } from '@/hooks/useTicketConfig';
import { TicketCategoria } from '@/hooks/useTicketCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TemplateEditorProps {
  template?: ResponseTemplate;
  categorias: TicketCategoria[];
  onSave: (template: Partial<ResponseTemplate>) => Promise<void>;
  onCancel: () => void;
}

const AVAILABLE_VARIABLES = [
  { key: 'nombre', label: 'Nombre del custodio', example: 'Juan Pérez' },
  { key: 'ticket_number', label: 'Número de ticket', example: 'TKT-001' },
  { key: 'fecha', label: 'Fecha actual', example: '15 de diciembre, 2025' },
  { key: 'monto', label: 'Monto reclamado', example: '$1,500.00' },
  { key: 'servicio', label: 'ID del servicio', example: 'SRV-12345' },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  categorias,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nombre: template?.nombre || '',
    contenido: template?.contenido || '',
    categoria_id: template?.categoria_id || null,
    variables_disponibles: template?.variables_disponibles || ['nombre', 'ticket_number'],
    activo: template?.activo ?? true
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.contenido;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = `${before}{{${variable}}}${after}`;
      setFormData({ ...formData, contenido: newText });
      
      // Add to variables if not present
      if (!formData.variables_disponibles.includes(variable)) {
        setFormData(prev => ({
          ...prev,
          contenido: newText,
          variables_disponibles: [...prev.variables_disponibles, variable]
        }));
      }
    }
  };

  // Preview with replaced variables
  const getPreview = () => {
    let preview = formData.contenido;
    AVAILABLE_VARIABLES.forEach(v => {
      preview = preview.replace(new RegExp(`{{${v.key}}}`, 'g'), `<span class="bg-primary/20 px-1 rounded">${v.example}</span>`);
    });
    return preview;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del template</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Saludo inicial, Solicitud de información..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría (opcional)</Label>
          <Select 
            value={formData.categoria_id || 'all'}
            onValueChange={(v) => setFormData({ ...formData, categoria_id: v === 'all' ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icono} {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Variables disponibles</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((v) => (
              <Badge
                key={v.key}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => insertVariable(v.key)}
              >
                {`{{${v.key}}}`}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Click en una variable para insertarla en el contenido
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-content">Contenido</Label>
          <Textarea
            id="template-content"
            value={formData.contenido}
            onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
            placeholder="Escribe el contenido del template aquí..."
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label>Vista previa</Label>
          <div 
            className="p-4 bg-muted rounded-lg min-h-[100px] text-sm"
            dangerouslySetInnerHTML={{ __html: getPreview() || '<span class="text-muted-foreground">El contenido aparecerá aquí...</span>' }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving || !formData.nombre || !formData.contenido}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
};
