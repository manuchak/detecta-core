import { useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Trash2, Play, FileText, AlignLeft, HelpCircle, Sparkles, Clock, AlertCircle, CheckCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentEditor } from "./ContentEditor";
import type { ContentOutline } from "./StepEstructura";

const TIPO_ICONS = {
  video: Play,
  documento: FileText,
  texto_enriquecido: AlignLeft,
  quiz: HelpCircle,
  interactivo: Sparkles,
};

const TIPO_COLORS = {
  video: "text-red-500 bg-red-50",
  documento: "text-blue-500 bg-blue-50",
  texto_enriquecido: "text-green-500 bg-green-50",
  quiz: "text-purple-500 bg-purple-50",
  interactivo: "text-orange-500 bg-orange-50",
};

interface ContentOutlineItemProps {
  contenido: ContentOutline;
  onUpdate: (updates: Partial<ContentOutline>) => void;
  onDelete: () => void;
  moduloTitulo?: string;
  cursoTitulo?: string;
}

export function ContentOutlineItem({ contenido, onUpdate, onDelete, moduloTitulo, cursoTitulo }: ContentOutlineItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contenido.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = TIPO_ICONS[contenido.tipo] || AlignLeft;
  const colorClass = TIPO_COLORS[contenido.tipo] || "text-gray-500 bg-gray-50";

  const isComplete = useMemo(() => {
    const c = contenido.contenido;
    if (!c) return false;
    
    switch (contenido.tipo) {
      case 'video':
      case 'documento':
        return !!c.url && c.url.length > 5;
      case 'texto_enriquecido':
        return !!c.html && c.html.length > 20;
      case 'quiz':
        return (c.preguntas_count || 0) > 0;
      case 'interactivo':
        return true; // Configure later
      default:
        return false;
    }
  }, [contenido]);

  const getStatusTooltip = () => {
    if (isComplete) return "Contenido completo";
    
    switch (contenido.tipo) {
      case 'video':
        return "Falta agregar URL o archivo de video";
      case 'documento':
        return "Falta agregar URL o archivo de documento";
      case 'texto_enriquecido':
        return "Falta agregar contenido de texto";
      case 'quiz':
        return "Las preguntas se agregan después de crear el curso";
      default:
        return "Contenido pendiente";
    }
  };

  if (showEditor) {
    return (
      <ContentEditor
        contenido={contenido}
        onUpdate={onUpdate}
        onClose={() => setShowEditor(false)}
        moduloTitulo={moduloTitulo}
        cursoTitulo={cursoTitulo}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-background border hover:border-primary/30 transition-colors group",
        isDragging && "opacity-50 shadow-md",
        !isComplete && "border-amber-200 bg-amber-50/30"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className={cn("p-1.5 rounded", colorClass)}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={contenido.titulo}
            onChange={(e) => onUpdate({ titulo: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            className="h-6 text-xs"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-left w-full flex items-center gap-1.5"
          >
            <span className="text-xs truncate block flex-1">{contenido.titulo}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0">
                  {isComplete ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {getStatusTooltip()}
              </TooltipContent>
            </Tooltip>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <Input
            type="number"
            value={contenido.duracion_min}
            onChange={(e) => onUpdate({ duracion_min: parseInt(e.target.value) || 0 })}
            className="w-10 h-5 text-xs text-center p-0"
            min={1}
          />
          <span>min</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          onClick={() => setShowEditor(true)}
          title="Editar contenido"
        >
          <Pencil className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
