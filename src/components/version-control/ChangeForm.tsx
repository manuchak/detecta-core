import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ChangeFormProps {
  versionId: string;
  onSubmit: (changeData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ChangeForm = ({ versionId, onSubmit, onCancel, isLoading }: ChangeFormProps) => {
  const [formData, setFormData] = useState({
    change_type: 'feature',
    module: '',
    title: '',
    description: '',
    impact_level: 'medium',
    technical_details: '',
    rollback_plan: '',
    testing_notes: ''
  });
  
  const [components, setComponents] = useState<string[]>([]);
  const [componentInput, setComponentInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      version_id: versionId,
      affected_components: components
    });
  };

  const addComponent = () => {
    if (componentInput.trim() && !components.includes(componentInput.trim())) {
      setComponents([...components, componentInput.trim()]);
      setComponentInput('');
    }
  };

  const removeComponent = (component: string) => {
    setComponents(components.filter(c => c !== component));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Cambio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="change_type">Tipo de Cambio *</Label>
              <Select
                value={formData.change_type}
                onValueChange={(value) => setFormData({ ...formData, change_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="bugfix">Bug Fix</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                  <SelectItem value="breaking_change">Breaking Change</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact_level">Nivel de Impacto *</Label>
              <Select
                value={formData.impact_level}
                onValueChange={(value) => setFormData({ ...formData, impact_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="module">Módulo Afectado *</Label>
            <Input
              id="module"
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              placeholder="ej: Mantenimiento - Wizard Importación"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título del Cambio *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Breve descripción del cambio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del cambio y su justificación"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technical_details">Detalles Técnicos</Label>
            <Textarea
              id="technical_details"
              value={formData.technical_details}
              onChange={(e) => setFormData({ ...formData, technical_details: e.target.value })}
              placeholder="Archivos modificados, líneas específicas, snippets de código, etc."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="components">Componentes Afectados</Label>
            <div className="flex gap-2">
              <Input
                id="components"
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                placeholder="Nombre del componente o archivo"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComponent())}
              />
              <Button type="button" onClick={addComponent} variant="outline">
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {components.map((component) => (
                <Badge key={component} variant="secondary" className="gap-1">
                  {component}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeComponent(component)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rollback_plan">Plan de Rollback</Label>
            <Textarea
              id="rollback_plan"
              value={formData.rollback_plan}
              onChange={(e) => setFormData({ ...formData, rollback_plan: e.target.value })}
              placeholder="Pasos para revertir este cambio en caso de problemas"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testing_notes">Notas de Testing</Label>
            <Textarea
              id="testing_notes"
              value={formData.testing_notes}
              onChange={(e) => setFormData({ ...formData, testing_notes: e.target.value })}
              placeholder="Casos de prueba, escenarios a validar, checklist de QA"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Guardando..." : "Guardar Cambio"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
