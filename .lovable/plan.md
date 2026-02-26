

# Vista de Revision de Cursos para Stakeholders

## Objetivo
Permitir que stakeholders (admins) puedan revisar el contenido completo y diseno instruccional de cualquier curso directamente desde el panel de administracion, sin necesidad de inscribirse ni alterar datos de progreso.

## Solucion: "Modo Preview" del Curso

Crear una nueva pagina `/lms/admin/cursos/:cursoId/preview` que reutilice la misma interfaz del `CursoViewer` (sidebar de modulos + renderizador de contenido) pero en modo lectura pura: sin inscripcion, sin tracking de progreso, sin auto-complete.

### Como funcionara para el stakeholder
1. Desde la lista de cursos en Admin o desde el detalle del curso, veran un boton **"Vista Previa"** (icono Eye)
2. Al hacer clic, se abre el curso completo con toda su estructura y contenido renderizado
3. Pueden navegar libremente entre modulos y contenidos (videos, textos, quizzes, documentos)
4. No se registra progreso ni se requiere inscripcion
5. Header claro indica "MODO PREVIEW" para distinguirlo de la experiencia real del alumno

### Flujo visual

```text
Admin Panel
  |
  +-- Lista de Cursos --> [boton "Vista Previa"] --> /lms/admin/cursos/:id/preview
  |
  +-- Detalle Curso --> [boton "Vista Previa"] --> /lms/admin/cursos/:id/preview
```

---

## Detalle Tecnico

### 1. Nueva pagina: `src/pages/LMS/LMSAdminCursoPreview.tsx`
- Usa `useLMSAdminCursoDetalle(cursoId)` para obtener curso + modulos + contenidos (ya existe este hook, no requiere inscripcion)
- Layout identico al `CursoViewer`: sidebar izquierda con modulos, area principal con `ContentRenderer`
- **Sin** hooks de progreso (`useLMSProgresoContenidos`, `useLMSMarcarCompletado`, etc.)
- **Sin** logica de inscripcion automatica
- Barra de navegacion (anterior/siguiente) funcional
- Header con badge "PREVIEW" y boton para volver al admin
- El sidebar `ModuleSidebar` se reutiliza pasando `progresos=[]` y `progresoGeneral=0`

### 2. Ruta nueva en `App.tsx`
- Path: `/lms/admin/cursos/:cursoId/preview`
- Protegida con `RoleProtectedRoute` para roles `admin`, `owner`, `supply_admin`, `capacitacion_admin`
- Envuelta en `LMSZoomReset` como las demas rutas LMS admin

### 3. Boton "Vista Previa" en componentes existentes

**En `LMSCursoDetalle.tsx`** (pagina de detalle admin):
- Agregar boton "Vista Previa" junto al boton "Editar Curso" en el header

**En `LMSCursosLista.tsx`** (lista de cursos admin):
- Agregar opcion "Vista Previa" en el menu de acciones de cada curso (si existe menu contextual)

### 4. Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/pages/LMS/LMSAdminCursoPreview.tsx` | **Crear** - pagina de preview read-only |
| `src/App.tsx` | **Modificar** - agregar ruta nueva |
| `src/components/lms/admin/LMSCursoDetalle.tsx` | **Modificar** - agregar boton Vista Previa |

### 5. Ventajas de este enfoque
- **Reutiliza** `ContentRenderer` y `ModuleSidebar` sin duplicar codigo
- **No toca** la experiencia del alumno (CursoViewer intacto)
- **No requiere** cambios en base de datos ni RPCs
- **Seguro**: solo admins pueden acceder via RoleProtectedRoute
- **Rapido**: un stakeholder entra, navega todo el contenido, y sale

