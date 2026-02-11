import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, ChevronDown, ChevronRight, Trash2, Plus, Clock, Target, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentOutlineItem } from "./ContentOutlineItem";
import { QuickContentCreator } from "./QuickContentCreator";
import { useLMSAI } from "@/hooks/lms/useLMSAI";
import { toast } from "sonner";
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
  const [showObjectives, setShowObjectives] = useState(false);
  const { generateLearningObjectives, loading: aiLoading } = useLMSAI();
  
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

  const handleGenerateObjectives = async () => {
    const contenidosTitulos = modulo.contenidos.map(c => ({ titulo: c.titulo, tipo: c.tipo }));
    const result = await generateLearningObjectives(modulo.titulo, cursoTitulo, contenidosTitulos, 4);
    if (result?.objetivos) {
      onUpdate({ objetivos: result.objetivos });
      toast.success(`${result.objetivos.length} objetivos generados`);
    }
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
          {/* Learning Objectives */}
          <div className="border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setShowObjectives(!showObjectives)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/50 text-left"
            >
              <Target className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium flex-1">Objetivos de aprendizaje</span>
              {modulo.objetivos && modulo.objetivos.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{modulo.objetivos.length} objetivos</span>
              )}
              {showObjectives ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {showObjectives && (
              <div className="px-2.5 pb-2.5 space-y-2 border-t">
                {(!modulo.objetivos || modulo.objetivos.length === 0) ? (
                  <div className="text-center py-2">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Sin objetivos definidos</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={handleGenerateObjectives}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                      Generar con IA
                    </Button>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-1 mt-1.5">
                      {modulo.objetivos.map((obj, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] gap-1"
                      onClick={handleGenerateObjectives}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                      Regenerar
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

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
