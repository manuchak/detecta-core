

# Fix: Certificado con fecha dinámica y nombre de curso faltante

## Causa raíz

El componente `CertificadoPlantillaViewer.tsx` **construye los datos del certificado en tiempo real** en lugar de leer los datos almacenados en la tabla `lms_certificados`. Tres bugs:

| Campo | Comportamiento actual (ROTO) | Correcto |
|---|---|---|
| **Fecha** | `new Date().toLocaleDateString(...)` — siempre muestra la fecha de HOY | Debe mostrar la fecha en que se completó el curso por primera vez |
| **Nombre del curso** | `cursoTitulo` prop nunca se pasa desde `ContentRenderer` → cae al fallback `'Curso'` | Debe mostrar el título real del curso |
| **Código verificación** | `inscripcionId.slice(0,8)` — muestra parte del ID de inscripción | Debe mostrar el código real del certificado desde `lms_certificados` |

## Plan de corrección

### 1. `ContentRenderer.tsx` — Pasar `cursoTitulo` al componente
Línea 130-134: Agregar la prop `cursoTitulo`. El `ContentRenderer` no recibe el título del curso actualmente, así que hay que agregarlo como prop opcional y pasarlo desde `CursoViewer.tsx`.

### 2. `CursoViewer.tsx` — Pasar `cursoTitulo` al `ContentRenderer`
Línea 330-338: Agregar `cursoTitulo={curso.titulo}` al `ContentRenderer`.

### 3. `CertificadoPlantillaViewer.tsx` — Leer datos reales del certificado generado
Reescribir el `useEffect` (líneas 33-85) para:
- Buscar el certificado existente en `lms_certificados` usando el `inscripcionId`
- Si existe, usar `datos_certificado.fecha_completado`, `datos_certificado.titulo_curso`, y `codigo_verificacion` del registro almacenado
- Si NO existe (certificado aún no generado), usar `fecha_completado` de la inscripción (no `new Date()`)
- Nunca usar `inscripcionId.slice(0,8)` como código — usar el código real o mostrar "Pendiente"

### 4. `ContentRenderer.tsx` — Agregar prop `cursoTitulo`
Agregar `cursoTitulo?: string` a la interfaz y pasarlo al `CertificadoPlantillaViewer`.

### Resumen de archivos a modificar:
- `src/components/lms/CertificadoPlantillaViewer.tsx` — Leer datos del certificado real desde DB
- `src/components/lms/ContentRenderer.tsx` — Agregar y pasar prop `cursoTitulo`
- `src/pages/LMS/CursoViewer.tsx` — Pasar `curso.titulo` al `ContentRenderer`

