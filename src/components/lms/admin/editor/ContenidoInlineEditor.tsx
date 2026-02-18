import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Pencil, Trash2, Play, FileText, AlignLeft, HelpCircle, Sparkles, Code, Package, Award } from "lucide-react";
import { useLMSEliminarContenido } from "@/hooks/lms/useLMSAdminContenidos";
import { ContenidoExpandedEditor } from "./ContenidoExpandedEditor";
import type { LMSContenido, TipoContenido } from "@/types/lms";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TIPO_ICONS: Record<TipoContenido, React.ReactNode> = {
  video: <Play className="w-3.5 h-3.5" />,
  documento: <FileText className="w-3.5 h-3.5" />,
  texto_enriquecido: <AlignLeft className="w-3.5 h-3.5" />,
  quiz: <HelpCircle className="w-3.5 h-3.5" />,
  interactivo: <Sparkles className="w-3.5 h-3.5" />,
  embed: <Code className="w-3.5 h-3.5" />,
  scorm: <Package className="w-3.5 h-3.5" />,
  certificado_plantilla: <Award className="w-3.5 h-3.5" />,
};

const TIPO_LABELS: Record<TipoContenido, string> = {
  video: 'Video', documento: 'Documento', texto_enriquecido: 'Texto',
  quiz: 'Quiz', interactivo: 'Interactivo', embed: 'Embed',
  scorm: 'SCORM', certificado_plantilla: 'Certificado',
};

interface ContenidoInlineEditorProps {
  contenido: LMSContenido;
  cursoId: string;
  cursoTitulo?: string;
  moduloTitulo?: string;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export function ContenidoInlineEditor({ contenido, cursoId, cursoTitulo, moduloTitulo, defaultEditing, onEditingChange }: ContenidoInlineEditorProps) {
  const [showEditor, setShowEditor] = useState(defaultEditing ?? false);
  const eliminarContenido = useLMSEliminarContenido();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: contenido.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleDelete = () => {
    eliminarContenido.mutate({
      contenidoId: contenido.id,
      moduloId: contenido.modulo_id,
      cursoId,
    });
  };

  const handleOpenEditor = () => { setShowEditor(true); onEditingChange?.(true); };
  const handleCloseEditor = () => { setShowEditor(false); onEditingChange?.(false); };

  if (showEditor) {
    return (
      <div ref={setNodeRef} style={style}>
        <ContenidoExpandedEditor
          contenido={contenido}
          cursoId={cursoId}
          cursoTitulo={cursoTitulo}
          moduloTitulo={moduloTitulo}
          onClose={handleCloseEditor}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 group transition-colors">
      <span {...attributes} {...listeners} className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5" />
      </span>

      <span className="text-muted-foreground">{TIPO_ICONS[contenido.tipo]}</span>
      <span className="text-sm flex-1 truncate">{contenido.titulo}</span>
      <Badge variant="outline" className="text-[10px] h-4 shrink-0">{TIPO_LABELS[contenido.tipo]}</Badge>
      <span className="text-xs text-muted-foreground shrink-0">{contenido.duracion_min}m</span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleOpenEditor}>
          <Pencil className="w-3 h-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar contenido?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará "{contenido.titulo}". Si hay progreso registrado, se desactivará en lugar de eliminarse.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
