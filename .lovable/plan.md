
# LMS: Dos Nuevos Tipos de Contenido — SCORM y Plantilla de Certificado

## Contexto

El modal "Nuevo Contenido" (imagen de referencia) ya maneja 6 tipos: video, documento, embed, texto, quiz e interactivo. Se agregaran dos tipos nuevos al mismo dropdown. La arquitectura sigue exactamente el mismo patron:

1. Nuevo valor en el tipo → nuevo formulario de configuracion en el modal → nuevo renderer en el viewer del curso.

---

## TIPO 1: SCORM

### Que es

SCORM (Sharable Content Object Reference Model) es el estándar de e-learning. Los archivos son paquetes ZIP que contienen un `imsmanifest.xml` + contenido HTML interactivo (generados por herramientas como Articulate, iSpring, Adobe Captivate).

### Como funciona

El admin sube el ZIP → se descomprime en storage → el alumno lo ve via `<iframe>` apuntando al `index.html` interno → el iframe envia mensajes `postMessage` con el resultado (completado/puntuacion) → el LMS los captura y marca el contenido como completado.

### Cambios necesarios

**Base de datos (migracion):**
- Alterar el CHECK constraint de `lms_contenidos.tipo` para incluir `'scorm'`
- Crear bucket `lms-scorm` en storage (separado de `lms-media`) con politicas admin-only para subida y publico para lectura

**Tipos TypeScript (`src/types/lms.ts`):**
- Agregar `'scorm'` a `TipoContenido`
- Agregar `ScormContent` interface: `{ package_url: string, entry_point: string, version: 'SCORM_1.2' | 'SCORM_2004', width?: number, height?: number }`
- Agregar `'scorm'` a `LMS_TIPOS_CONTENIDO` (con icono `Package`)

**Formulario admin (`LMSContenidoForm.tsx`):**
- Nuevo estado: `scormPackageUrl`, `scormEntryPoint`, `scormVersion`
- Nuevo panel de contenido SCORM: uploader de ZIP (usa el bucket `lms-scorm`) + campo para el entry point (ruta al `index.html` dentro del paquete) + selector de version SCORM + preview height
- El uploader detecta el archivo ZIP y genera la URL publica del paquete
- Icono: `Package` de lucide-react

**Renderer (`SCORMViewer.tsx` nuevo):**
- Componente que renderiza un `<iframe>` con la URL del entry point
- Listener de `window.postMessage` para capturar eventos SCORM (`cmi.completion_status`, `cmi.success_status`, `cmi.score.raw`) y traducirlos a llamadas `onComplete()`
- Maneja tanto SCORM 1.2 (`LMSCommit`, `LMSSetValue`) como SCORM 2004 (`Commit`, `SetValue`)
- Boton manual "Marcar como completado" como fallback

**ContentRenderer.tsx:** Agregar case `'scorm'` → `<SCORMViewer>`

---

## TIPO 2: Plantilla de Certificado

### Que es

Un tipo de contenido especial que actua como "constancia intermedia" dentro de un modulo (no el certificado de curso final que ya existe). Permite que el admin seleccione una de las plantillas de `lms_certificados_plantillas` para mostrársela al alumno como contenido de curso, y el alumno puede descargarlo en PDF.

### Diferencia con el certificado de fin de curso

| | Certificado de curso (ya existe) | Tipo "certificado" nuevo |
|---|---|---|
| Cuando se genera | Al completar el 100% del curso | Es un contenido de modulo |
| Donde se ve | En "Mis Certificados" | Dentro del viewer del curso |
| Proposito | Acreditacion final | Constancia intermedia / reconocimiento |

### Cambios necesarios

**Base de datos (migracion):**
- Alterar CHECK constraint de `lms_contenidos.tipo` para incluir `'certificado_plantilla'`
- Agregar politica RLS admin para CRUD completo en `lms_certificados_plantillas` (actualmente solo hay SELECT publico)
- Agregar politica RLS admin para administrar plantillas

**Tipos TypeScript (`src/types/lms.ts`):**
- Agregar `'certificado_plantilla'` a `TipoContenido`
- Agregar `CertificadoPlantillaContent` interface: `{ plantilla_id: string, plantilla_nombre: string, personalizar_variables?: Record<string, string> }`
- Agregar a `LMS_TIPOS_CONTENIDO` (icono `Award`)

**Formulario admin (`LMSContenidoForm.tsx`):**
- Nuevo estado: `certificadoPlantillaId`
- Nuevo hook: `useLMSPlantillas()` para leer `lms_certificados_plantillas`
- Panel de contenido: dropdown con las plantillas disponibles + preview HTML de la plantilla seleccionada con variables de ejemplo sustituidas (`{{nombre_usuario}}` → "Juan Pérez", etc.)

**Renderer (`CertificadoPlantillaViewer.tsx` nuevo):**
- Renderiza la plantilla HTML con los datos reales del usuario logueado (nombre, fecha, titulo del curso)
- Boton "Descargar PDF" que usa `jsPDF` + `html2canvas` (ya instalados en el proyecto) para generar el PDF de la constancia
- Boton "Marcar como visto" que llama a `onComplete()`
- Los datos del usuario se obtienen del contexto de inscripcion (ya disponible en `CursoViewer`)

**ContentRenderer.tsx:** Agregar case `'certificado_plantilla'` → `<CertificadoPlantillaViewer>`

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/migrations/XXXX_lms_scorm_certificado.sql` | Nueva migracion: ALTER CHECK + bucket scorm + RLS |
| `src/types/lms.ts` | Agregar tipos SCORM y CertificadoPlantilla |
| `src/components/lms/admin/LMSContenidoForm.tsx` | Paneles SCORM y Certificado en el formulario |
| `src/components/lms/SCORMViewer.tsx` | Nuevo — renderer iframe SCORM con postMessage |
| `src/components/lms/CertificadoPlantillaViewer.tsx` | Nuevo — renderer PDF descargable |
| `src/components/lms/ContentRenderer.tsx` | Agregar los 2 nuevos cases |
| `src/hooks/lms/useLMSPlantillas.ts` | Nuevo — hook para leer plantillas de certificado |

---

## Consideraciones tecnicas

- El bucket SCORM es separado de `lms-media` porque los ZIPs son estructuralmente distintos y pueden ser muy grandes (hasta 200MB). Las politicas se limitan a admins y `capacitacion_admin`.
- Para la generacion de PDF del certificado, se usa `html2canvas` + `jsPDF` (ya instalados) sobre el elemento renderizado en el DOM — misma estrategia que en otros reportes del proyecto.
- El SCORM viewer no requiere libreria externa — la comunicacion via `postMessage` es nativa del browser y cubre el 95% de paquetes SCORM modernos.
- El CHECK constraint se modifica con `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT` en la migracion.
