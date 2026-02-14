import { useCSCapas, useUpdateCSCapa } from '@/hooks/useCSCapa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, AlertTriangle, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

const COLUMNS = [
  { key: 'abierto', label: 'Abierto', color: 'border-t-red-500' },
  { key: 'en_proceso', label: 'En Proceso', color: 'border-t-amber-500' },
  { key: 'implementado', label: 'Implementado', color: 'border-t-blue-500' },
  { key: 'verificado', label: 'Verificado', color: 'border-t-green-500' },
  { key: 'cerrado', label: 'Cerrado', color: 'border-t-slate-400' },
];

const NEXT_STATE: Record<string, string> = {
  abierto: 'en_proceso',
  en_proceso: 'implementado',
  implementado: 'verificado',
  verificado: 'cerrado',
};

function DroppableColumn({ id, children, label, color, count }: {
  id: string; children: React.ReactNode; label: string; color: string; count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-w-[220px]">
      <div className={`border-t-4 ${color} rounded-t-lg`}>
        <div className="p-3 bg-secondary/30 rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          </div>
        </div>
      </div>
      <div className={`space-y-2 mt-2 min-h-[200px] rounded-b-lg transition-colors ${isOver ? 'bg-accent/30' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function DraggableCapaCard({ capa, onMoveNext, isUpdating }: {
  capa: any; onMoveNext: () => void; isUpdating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: capa.id,
    data: { estado: capa.estado },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = capa.fecha_implementacion && new Date(capa.fecha_implementacion) < new Date() && capa.estado !== 'cerrado';

  return (
    <Card ref={setNodeRef} style={style} className="shadow-sm">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-mono text-primary">{capa.numero_capa}</span>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">{capa.tipo}</Badge>
          </div>
          <p className="text-xs line-clamp-2">{capa.descripcion_no_conformidad}</p>
          <p className="text-[10px] text-muted-foreground">{capa.cliente?.nombre}</p>
          {capa.fecha_implementacion && (
            <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              Target: {format(new Date(capa.fecha_implementacion), "dd MMM", { locale: es })}
            </div>
          )}
          {NEXT_STATE[capa.estado] && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full h-7 text-xs"
              onClick={onMoveNext}
              disabled={isUpdating}
            >
              <ArrowRight className="h-3 w-3 mr-1" /> Avanzar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CSCAPAKanban() {
  const { data: capas, isLoading } = useCSCapas();
  const updateCapa = useUpdateCSCapa();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-3 mt-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  const moveToState = (id: string, newEstado: string) => {
    updateCapa.mutate({
      id,
      estado: newEstado,
      ...(newEstado === 'verificado' ? { eficacia_verificada: true } : {}),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const capaId = active.id as string;
    const targetColumn = over.id as string;
    const currentEstado = active.data.current?.estado;

    // Only allow if dropping on a valid column that's different from current
    if (COLUMNS.some(c => c.key === targetColumn) && targetColumn !== currentEstado) {
      moveToState(capaId, targetColumn);
    }
  };

  const activeCapa = activeId ? (capas || []).find(c => c.id === activeId) : null;

  return (
    <div className="mt-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
          {COLUMNS.map(col => {
            const items = (capas || []).filter(c => c.estado === col.key);
            return (
              <DroppableColumn key={col.key} id={col.key} label={col.label} color={col.color} count={items.length}>
                {items.map(capa => (
                  <DraggableCapaCard
                    key={capa.id}
                    capa={capa}
                    onMoveNext={() => {
                      const next = NEXT_STATE[capa.estado];
                      if (next) moveToState(capa.id, next);
                    }}
                    isUpdating={updateCapa.isPending}
                  />
                ))}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeCapa && (
            <Card className="shadow-lg rotate-2 w-[220px]">
              <CardContent className="p-3">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-primary">{activeCapa.numero_capa}</span>
                  <p className="text-xs line-clamp-2">{activeCapa.descripcion_no_conformidad}</p>
                  <p className="text-[10px] text-muted-foreground">{activeCapa.cliente?.nombre}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
