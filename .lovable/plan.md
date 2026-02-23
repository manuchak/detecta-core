

# Plan: Editar y Eliminar Evaluaciones Midot para Supply

## Problema

Mariana (rol supply) subio una evaluacion Midot duplicada con fechas distintas y no puede corregir su error porque no existe boton de editar ni eliminar en la interfaz de evaluaciones Midot.

## Cambios Propuestos

### 1. Hook: Agregar mutaciones de editar y eliminar (`src/hooks/useEvaluacionesMidot.ts`)

- **`useUpdateMidot`**: Mutation que recibe el `id` de la evaluacion y los campos actualizados (scores, fecha, notas, PDF). Recalcula `score_global` y `resultado_semaforo` automaticamente.
- **`useDeleteMidot`**: Mutation que elimina una evaluacion por `id`. Incluye invalidacion del cache.
- Ambas mutaciones muestran toast de confirmacion/error.

### 2. UI: Agregar acciones de editar/eliminar en cada tarjeta (`src/components/recruitment/midot/MidotEvaluationTab.tsx`)

- Agregar botones de **Editar** (icono lapiz) y **Eliminar** (icono basura) en cada `EvaluacionMidotCard`.
- Los botones solo se muestran para roles autorizados: `supply`, `supply_lead`, `supply_admin`, `admin`, `owner`.
- **Eliminar** muestra un `AlertDialog` de confirmacion antes de ejecutar.
- **Editar** abre el formulario `MidotResultForm` pre-llenado con los datos existentes.

### 3. Formulario: Soportar modo edicion (`src/components/recruitment/midot/MidotResultForm.tsx`)

- Agregar prop opcional `evaluacionExistente?: EvaluacionMidot` para pre-llenar campos.
- Si existe, el submit usa `useUpdateMidot` en lugar de `useCreateMidot`.
- El titulo del formulario cambia a "Editar Evaluacion Midot".

### 4. RLS en Supabase (si es necesario)

- Verificar que las politicas RLS de `evaluaciones_midot` permitan `UPDATE` y `DELETE` para los roles de supply. Si no existen, se deben crear politicas que permitan a usuarios autenticados con roles `supply`, `supply_lead`, `supply_admin`, `admin`, `owner` ejecutar estas operaciones.

## Detalle Tecnico

### Nuevas funciones en `useEvaluacionesMidot.ts`

```ts
// useDeleteMidot - elimina evaluacion por ID
export function useDeleteMidot() {
  // DELETE FROM evaluaciones_midot WHERE id = ?
  // Invalida queryKey ['evaluaciones-midot', candidato_id]
}

// useUpdateMidot - actualiza scores, fecha, notas, PDF
export function useUpdateMidot() {
  // Recalcula score_global y resultado_semaforo
  // UPDATE evaluaciones_midot SET ... WHERE id = ?
  // Invalida queryKey ['evaluaciones-midot', candidato_id]
}
```

### Control de acceso en UI

```ts
const ROLES_CON_EDICION = ['supply', 'supply_lead', 'supply_admin', 'admin', 'owner'];
const canEdit = ROLES_CON_EDICION.includes(userRole);
```

### Flujo de eliminacion

```text
[Boton Eliminar] -> [AlertDialog: "Seguro que deseas eliminar?"] -> [Confirmar] -> [DELETE] -> [Toast exito]
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useEvaluacionesMidot.ts` | Agregar `useUpdateMidot` y `useDeleteMidot` |
| `src/components/recruitment/midot/MidotEvaluationTab.tsx` | Botones editar/eliminar con control de rol y AlertDialog |
| `src/components/recruitment/midot/MidotResultForm.tsx` | Soporte modo edicion con prop `evaluacionExistente` |
| Supabase RLS | Verificar/crear politicas UPDATE y DELETE para roles supply |

