import { useState, useEffect, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModuleOutlineCard } from "./ModuleOutlineCard";
import type { ModuleOutline, ContentOutline } from "./StepEstructura";

interface CourseOutlineBuilderProps {
  modulos: ModuleOutline[];
  onChange: (modulos: ModuleOutline[]) => void;
  cursoTitulo?: string;
}

export function CourseOutlineBuilder({ modulos, onChange, cursoTitulo }: CourseOutlineBuilderProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modulos.map(m => m.id)));
  const prevModuleIdsRef = useRef<Set<string>>(new Set(modulos.map(m => m.id)));

  // Auto-expand new modules (especially empty ones)
  useEffect(() => {
    const currentIds = new Set(modulos.map(m => m.id));
    const prevIds = prevModuleIdsRef.current;
    
    // Find newly added modules
    const newModuleIds = modulos
      .filter(m => !prevIds.has(m.id))
      .map(m => m.id);
    
    if (newModuleIds.length > 0) {
      setExpandedModules(prev => {
        const next = new Set(prev);
        newModuleIds.forEach(id => next.add(id));
        return next;
      });
    }
    
    prevModuleIdsRef.current = currentIds;
  }, [modulos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modulos.findIndex(m => m.id === active.id);
    const newIndex = modulos.findIndex(m => m.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newModulos = arrayMove(modulos, oldIndex, newIndex).map((m, idx) => ({
        ...m,
        orden: idx + 1,
      }));
      onChange(newModulos);
    }
  };

  const handleAddModule = () => {
    const newModule: ModuleOutline = {
      id: crypto.randomUUID(),
      titulo: `Módulo ${modulos.length + 1}`,
      orden: modulos.length + 1,
      contenidos: [],
    };
    onChange([...modulos, newModule]);
    setExpandedModules(prev => new Set([...prev, newModule.id]));
  };

  const handleUpdateModule = (moduleId: string, updates: Partial<ModuleOutline>) => {
    onChange(modulos.map(m => m.id === moduleId ? { ...m, ...updates } : m));
  };

  const handleDeleteModule = (moduleId: string) => {
    onChange(modulos.filter(m => m.id !== moduleId).map((m, idx) => ({ ...m, orden: idx + 1 })));
  };

  const handleAddContent = (moduleId: string, content: ContentOutline) => {
    onChange(modulos.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        contenidos: [...m.contenidos, { ...content, orden: m.contenidos.length + 1 }],
      };
    }));
  };

  const handleUpdateContent = (moduleId: string, contentId: string, updates: Partial<ContentOutline>) => {
    onChange(modulos.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        contenidos: m.contenidos.map(c => c.id === contentId ? { ...c, ...updates } : c),
      };
    }));
  };

  const handleDeleteContent = (moduleId: string, contentId: string) => {
    onChange(modulos.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        contenidos: m.contenidos.filter(c => c.id !== contentId).map((c, idx) => ({ ...c, orden: idx + 1 })),
      };
    }));
  };

  const handleReorderContents = (moduleId: string, newContents: ContentOutline[]) => {
    onChange(modulos.map(m => {
      if (m.id !== moduleId) return m;
      return { ...m, contenidos: newContents };
    }));
  };

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (modulos.length === 0) return null;

  return (
    <div className="space-y-3">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={modulos.map(m => m.id)} strategy={verticalListSortingStrategy}>
          {modulos.map((modulo) => (
            <ModuleOutlineCard
              key={modulo.id}
              modulo={modulo}
              isExpanded={expandedModules.has(modulo.id)}
              onToggleExpand={() => toggleExpanded(modulo.id)}
              onUpdate={(updates) => handleUpdateModule(modulo.id, updates)}
              onDelete={() => handleDeleteModule(modulo.id)}
              onAddContent={(content) => handleAddContent(modulo.id, content)}
              onUpdateContent={(contentId, updates) => handleUpdateContent(modulo.id, contentId, updates)}
              onDeleteContent={(contentId) => handleDeleteContent(modulo.id, contentId)}
              onReorderContents={(newContents) => handleReorderContents(modulo.id, newContents)}
              cursoTitulo={cursoTitulo}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddModule}
        className="w-full border-dashed gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar módulo
      </Button>
    </div>
  );
}
