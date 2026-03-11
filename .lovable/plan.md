

# Causa raíz: Midot PDF no se puede subir

## Problema identificado

El bucket `candidato-documentos` tiene un **límite de 10MB** (`file_size_limit: 10485760`), y el formulario `MidotResultForm` **no valida el tamaño del archivo** antes de intentar subirlo. Si el PDF excede 10MB, Supabase Storage lo rechaza.

Adicionalmente, hay un riesgo secundario en `useCreateMidot`: `evaluador_id: user?.id || ''` pasa un string vacío (UUID inválido) si el usuario no está cargado, lo cual haría fallar el INSERT en `evaluaciones_midot`.

## Correcciones

### 1. `MidotResultForm.tsx` — Validar tamaño del archivo

Agregar validación de tamaño máximo (10MB) al seleccionar el PDF, mostrando un toast si se excede.

### 2. `MidotResultForm.tsx` — Aumentar límite o informar claramente

Si se necesitan PDFs más grandes, una migración SQL puede aumentar el `file_size_limit` del bucket. Alternativamente, mostrar el límite al usuario.

### 3. `useEvaluacionesMidot.ts` — Proteger `evaluador_id`

Cambiar `user?.id || ''` por una validación que lance error si no hay usuario autenticado, en lugar de pasar un UUID inválido.

### Archivos impactados

| Archivo | Cambio |
|---|---|
| `src/components/recruitment/midot/MidotResultForm.tsx` | Validar tamaño de archivo (10MB) con feedback |
| `src/hooks/useEvaluacionesMidot.ts` | Validar `user?.id` antes del INSERT |
| Migración SQL (opcional) | Aumentar `file_size_limit` del bucket si se requieren PDFs >10MB |

