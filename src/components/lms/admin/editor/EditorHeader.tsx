import { ArrowLeft, Save, Loader2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LMSCurso } from "@/types/lms";

interface EditorHeaderProps {
  curso: LMSCurso;
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
}

export function EditorHeader({ curso, isSaving, onSave, onBack }: EditorHeaderProps) {
  const nivelLabel = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' }[curso.nivel] || curso.nivel;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container max-w-5xl py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold truncate">{curso.titulo}</h1>
                <span className="text-xs text-muted-foreground shrink-0">({curso.codigo})</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={curso.publicado ? "default" : "secondary"} className="text-[10px] h-5">
                  {curso.publicado ? "Publicado" : "Borrador"}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5">{nivelLabel}</Badge>
                <span className="text-xs text-muted-foreground">{curso.duracion_estimada_min} min</span>
              </div>
            </div>
          </div>

          <Button onClick={onSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
