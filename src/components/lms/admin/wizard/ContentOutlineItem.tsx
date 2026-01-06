import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Play, FileText, AlignLeft, HelpCircle, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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
}

export function ContentOutlineItem({ contenido, onUpdate, onDelete }: ContentOutlineItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-background border hover:border-primary/30 transition-colors group",
        isDragging && "opacity-50 shadow-md"
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
            className="text-left w-full"
          >
            <span className="text-xs truncate block">{contenido.titulo}</span>
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
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
