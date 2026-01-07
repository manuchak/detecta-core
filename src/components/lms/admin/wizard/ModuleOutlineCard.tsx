import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, ChevronDown, ChevronRight, Trash2, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentOutlineItem } from "./ContentOutlineItem";
import { QuickContentCreator } from "./QuickContentCreator";
import type { ModuleOutline, ContentOutline } from "./StepEstructura";

interface ModuleOutlineCardProps {
  modulo: ModuleOutline;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<ModuleOutline>) => void;
  onDelete: () => void;
  onAddContent: (content: ContentOutline) => void;
  onUpdateContent: (contentId: string, updates: Partial<ContentOutline>) => void;
  onDeleteContent: (contentId: string) => void;
  onReorderContents: (newContents: ContentOutline[]) => void;
  cursoTitulo?: string;
}

export function ModuleOutlineCard({
  modulo,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onAddContent,
  onUpdateContent,
  onDeleteContent,
  onReorderContents,
  cursoTitulo,
}: ModuleOutlineCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showContentCreator, setShowContentCreator] = useState(false);
  
  // Force empty modules to be visually expanded
  const shouldBeExpanded = isExpanded || modulo.contenidos.length === 0;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: modulo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const duracionTotal = modulo.contenidos.reduce((acc, c) => acc + c.duracion_min, 0);

  const handleContentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modulo.contenidos.findIndex(c => c.id === active.id);
    const newIndex = modulo.contenidos.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newContents = arrayMove(modulo.contenidos, oldIndex, newIndex).map((c, idx) => ({
        ...c,
        orden: idx + 1,
      }));
      onReorderContents(newContents);
    }
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "apple-card border overflow-hidden",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Module Header */}
      <div className="flex items-center gap-2 p-3 bg-muted/30">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-muted rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleTitleSubmit} className="flex gap-2">
              <Input
                value={modulo.titulo}
                onChange={(e) => onUpdate({ titulo: e.target.value })}
                onBlur={() => setIsEditing(false)}
                className="h-7 text-sm font-medium"
                autoFocus
              />
            </form>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-left w-full"
            >
              <span className="text-sm font-medium truncate block">
                {modulo.orden}. {modulo.titulo}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duracionTotal}m
          </span>
          <span className="text-xs text-muted-foreground">
            {modulo.contenidos.length} items
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              if (!shouldBeExpanded) onToggleExpand();
              setShowContentCreator(true);
            }}
            title="Agregar contenido"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Module Content */}
      {shouldBeExpanded && (
        <div className="p-3 space-y-2">
          {modulo.contenidos.length === 0 && !showContentCreator && (
            <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md bg-muted/20">
              Este módulo está vacío. Agrega tu primer contenido.
            </p>
          )}
          
          {modulo.contenidos.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleContentDragEnd}
            >
              <SortableContext
                items={modulo.contenidos.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {modulo.contenidos.map((contenido) => (
                    <ContentOutlineItem
                      key={contenido.id}
                      contenido={contenido}
                      onUpdate={(updates) => onUpdateContent(contenido.id, updates)}
                      onDelete={() => onDeleteContent(contenido.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {showContentCreator ? (
            <QuickContentCreator
              moduloTitulo={modulo.titulo}
              cursoTitulo={cursoTitulo}
              onAdd={(content) => {
                onAddContent(content);
                setShowContentCreator(false);
              }}
              onCancel={() => setShowContentCreator(false)}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContentCreator(true)}
              className="w-full h-8 border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar contenido
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
