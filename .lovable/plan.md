
# Fix: Cursos obligatorios aparecen solo en Catálogo

## Problema
Un curso marcado como "obligatorio" solo aparece en la pestaña "Catálogo" porque el usuario no tiene una inscripcion activa para ese curso. La lógica actual en `LMSDashboard.tsx` separa cursos asi:

- **Mis Cursos**: cursos con `inscripcion_id` (el usuario ya esta inscrito)
- **Catalogo**: cursos SIN `inscripcion_id`

Como el curso obligatorio no tiene inscripcion, cae en "Catalogo" y muestra boton "Inscribirme", lo cual no tiene sentido para un curso obligatorio.

## Solucion

Dos cambios complementarios:

### 1. Mostrar cursos obligatorios sin inscripcion en "Mis Cursos"
En `src/pages/LMS/LMSDashboard.tsx`, modificar los filtros para que los cursos con `es_obligatorio = true` aparezcan en "Mis Cursos" aunque no tengan inscripcion:

- `cursosEnProgreso` y el filtro de "Mis Cursos" (`cursos?.filter(c => c.inscripcion_id)`) deben incluir tambien cursos obligatorios sin inscripcion
- `cursosCatalogo` debe excluir cursos obligatorios: `cursos?.filter(c => !c.inscripcion_id && !c.es_obligatorio)`

### 2. Auto-inscribir al hacer click en curso obligatorio
En el componente `CourseCard`, cuando un curso es obligatorio y no tiene inscripcion, el boton debe decir "Comenzar" (no "Inscribirme") y al hacer click debe auto-inscribir y navegar al curso.

## Detalle tecnico

### Archivo: `src/pages/LMS/LMSDashboard.tsx`

Cambios en las lineas 36-52:

```typescript
// Cursos del usuario: inscritos + obligatorios sin inscripcion
const misCursos = cursos?.filter(c => 
  c.inscripcion_id || c.es_obligatorio
) || [];

const cursosObligatoriosPendientes = cursos?.filter(c => 
  c.es_obligatorio && 
  c.inscripcion_estado !== 'completado'
) || [];

const cursosEnProgreso = cursos?.filter(c => 
  c.inscripcion_id && 
  c.inscripcion_estado === 'en_progreso'
) || [];

const cursosCompletados = cursos?.filter(c => 
  c.inscripcion_estado === 'completado'
) || [];

// Catalogo: solo cursos NO obligatorios sin inscripcion
const cursosCatalogo = cursos?.filter(c => !c.inscripcion_id && !c.es_obligatorio) || [];
```

Actualizar las referencias en "Mis Cursos" tab (lineas 176, 193) para usar `misCursos` en lugar de `cursos?.filter(c => c.inscripcion_id)`.

### Archivo: `src/components/lms/CourseCard.tsx`

Verificar que el boton de accion para cursos obligatorios sin inscripcion muestre "Comenzar" y llame `onEnroll` seguido de navegacion (o directamente `onStartCourse` que dispare la inscripcion automatica).

### Badge del tab "Mis Cursos"

Actualizar el badge del tab para contar tambien los obligatorios pendientes:
```typescript
const misCursosCount = (cursosEnProgreso.length || 0) + 
  (cursos?.filter(c => c.es_obligatorio && !c.inscripcion_id).length || 0);
```
