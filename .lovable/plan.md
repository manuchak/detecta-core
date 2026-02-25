

# Fix Build Error + Rediseño Flashcards (estilo Quizlet/Anki)

## Parte 1: Fix Build Error en RichTextEditor

Las extensiones `Table`, `TableRow`, `TableCell` y `TableHeader` de TipTap v3 NO tienen export default. Solo tienen named exports.

### Archivo: `src/components/lms/admin/RichTextEditor.tsx`

Cambiar lineas 10-13 de default imports a named imports:

```text
// Antes:
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

// Despues:
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
```

---

## Parte 2: Rediseno del FlashcardsViewer

Inspirado en Quizlet y Anki, transformar el viewer de un componente pasivo a uno activo con auto-evaluacion.

### Archivo: `src/components/lms/interactivo/FlashcardsViewer.tsx`

Cambios principales:

**A. Auto-evaluacion por tarjeta (patron Anki/Quizlet)**
- Despues de voltear, mostrar 3 botones: "No la se" (rojo), "Casi" (amarillo), "La se" (verde)
- Trackear el estado de dominio de cada tarjeta en estado local
- Solo permitir completar cuando TODAS esten marcadas como "La se"

**B. Diseno visual mejorado de la tarjeta**
- Tarjeta mas grande (min-h-[350px]) con sombra prominente y bordes redondeados (rounded-2xl)
- Frente: fondo con gradiente sutil, tipografia mas grande (text-xl), icono de rotacion animado
- Reverso: fondo diferenciado con color (bg-blue-50 dark:bg-blue-950/30), borde de color
- Animacion 3D de volteo mas fluida con perspective aumentado

**C. Barra de progreso de dominio (no de "vistas")**
- Reemplazar los dots por una barra segmentada con colores:
  - Rojo = "No la se"
  - Amarillo = "Casi"  
  - Verde = "La se"
  - Gris = "Sin revisar"
- Contador textual: "3 de 6 dominadas"

**D. Controles mejorados**
- Boton de shuffle (mezclar tarjetas)
- Atajos de teclado: Espacio = voltear, Flechas = navegar, 1/2/3 = auto-evaluar
- Hint de atajos visible en la UI

**E. Indicador visual de interactividad**
- Icono de RotateCcw animado (pulse suave) en el centro-inferior de la tarjeta frontal
- Texto "Toca para voltear" con icono, mas grande y visible

**F. Resumen final**
- Al completar todas las tarjetas, mostrar un mini resumen:
  - Cuantas acerto a la primera
  - Cuantas necesitaron repaso
  - Boton "Repasar las dificiles" que filtra solo las marcadas como "No la se" o "Casi"

### Archivo: `src/types/lms.ts`
- Sin cambios necesarios: FlashcardsData ya soporta la estructura actual

## Archivos a modificar

| Archivo | Accion |
|---|---|
| `src/components/lms/admin/RichTextEditor.tsx` | Fix named imports de Table/TableRow/TableCell/TableHeader |
| `src/components/lms/interactivo/FlashcardsViewer.tsx` | Rediseno completo con auto-evaluacion y UX mejorado |

## Orden de implementacion

1. Fix build error (imports)
2. Rediseno FlashcardsViewer

