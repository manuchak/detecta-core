import { ArrowLeft, Save, Loader2, Eye, Layers, FileText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LMSCurso, LMSModulo, LMSContenido } from "@/types/lms";

interface EditorHeaderProps {
  curso: LMSCurso & { modulos?: (LMSModulo & { contenidos: LMSContenido[] })[] };
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
}

export function EditorHeader({ curso, isSaving, onSave, onBack }: EditorHeaderProps) {
  const navigate = useNavigate();
  const nivelLabel = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' }[curso.nivel] || curso.nivel;

  const modulos = curso.modulos || [];
  const totalContenidos = modulos.reduce((sum, m) => sum + (m.contenidos?.length || 0), 0);

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
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant={curso.publicado ? "default" : "secondary"} className="text-[10px] h-5">
                  {curso.publicado ? "Publicado" : "Borrador"}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5">{nivelLabel}</Badge>
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <Layers className="w-3 h-3" />
                  {modulos.length} mód
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <FileText className="w-3 h-3" />
                  {totalContenidos} cont
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <Clock className="w-3 h-3" />
                  {curso.duracion_estimada_min} min
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/lms/admin/cursos/${curso.id}/preview`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Vista Previa</span>
            </Button>
            <Button onClick={onSave} disabled={isSaving} size="sm">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
