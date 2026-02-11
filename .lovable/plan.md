

## Plan: Habilitar reordenamiento drag-and-drop en el editor de estructura

### Problema
Los iconos de "grip" (6 puntos) en modulos y contenidos son solo visuales. No hay ningun contexto de drag-and-drop configurado en la pestana Estructura del editor de cursos, por lo que arrastrar no hace nada.

### Buena noticia
Los hooks de backend ya existen:
- `useLMSReordenarModulos` - actualiza el orden de modulos en la BD
- `useLMSReordenarContenidos` - actualiza el orden de contenidos en la BD

Solo falta conectar la UI.

### Cambios

#### 1. TabEstructura.tsx - DnD para modulos
- Importar `DndContext`, `SortableContext`, `useSensor`, `closestCenter` de `@dnd-kit`
- Envolver la lista de modulos en un `DndContext` + `SortableContext`
- Al soltar (onDragEnd), llamar a `useLMSReordenarModulos` para persistir el nuevo orden
- Hacer cada `ModuloInlineEditor` sortable pasandole las props de drag handle

#### 2. ModuloInlineEditor.tsx - Hacer sortable + DnD para contenidos
- Usar `useSortable` del `@dnd-kit/sortable` para hacer el modulo arrastrable
- Pasar `attributes` y `listeners` al icono GripVertical existente
- Envolver la lista de contenidos en su propio `DndContext` + `SortableContext`
- Al soltar contenidos, llamar a `useLMSReordenarContenidos`

#### 3. ContenidoInlineEditor.tsx - Hacer sortable
- Usar `useSortable` para hacer cada contenido arrastrable
- Aplicar `transform`/`transition` del sortable al elemento
- Conectar `attributes` y `listeners` al icono GripVertical existente

### Detalle tecnico

La arquitectura sigue exactamente el patron ya implementado en `CourseOutlineBuilder.tsx` (wizard):

```text
TabEstructura
  DndContext (modulos)
    SortableContext (modulos)
      ModuloInlineEditor (useSortable)
        DndContext (contenidos)
          SortableContext (contenidos)
            ContenidoInlineEditor (useSortable)
```

- Sensor: `PointerSensor` con `activationConstraint: { distance: 8 }` para evitar conflictos con clicks
- Estrategia: `verticalListSortingStrategy`
- Persistencia: llamada al hook de reorden en `onDragEnd`

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/lms/admin/editor/TabEstructura.tsx` | Agregar DndContext/SortableContext para modulos, llamar useLMSReordenarModulos |
| `src/components/lms/admin/editor/ModuloInlineEditor.tsx` | useSortable para el modulo + DndContext/SortableContext para contenidos |
| `src/components/lms/admin/editor/ContenidoInlineEditor.tsx` | useSortable para cada contenido |

