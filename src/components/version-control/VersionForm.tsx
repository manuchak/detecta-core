import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemVersion } from "@/hooks/useVersionControl";

interface VersionFormProps {
  onSubmit: (version: Omit<SystemVersion, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  initialData?: Partial<SystemVersion>;
  isLoading?: boolean;
}

export const VersionForm = ({ onSubmit, onCancel, initialData, isLoading }: VersionFormProps) => {
  const [formData, setFormData] = useState({
    version_number: initialData?.version_number || '',
    version_name: initialData?.version_name || '',
    version_type: initialData?.version_type || 'minor',
    status: initialData?.status || 'planning',
    description: initialData?.description || '',
    release_notes: initialData?.release_notes || '',
    release_date: initialData?.release_date || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData?.id ? 'Editar Versión' : 'Nueva Versión'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version_number">Número de Versión *</Label>
              <Input
                id="version_number"
                value={formData.version_number}
                onChange={(e) => setFormData({ ...formData, version_number: e.target.value })}
                placeholder="1.0.0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version_name">Nombre de Versión</Label>
              <Input
                id="version_name"
                value={formData.version_name}
                onChange={(e) => setFormData({ ...formData, version_name: e.target.value })}
                placeholder="Genesis"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version_type">Tipo de Versión</Label>
              <Select
                value={formData.version_type}
                onValueChange={(value) => setFormData({ ...formData, version_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="patch">Patch</SelectItem>
                  <SelectItem value="hotfix">Hotfix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planeación</SelectItem>
                  <SelectItem value="development">Desarrollo</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="released">Liberado</SelectItem>
                  <SelectItem value="deprecated">Deprecado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="release_date">Fecha de Release</Label>
            <Input
              id="release_date"
              type="date"
              value={formData.release_date}
              onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la versión..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="release_notes">Release Notes</Label>
            <Textarea
              id="release_notes"
              value={formData.release_notes}
              onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
              placeholder="Notas detalladas del release..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Versión'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};