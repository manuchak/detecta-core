

# Plan Integral: Captura Movil de Evidencias + Optimizacion UI Movil para Supply

## Resumen ejecutivo

Este plan combina dos necesidades del equipo de Supply en una sola iteracion:
1. **Componente reutilizable de captura de fotos** desde movil (tech del portal custodio)
2. **Optimizacion de UI movil** en las pantallas que usan las chicas para evaluar candidatos

El resultado: las usuarias de Supply podran abrir la app desde su celular, navegar facilmente entre candidatos y evaluaciones, y capturar evidencia fisica (toxicologico, Midot, etc.) directo con la camara.

---

## Parte 1: Componente Reutilizable de Captura Movil

### Archivos nuevos

| Archivo | Descripcion |
|---------|-------------|
| `src/components/shared/EvidenceCapture.tsx` | Componente de captura con camara directa, compresion Canvas, preview Base64, upload a Storage |
| `src/components/shared/EvidenceThumbnail.tsx` | Thumbnail con acciones: ver en grande, eliminar, reemplazar |

### Comportamiento del componente EvidenceCapture

- **En movil**: Muestra boton "Tomar Foto" que usa `document.createElement('input')` dinamico con `capture="environment"` (patron probado del portal custodio que evita problemas en Android WebViews)
- **En desktop**: Muestra zona de drag-and-drop + boton "Seleccionar archivo"
- **Compresion**: Canvas API (1920x1080, calidad 0.7) - reduce ~80% del peso
- **Preview**: Base64 via FileReader (compatible con WebViews)
- **Upload**: Sube a bucket `candidato-documentos` (ya existe y es publico) con patron Verify-Before-Commit
- **Props**: `bucket`, `storagePath`, `maxPhotos`, `existingUrls`, `onPhotosChange`, `label`, `captureOnly`

### Integracion en ToxicologyResultForm

- Agregar seccion "Evidencia del resultado" con `EvidenceCapture` apuntando a `candidato-documentos/toxicologia/{candidatoId}`
- Al guardar, incluir las URLs en `archivo_url` del registro (la columna ya existe en `evaluaciones_toxicologicas`)
- No se necesitan migraciones - el campo `archivo_url` ya existe en la tabla

### Integracion en DocumentUploadDialog

- Reemplazar el input estatico (`id="file-input"`) con el patron dinamico `createElement` para compatibilidad movil
- Usar `useIsMobile()` para alternar entre modo camara directa y drag-and-drop
- Mantener drag-and-drop para desktop

### Hook useEvaluacionesToxicologicas

- El mutation `useCreateToxicologia` ya acepta `archivo_url` en `CreateToxicologiaData` - no necesita cambios

---

## Parte 2: Optimizacion UI Movil

### 2.1 CandidateEvaluationPanel - Tabs scrolleables

**Problema**: 10 tabs en `grid-cols-10` = cada tab tiene ~39px en movil, imposible de tocar

**Solucion**:
- Cambiar `grid grid-cols-10` por `flex overflow-x-auto` con scroll horizontal
- Cada tab con `min-w-[70px]` para touch target adecuado
- Labels siempre visibles (abreviados): "Entrevista", "Psico", "Toxico", "Refs", "Riesgo", "Docs", "Contratos", "Capacitacion", "Instalacion", "Historial"
- Dialog: agregar clases responsivas `w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-6xl` para ser full-screen en movil

### 2.2 ImprovedLeadCard - Layout responsivo

**Problema**: Avatar + nombre + badges + botones de accion compiten por espacio horizontal en <400px

**Solucion**:
- Mantener layout horizontal en desktop
- En movil (`<sm`): apilar info arriba, botones abajo como fila con `flex-wrap`
- Botones de accion con `w-full sm:w-auto` para ser tactiles en movil
- Email truncado con tooltip en lugar de cortar visualmente

### 2.3 LeadCard (legacy) - Misma optimizacion

- Apilar la seccion de informacion y acciones verticalmente en movil
- Botones full-width en pantallas < sm

### 2.4 EvaluacionesPage - Vista card en movil

**Problema**: La lista de candidatos es una tabla horizontal que no escala en movil

**Solucion**:
- Usar `useIsMobile()` para detectar viewport
- En movil: cards apiladas con nombre, badges de estado y boton "Evaluar"
- Barra de busqueda full-width en movil
- Titulo y descripcion con tamano reducido en movil

### 2.5 Formularios tactiles (ToxicologyResultForm, DocumentUploadDialog)

- Radio buttons con padding `p-4` (min 44px touch target)
- Inputs con `h-12` en movil
- Botones de accion `w-full` en movil con `h-12`
- Dialog con `sm:max-w-md` (full-width en movil sin padding excesivo)

---

## Detalle tecnico: Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| **NUEVO** `src/components/shared/EvidenceCapture.tsx` | Componente de captura movil con compresion y upload |
| **NUEVO** `src/components/shared/EvidenceThumbnail.tsx` | Thumbnail con acciones |
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | Tabs scrolleables + dialog responsive |
| `src/components/recruitment/toxicology/ToxicologyResultForm.tsx` | Agregar EvidenceCapture + touch targets |
| `src/components/recruitment/documents/DocumentUploadDialog.tsx` | Patron dinamico createElement + deteccion movil |
| `src/components/leads/approval/ImprovedLeadCard.tsx` | Layout apilado en movil |
| `src/components/leads/approval/LeadCard.tsx` | Layout apilado en movil |
| `src/pages/Leads/EvaluacionesPage.tsx` | Vista card en movil + busqueda responsive |

## Lo que NO se toca

- Backend / migraciones de BD (todo ya existe)
- Flujo de aprobacion, SIERCP, liberacion
- Portal custodio y sus componentes de camara
- Logica de hooks y mutations existentes
- Bucket de storage (ya existe, ya es publico)

