

# Modulo de Incidentes Operativos en Monitoreo

## Objetivo

Mover el sistema de incidentes operativos al modulo de Monitoreo como un 4to tab, transformar el formulario simple en un formulario robusto con cronologia detallada del evento, persistencia robusta (useFormPersistence nivel "robust"), estados parciales (borrador/en_investigacion/cerrado), y exportacion a PDF.

---

## Arquitectura

### 1. Nuevo tab "Incidentes" en MonitoringPage

Agregar un cuarto tab al sistema de tabs existente en `MonitoringPage.tsx`:
- Posicionamiento | Checklists | Adopcion Digital | **Incidentes**
- Badge con conteo de incidentes abiertos

### 2. Tabla de cronologia del evento (nueva migracion)

Crear tabla `incidente_cronologia` para registrar la linea de tiempo detallada de cada incidente:

| Campo | Tipo | Descripcion |
|---|---|---|
| id | UUID PK | |
| incidente_id | UUID FK -> incidentes_operativos | |
| timestamp | TIMESTAMPTZ | Momento del evento en la cronologia |
| tipo_entrada | TEXT | 'deteccion', 'notificacion', 'accion', 'escalacion', 'evidencia', 'resolucion', 'nota' |
| descripcion | TEXT | Detalle de lo ocurrido |
| autor_id | UUID FK -> auth.users | Quien registra |
| created_at | TIMESTAMPTZ | |

Tambien agregar campo `estado` con valor 'borrador' a los estados existentes de `incidentes_operativos`:
- borrador -> abierto -> en_investigacion -> resuelto -> cerrado

### 3. Componentes nuevos

#### `src/components/monitoring/incidents/IncidentListPanel.tsx`
- Lista de incidentes con filtros por estado y severidad
- Boton "Nuevo Reporte de Incidente" que abre el formulario completo
- Indicador de borradores pendientes
- KPIs resumen: abiertos, en investigacion, cerrados ultimo mes

#### `src/components/monitoring/incidents/IncidentReportForm.tsx`
- Formulario completo que NO es un dialog sino una vista expandida dentro del tab
- **Persistencia robusta** via `useFormPersistence` nivel "robust" con key `incident-report-{id}`
- **No redirige** al guardar parcialmente - permanece en la misma vista
- Secciones:
  1. **Datos generales**: tipo, severidad, zona, cliente, fecha/hora del incidente
  2. **Cronologia del evento**: timeline vertical donde se agregan entradas cronologicas (hora + tipo + descripcion). Cada entrada se guarda individualmente en `incidente_cronologia`
  3. **Controles y atribucion**: controles activos, efectividad, atribuible a operacion
  4. **Resolucion** (solo cuando se cierra): notas de resolucion, fecha
- Boton "Guardar borrador" (estado='borrador') y "Registrar" (estado='abierto')
- Al editar un incidente existente, carga datos + cronologia

#### `src/components/monitoring/incidents/IncidentTimeline.tsx`
- Componente visual de cronologia vertical
- Cada entrada muestra: hora, tipo (con icono/color), descripcion, autor
- Formulario inline para agregar nueva entrada a la cronologia
- Tipos de entrada con iconos: deteccion (ojo), notificacion (campana), accion (rayo), escalacion (flecha arriba), evidencia (camara), resolucion (check), nota (mensaje)

#### `src/components/monitoring/incidents/IncidentPDFExporter.tsx`
- Genera PDF con jsPDF usando el design system corporativo existente (colores, fuentes del historicalReportPdfExporter)
- Contenido del PDF:
  - Header: "Reporte de Incidente Operativo" + ID + fecha
  - Datos generales en tabla
  - Cronologia completa del evento en formato timeline
  - Seccion de controles y atribucion
  - Seccion de resolucion (si aplica)
  - Footer con pagina y fecha de generacion

### 4. Hook `useIncidentesOperativos.ts`
- Query para listar incidentes con filtros
- Mutation para crear/actualizar incidente
- Query para cronologia de un incidente
- Mutation para agregar entrada de cronologia
- Resumen (conteos por estado)

### 5. Integracion con StarMap

Mantener el `IncidentPanel` en StarMapPage como vista resumida de solo lectura que muestra los ultimos incidentes, pero el formulario completo de captura vive en Monitoreo.

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/migrations/xxx.sql` | Nueva tabla `incidente_cronologia` + ALTER estado en incidentes_operativos |
| `src/hooks/useIncidentesOperativos.ts` | Nuevo hook con queries y mutations |
| `src/components/monitoring/incidents/IncidentListPanel.tsx` | Nuevo - lista con filtros |
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | Nuevo - formulario robusto |
| `src/components/monitoring/incidents/IncidentTimeline.tsx` | Nuevo - cronologia visual |
| `src/components/monitoring/incidents/IncidentPDFExporter.ts` | Nuevo - exportacion PDF |
| `src/components/monitoring/incidents/index.ts` | Barrel export |
| `src/pages/Monitoring/MonitoringPage.tsx` | Agregar tab "Incidentes" |
| `src/components/starmap/IncidentPanel.tsx` | Simplificar a vista de solo lectura |

---

## Persistencia robusta

- Usa `useFormPersistence` con `level: 'robust'` y `ttl: 72h`
- El formulario persiste en localStorage + sessionStorage
- `DraftRestoreBanner` aparece al volver al formulario con datos pendientes
- `DraftIndicator` muestra el estado de guardado automatico
- El formulario NO se limpia al guardar borrador parcial
- La navegacion fuera del modulo no pierde datos

## Flujo de uso

1. Usuario va a Monitoreo > tab Incidentes
2. Clic "Nuevo Reporte" -> se muestra formulario expandido en el tab
3. Llena datos generales y va agregando entradas a la cronologia conforme recopila informacion
4. Puede guardar como "Borrador" en cualquier momento
5. Si navega fuera y regresa, el borrador se restaura automaticamente
6. Cuando tiene toda la informacion, clic "Registrar" (estado pasa a abierto)
7. Desde la lista puede reabrir cualquier incidente para agregar cronologia o cerrar
8. Boton "Exportar PDF" genera el reporte completo

