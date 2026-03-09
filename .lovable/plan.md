

# Plan: Agregar Botón "Eliminar" para Cortes en Estado Borrador

## Problema
No existe manera de eliminar cortes en estado `borrador` desde la UI. Esto impide regenerar cortes con la nueva lógica de estadías y armados.

## Cambios

### 1. `useCxPCortesSemanales.ts` — Agregar hook `useDeleteCxPCorte`
- Nuevo mutation hook que:
  1. Elimina los detalles del corte en `cxp_corte_detalles` (por `corte_id`)
  2. Elimina el corte en `cxp_cortes_semanales` (por `id`)
  3. Solo permite eliminar si `estado = 'borrador'`
  4. Invalida query cache al completar

### 2. `CxPOperativoTab.tsx` — Agregar botón Eliminar en la tabla
- Importar `Trash2` de lucide-react y `useDeleteCxPCorte`
- En la columna de acciones, cuando `c.estado === 'borrador'`, agregar un botón rojo con ícono de basura
- Envolver en `AlertDialog` para confirmar antes de eliminar
- Soporte para eliminación masiva: si hay cortes seleccionados en estado borrador, agregar botón "Eliminar seleccionados" en la barra de acciones en bloque

### 3. `CortesPanel.tsx` — Mismo botón eliminar (vista alternativa)
- Agregar el mismo botón de eliminar individual para cortes borrador en este panel

## Archivos

| Archivo | Cambio |
|---------|--------|
| `useCxPCortesSemanales.ts` | Nuevo hook `useDeleteCxPCorte` |
| `CxPOperativoTab.tsx` | Botón eliminar individual + masivo para borradores |
| `CortesPanel.tsx` | Botón eliminar individual para borradores |

