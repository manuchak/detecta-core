
# Consolidar vista de curso: Eliminar LMSCursoDetalle y redirigir al Editor

## Problema
Existen dos vistas paralelas para gestionar un curso:
- **LMSCursoDetalle** (`/lms/admin/cursos/:cursoId`) - Vista antigua con ModuloCard basicas, sin drag & drop, sin AI
- **LMSCursoEditor** (`/lms/admin/cursos/:cursoId/editar`) - Editor inline con todas las features (drag & drop, AI, preview card, toggle activo)

Mantener ambas genera confusion y duplicacion de codigo.

## Solucion
Eliminar la ruta intermedia y redirigir directamente al editor. La vista "detalle" se vuelve redundante porque el editor ya tiene todas las features y mejor UX.

## Cambios

### 1. Redirigir la ruta `/lms/admin/cursos/:cursoId` al editor
**Archivo:** `src/App.tsx`
- Reemplazar el componente `LMSCursoDetalle` en la ruta `/lms/admin/cursos/:cursoId` por un `Navigate` a `/lms/admin/cursos/:cursoId/editar`
- Eliminar la importacion lazy de `LMSCursoDetalle`

### 2. Actualizar navegaciones que apuntan a la vista antigua
**Archivos afectados:**
- `src/components/lms/admin/LMSCursosLista.tsx` - Cambiar `onVer` de `/cursos/${id}` a `/cursos/${id}/editar`
- `src/components/lms/admin/LMSCursoWizard.tsx` - Cambiar redirect post-creacion a `/editar`
- `src/pages/LMS/LMSAdminCursoEditar.tsx` - Cambiar `onSuccess` para quedarse en el editor en vez de volver a la vista antigua
- `src/pages/LMS/LMSAdminCursoPreview.tsx` - Cambiar boton "Volver" a `/editar`

### 3. Agregar metricas del curso al EditorHeader
Las metricas (modulos, contenidos, duracion, nivel) que se pierden al eliminar LMSCursoDetalle se integran como badges compactos en el `EditorHeader` existente.

**Archivo:** `src/components/lms/admin/editor/EditorHeader.tsx`
- Agregar badges con: cantidad de modulos, contenidos totales, duracion, y nivel
- Mantener el estilo compacto del header

### 4. Agregar boton de Vista Previa al editor
El boton "Vista Previa" que existia en LMSCursoDetalle se agrega al EditorHeader.

**Archivo:** `src/components/lms/admin/editor/EditorHeader.tsx`
- Agregar boton "Vista Previa" que navega a `/lms/admin/cursos/:cursoId/preview`

## Archivos que NO se eliminan (por ahora)
- `LMSCursoDetalle.tsx` - Se mantiene el archivo pero deja de usarse (se puede limpiar despues)
- `LMSModuloForm.tsx` y `LMSContenidoForm.tsx` - Siguen existiendo como componentes independientes aunque ya no se acceden desde la vista antigua

## Resumen de impacto
- **Modificados:** 5 archivos (App.tsx, LMSCursosLista.tsx, LMSCursoWizard.tsx, LMSAdminCursoEditar.tsx, LMSAdminCursoPreview.tsx, EditorHeader.tsx)
- **Experiencia:** Los usuarios siempre llegan al editor completo con todas las features (AI, drag & drop, preview, toggle)
