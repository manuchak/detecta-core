import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Pencil, Trash2, Check, X, Play, FileText, AlignLeft, HelpCircle, Sparkles, Code } from "lucide-react";
import { useLMSActualizarContenido, useLMSEliminarContenido } from "@/hooks/lms/useLMSAdminContenidos";
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
};

const TIPO_LABELS: Record<TipoContenido, string> = {
  video: 'Video', documento: 'Documento', texto_enriquecido: 'Texto',
  quiz: 'Quiz', interactivo: 'Interactivo', embed: 'Embed',
};

interface ContenidoInlineEditorProps {
  contenido: LMSContenido;
  cursoId: string;
  dragHandleProps?: any;
}

export function ContenidoInlineEditor({ contenido, cursoId, dragHandleProps }: ContenidoInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(contenido.titulo);

  const actualizarContenido = useLMSActualizarContenido();
  const eliminarContenido = useLMSEliminarContenido();

  const handleSave = () => {
    if (!titulo.trim()) return;
    actualizarContenido.mutate({
      id: contenido.id,
      moduloId: contenido.modulo_id,
      cursoId,
      data: { ...contenido, titulo },
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    eliminarContenido.mutate({
      contenidoId: contenido.id,
      moduloId: contenido.modulo_id,
      cursoId,
    });
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 group transition-colors">
      <span {...dragHandleProps} className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5" />
      </span>

      <span className="text-muted-foreground">{TIPO_ICONS[contenido.tipo]}</span>

      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setTitulo(contenido.titulo); setIsEditing(false); } }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}><Check className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setTitulo(contenido.titulo); setIsEditing(false); }}><X className="w-3.5 h-3.5" /></Button>
        </div>
      ) : (
        <>
          <span className="text-sm flex-1 truncate">{contenido.titulo}</span>
          <Badge variant="outline" className="text-[10px] h-4 shrink-0">{TIPO_LABELS[contenido.tipo]}</Badge>
          <span className="text-xs text-muted-foreground shrink-0">{contenido.duracion_min}m</span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}>
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
        </>
      )}
    </div>
  );
}
