import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface ModuloFormData {
  titulo: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

interface LMSModuloFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
  modulo?: {
    id: string;
    titulo: string;
    descripcion: string | null;
    orden: number;
    activo: boolean;
  } | null;
  nextOrden: number;
  onSubmit: (data: ModuloFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LMSModuloForm({
  open,
  onOpenChange,
  cursoId,
  modulo,
  nextOrden,
  onSubmit,
  isLoading = false
}: LMSModuloFormProps) {
  const [formData, setFormData] = useState<ModuloFormData>({
    titulo: "",
    descripcion: "",
    orden: nextOrden,
    activo: true
  });

  useEffect(() => {
    if (modulo) {
      setFormData({
        titulo: modulo.titulo,
        descripcion: modulo.descripcion || "",
        orden: modulo.orden,
        activo: modulo.activo
      });
    } else {
      setFormData({
        titulo: "",
        descripcion: "",
        orden: nextOrden,
        activo: true
      });
    }
  }, [modulo, nextOrden, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isEditing = !!modulo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Módulo" : "Nuevo Módulo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título del Módulo *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Introducción a la Seguridad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción del módulo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orden">Orden</Label>
            <Input
              id="orden"
              type="number"
              min={1}
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="activo">Módulo Activo</Label>
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.titulo.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Módulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
