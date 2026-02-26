
# Habilitar edicion y eliminacion de referencias

## Problema
El equipo de Supply no puede editar ni borrar las referencias que ya capturaron. Solo existe el boton "Validar" para referencias pendientes, pero no hay opciones de editar datos o eliminar registros incorrectos/duplicados.

## Cambios

### 1. ReferencesTab.tsx - Agregar estado y callbacks para editar/eliminar

- Agregar estado `editingRef` para controlar que referencia se esta editando
- Pasar callbacks `onEdit` y `onDelete` al componente `ReferenceCard`
- Conectar `onEdit` para abrir el `ReferenceForm` con datos precargados
- Conectar `onDelete` con el hook `useDeleteReferencia` existente, con confirmacion via `AlertDialog`

### 2. ReferenceCard (dentro de ReferencesTab.tsx) - Botones de editar/eliminar

- Agregar iconos `Pencil` y `Trash2` como botones junto al boton "Validar"
- Los botones seran visibles siempre (no solo en estado pendiente)
- Incluir un `AlertDialog` para confirmar la eliminacion antes de ejecutarla

### 3. ReferenceForm.tsx - Soportar modo edicion

- Agregar prop opcional `editingReferencia` con los datos existentes
- Cuando se pasa una referencia existente, precargar los campos del formulario
- Cambiar el titulo del dialog a "Editar Referencia" cuando aplique
- En `handleSubmit`, si hay referencia existente, usar update en vez de create
- Cambiar el texto del boton de "Agregar Referencia" a "Guardar Cambios"

### 4. useReferencias.ts - Agregar mutation de actualizacion

- Crear `useUpdateReferencia` que haga `.update()` en `referencias_candidato` por `id`
- Invalidar queries de referencias al completar
- Mostrar toast de exito/error

## Detalle tecnico

### Nuevo hook `useUpdateReferencia`
```typescript
// Actualiza campos editables: nombre, relacion, empresa, cargo, telefono, email, tiempo_conocido
// No toca campos de validacion (resultado, validador_id, etc.)
```

### Flujo de edicion
1. Usuario hace clic en icono de lapiz en la tarjeta
2. Se abre `ReferenceForm` con datos precargados
3. Al guardar, se ejecuta `useUpdateReferencia` en vez de `useCreateReferencia`
4. Se cierra el dialog y se refrescan las queries

### Flujo de eliminacion
1. Usuario hace clic en icono de basura
2. Aparece `AlertDialog` pidiendo confirmacion
3. Al confirmar, se ejecuta `useDeleteReferencia` (ya existe)
4. Se refrescan las queries

## Archivos modificados
- `src/hooks/useReferencias.ts` - Agregar `useUpdateReferencia`
- `src/components/recruitment/references/ReferenceForm.tsx` - Soportar modo edicion
- `src/components/recruitment/references/ReferencesTab.tsx` - Botones edit/delete y logica
