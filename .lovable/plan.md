

## Plan: Corregir el guardado de rutas en la Matriz de Precios

### Problema identificado

Al guardar cambios en el formulario de edicion de rutas (`RouteManagementForm`), el campo "Observaciones" del formulario esta mapeado como `observaciones` pero la columna real en la base de datos se llama `notas`. Cuando el usuario llena este campo o crea una ruta nueva (donde el valor por defecto es `''`), Supabase intenta escribir en una columna que no existe, generando un error de PostgreSQL que impide guardar.

Ademas, al editar una ruta existente, el formulario no carga todos los campos disponibles en la base de datos (como `tipo_servicio`, `tipo_viaje`, `clave`, `costo_custodio`, etc.) porque el tipo `MatrizPrecio` que pasa `MatrizPreciosTab` no incluye esas columnas. Esto causa que al guardar, esos campos se sobreescriban con valores vacios o se pierdan.

### Cambios necesarios

#### 1. RouteManagementForm.tsx - Corregir mapeo de campo `observaciones` a `notas`

- Renombrar el campo `observaciones` en la interfaz `RouteData` a `notas`
- Actualizar todas las referencias en el formulario (`formData.observaciones` a `formData.notas`)
- Actualizar el `handleInputChange` y el `initialFormData`

#### 2. MatrizPreciosTab.tsx - Ampliar la query para traer todos los campos editables

- Cambiar la interfaz `MatrizPrecio` para incluir los campos faltantes: `tipo_servicio`, `tipo_viaje`, `clave`, `costo_custodio`, `costo_maximo_casetas`, `pago_custodio_sin_arma`, `notas`, `es_ruta_reparto`, `puntos_intermedios`
- Esto asegura que al abrir el formulario de edicion, todos los campos se pre-cargan con los valores actuales de la BD

#### 3. RouteManagementForm.tsx - Excluir el campo `id` del payload de update

- Agregar `id` a los campos excluidos en el destructuring de `handleSubmit` para evitar enviar la primary key en el SET clause (buena practica aunque no causa errores actualmente)

### Detalle tecnico

| Archivo | Cambio |
|---|---|
| `RouteManagementForm.tsx` | Renombrar `observaciones` a `notas` en RouteData, initialFormData, y el textarea |
| `RouteManagementForm.tsx` | Excluir `id` del payload en handleSubmit |
| `MatrizPreciosTab.tsx` | Agregar campos faltantes a la interfaz `MatrizPrecio` |

### Por que falla actualmente

```text
Flujo actual:
  1. Usuario abre "Editar ruta"
  2. Formulario carga datos de MatrizPrecio (faltan campos)
  3. Usuario edita y hace click en "Guardar"
  4. handleSubmit envia { ...formData, observaciones: '' } al update
  5. PostgreSQL rechaza: columna "observaciones" no existe
  6. Toast: "Error al guardar la ruta"

Flujo corregido:
  1. Usuario abre "Editar ruta"
  2. Formulario carga TODOS los campos (incluyendo notas, tipo_servicio, etc.)
  3. Usuario edita y hace click en "Guardar"
  4. handleSubmit envia { ...formData, notas: '...' } (sin id, sin generated cols)
  5. PostgreSQL acepta la actualizacion
  6. Toast: "Ruta actualizada correctamente"
```
