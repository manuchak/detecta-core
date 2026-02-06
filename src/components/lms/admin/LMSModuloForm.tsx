import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, BookOpen, Clock } from "lucide-react";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { toast } from "sonner";

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
  cursoTitulo?: string;
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

const SUGERENCIAS_MODULOS = [
  "Introducción",
  "Fundamentos",
  "Conceptos Clave",
  "Práctica Guiada",
  "Casos de Estudio",
  "Evaluación Final"
];

export function LMSModuloForm({
  open,
  onOpenChange,
  cursoId,
  cursoTitulo,
  modulo,
  nextOrden,
  onSubmit,
  isLoading = false
}: LMSModuloFormProps) {
  // Light persistence for module form
  const persistence = useFormPersistence<ModuloFormData>({
    key: `lms_modulo_${cursoId}_${modulo?.id || 'new'}`,
    initialData: {
      titulo: "",
      descripcion: "",
      orden: nextOrden,
      activo: true
    },
    level: 'light',
    isMeaningful: (data) => !!(data.titulo || data.descripcion),
  });

  const [formData, setFormData] = useState<ModuloFormData>(persistence.data);

  const { generateCourseMetadata, loading: aiLoading } = useLMSAI();

  // Sync to persistence
  useEffect(() => {
    persistence.updateData(formData);
  }, [formData]);

  useEffect(() => {
    if (modulo) {
      const data = {
        titulo: modulo.titulo,
        descripcion: modulo.descripcion || "",
        orden: modulo.orden,
        activo: modulo.activo
      };
      setFormData(data);
    } else if (open && !persistence.hasDraft) {
      setFormData({
        titulo: "",
        descripcion: "",
        orden: nextOrden,
        activo: true
      });
    }
  }, [modulo, nextOrden, open, persistence.hasDraft]);

  const handleGenerateWithAI = async () => {
    if (!formData.titulo || formData.titulo.length < 3) {
      toast.error("Escribe un título de al menos 3 caracteres");
      return;
    }

    const result = await generateCourseMetadata(`${cursoTitulo || 'Curso'}: ${formData.titulo}`);
    if (result?.descripcion) {
      setFormData({ ...formData, descripcion: result.descripcion });
      toast.success("Descripción generada con IA");
    }
  };

  const handleSugerenciaClick = (sugerencia: string) => {
    const tituloCompleto = cursoTitulo 
      ? `${sugerencia}: ${cursoTitulo}`
      : sugerencia;
    setFormData({ ...formData, titulo: tituloCompleto });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    persistence.clearDraft(true);
  };

  const isEditing = !!modulo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Módulo" : "Nuevo Módulo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Sugerencias rápidas */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sugerencias rápidas
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {SUGERENCIAS_MODULOS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSugerenciaClick(sug)}
                    className="px-2.5 py-1 text-xs rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-sm font-medium">
              Título del Módulo *
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Introducción a la Seguridad"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="descripcion" className="text-sm font-medium">
                Descripción
              </Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={aiLoading || !formData.titulo || formData.titulo.length < 3}
                className="h-7 gap-1.5 text-xs"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                )}
                Generar con IA
              </Button>
            </div>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe el contenido y objetivos de este módulo..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Preview Card */}
          <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Vista previa del módulo
            </Label>
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{formData.orden}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">
                  {formData.titulo || "Título del módulo"}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {formData.descripcion || "Descripción del módulo..."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
            <div>
              <Label htmlFor="activo" className="text-sm font-medium">Módulo Activo</Label>
              <p className="text-xs text-muted-foreground">Visible para los usuarios</p>
            </div>
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
