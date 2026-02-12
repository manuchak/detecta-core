

## Supply Pipeline Command Center - Plan Integral Actualizado

### Resumen de Requisitos Confirmados

1. **Armados/Abordos**: Pasan por el MISMO pipeline que custodios (Aprobaciones -> Evaluaciones -> Liberacion)
2. **Midot**: Se sube el PDF del reporte Y se capturan scores clave para semaforo automatico
3. **GPS**: Se omite como requisito durante entrenamiento; se programa despues de iniciar operaciones

---

### Brechas Identificadas vs. Lo Que Existe

```text
MODULO              | EXISTE HOY                    | FALTA
--------------------|-------------------------------|----------------------------------
Referencias         | ReferencesTab con form y       | Solo captura texto, no sube
                    | validacion manual              | evidencia/PDF de llamadas
Toxicologicos       | ToxicologyResultForm con       | Funcional, tiene EvidenceCapture
                    | EvidenceCapture (fotos)         | para subir fotos del resultado
Psicometricos SIERCP| Evaluacion completa + AI       | OK - sistema propio maduro
Midot               | Solo mencionado en docs        | NO EXISTE modulo de captura
                    | y arquitectura                 | ni subida de reportes
Pipeline Armados    | armados_operativos existe      | NO hay candidatos_armados ni
                    | pero sin flujo de recruitment   | pipeline de evaluacion
GPS flexible        | InstallationTab requiere       | No permite omitir/postergar
                    | como paso pre-liberacion        | durante entrenamiento
```

---

### FASE 1: Navegacion Unificada del Pipeline (Prioridad Critica)

#### 1.1 Sidebar - Agregar Evaluaciones y Liberacion

**Archivo:** `src/components/dashboard/Sidebar.tsx`

Agregar 2 sub-items al grupo "Candidatos":

| Sub-item | Ruta | Icono | Roles |
|---|---|---|---|
| Evaluaciones | /leads/evaluaciones | ClipboardCheck | supply_admin, supply_lead, supply, coordinador_operaciones, admin, owner |
| Liberacion | /leads/liberacion | Rocket | supply_admin, supply_lead, coordinador_operaciones, admin, owner |

#### 1.2 Breadcrumb de Pipeline con Conteos en Vivo

**Archivo nuevo:** `src/components/leads/supply/SupplyPipelineBreadcrumb.tsx`

Steps: Aprobaciones -> Evaluaciones -> Liberacion -> Operativos (informativo)

Conteos desde:
- Aprobaciones: leads con estado aprobado pendientes de proceso
- Evaluaciones: candidatos_custodios en estados de evaluacion
- Liberacion: custodio_liberacion activas
- Operativos: custodios_operativos activos (solo lectura)

**Archivo nuevo:** `src/hooks/useSupplyPipelineCounts.ts`

Hook con staleTime 30s, queries SELECT count independientes con fallback a "-" si falla.

#### 1.3 Integracion en las 3 paginas

Agregar breadcrumb en header de:
- `src/pages/Leads/LeadApprovals.tsx`
- `src/pages/Leads/EvaluacionesPage.tsx`
- `src/pages/Leads/LiberacionPage.tsx`

---

### FASE 2: Modulo Midot - Captura de Scores + PDF (Nuevo)

#### 2.1 Migracion de Base de Datos

**Nueva tabla:** `evaluaciones_midot`

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid | PK |
| candidato_id | uuid | FK a candidatos_custodios |
| evaluador_id | uuid | FK al usuario que registra |
| score_integridad | numeric | Score de integridad (0-100) |
| score_honestidad | numeric | Score de honestidad (0-100) |
| score_lealtad | numeric | Score de lealtad (0-100) |
| score_global | numeric | Score global calculado |
| resultado_semaforo | varchar | verde / ambar / rojo |
| reporte_pdf_url | text | URL del PDF en storage |
| notas | text | Observaciones del evaluador |
| fecha_evaluacion | timestamptz | Fecha del examen |
| created_at | timestamptz | |

Semaforo: Verde >= 70, Ambar 50-69, Rojo < 50 (misma logica que SIERCP)

#### 2.2 Componentes de UI

**Archivo nuevo:** `src/components/recruitment/midot/MidotEvaluationTab.tsx`

Tab que muestra:
- Estado actual (sin evaluacion / en proceso / completada)
- Formulario de captura de scores con sliders o inputs numericos
- Upload de PDF del reporte via EvidenceCapture (bucket: candidato-documentos, path: midot/{candidatoId})
- Semaforo visual resultado
- Historial de evaluaciones previas

**Archivo nuevo:** `src/components/recruitment/midot/MidotResultForm.tsx`

Dialog/form con:
- Inputs para scores individuales (integridad, honestidad, lealtad)
- Score global calculado automaticamente
- Upload de PDF obligatorio
- Fecha del examen
- Notas del evaluador
- Persistencia con useFormPersistence (misma arquitectura que ToxicologyResultForm)

**Archivo nuevo:** `src/components/recruitment/midot/MidotBadge.tsx`

Badge de semaforo compacto para mostrar en la lista de tabs del CandidateEvaluationPanel.

**Archivo nuevo:** `src/hooks/useEvaluacionesMidot.ts`

Hook CRUD con queries, mutaciones, y helpers (useLatestMidot, useCreateMidot).

#### 2.3 Integracion en CandidateEvaluationPanel

**Archivo:** `src/components/recruitment/CandidateEvaluationPanel.tsx`

Agregar tab "Midot" despues de "Psico" (SIERCP):

```text
Entrevista | Psico (SIERCP) | Midot | Toxico | Refs | Riesgo | Docs | Contratos | Capacitacion | Instalacion | Historial
```

Tab con icono ShieldCheck y MidotBadge de semaforo.

---

### FASE 3: Pipeline de Armados (Adaptar el Flujo Existente)

#### 3.1 Tabla de Candidatos Armados

**Migracion:** Crear tabla `candidatos_armados` con estructura similar a `candidatos_custodios`:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid | PK |
| lead_id | uuid | FK al lead original |
| nombre | text | Nombre completo |
| telefono | text | |
| email | text | |
| tipo_armado | text | interno / externo |
| proveedor_id | uuid | FK si es externo |
| licencia_portacion | text | Numero de licencia |
| fecha_vencimiento_licencia | date | |
| estado_proceso | text | mismo enum que custodios |
| estado_detallado | text | |
| zona_preferida_id | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### 3.2 Adaptar Evaluaciones para Armados

El `CandidateEvaluationPanel` ya maneja evaluaciones genéricas por `candidatoId`. Lo que se necesita:

- En `EvaluacionesPage.tsx`: Agregar toggle/filtro "Custodios | Armados" que cambie la fuente de datos entre `candidatos_custodios` y `candidatos_armados`
- Los hooks de evaluacion (entrevistas, psicometricos, toxicologicos, referencias, Midot) ya usan `candidato_id` generico -- funcionan para ambos tipos sin cambios
- En la liberacion: agregar tipo de operativo para que fluya hacia `armados_operativos` en lugar de `custodios_operativos`

#### 3.3 Liberacion de Armados

**Archivo:** Migracion para tabla `armado_liberacion` (estructura similar a `custodio_liberacion`) o agregar columna `tipo_operativo` a `custodio_liberacion` para reutilizar la misma tabla.

La recomendacion es agregar `tipo_operativo` ('custodio' | 'armado') a la tabla existente `custodio_liberacion` para evitar duplicar toda la logica del checklist.

**Archivos a modificar:**
- `src/types/liberacion.ts`: Agregar campo `tipo_operativo`
- `src/hooks/useCustodioLiberacion.ts`: Filtrar por tipo
- `src/pages/Leads/LiberacionPage.tsx`: Toggle Custodios/Armados
- RPC `liberar_custodio_a_planeacion_v2`: Bifurcar insert a `custodios_operativos` o `armados_operativos` segun tipo

---

### FASE 4: GPS Flexible (Omitir durante Entrenamiento)

#### 4.1 Modificar Logica de GPS en Liberacion

**Archivo:** `src/components/liberacion/LiberacionChecklistModal.tsx`

Cambios:
- El paso de GPS deja de ser bloqueante para liberacion
- Agregar opcion "GPS pendiente - se programara post-entrenamiento"
- Cuando se selecciona esta opcion, se guarda `gps_pendiente: true` y `motivo_gps_pendiente: 'entrenamiento'`
- El custodio puede ser liberado sin GPS instalado
- Se crea un recordatorio/tarea pendiente para programar GPS despues

#### 4.2 Migracion

Agregar columnas a `custodio_liberacion`:

| Columna | Tipo |
|---|---|
| gps_pendiente | boolean default false |
| motivo_gps_pendiente | text |
| fecha_programacion_gps | date |

#### 4.3 Alerta Post-Liberacion

En el breadcrumb o dashboard, mostrar badge de alerta para custodios liberados que aun no tienen GPS instalado.

---

### FASE 5: Mejoras UX en Evaluaciones

#### 5.1 EvaluacionesPage como Centro de Accion

**Archivo:** `src/pages/Leads/EvaluacionesPage.tsx`

- Tab "Candidatos" como default
- Toggle "Custodios | Armados"
- Filtros rapidos por sub-estado (pills):
  - Todos | Entrevista pendiente | Psico pendientes | Midot pendiente | Toxico pendiente | Docs incompletos | Listos para liberar
- Cards con semaforo visual por evaluacion
- Badge urgente para candidatos con mas de 15 dias sin avance

#### 5.2 CandidateEvaluationPanel: Tabs Organizados

**Archivo:** `src/components/recruitment/CandidateEvaluationPanel.tsx`

Reorganizar en grupos logicos:

```text
EVALUACION CORE (obligatorio):
  1. Entrevista
  2. Riesgo
  3. Psicometricos (SIERCP)
  4. Midot
  5. Toxicologicos

DOCUMENTACION (obligatorio):
  6. Documentos
  7. Contratos
  8. Referencias

PREPARACION (pre-liberacion, flexible):
  9. Capacitacion
  10. Instalacion GPS (opcional)

INFO:
  11. Historial
```

- Progress bar en header del dialog: "7/10 completados"
- Labels visibles en movil (quitar `hidden sm:inline`)
- Boton "Listo para Liberar" cuando los grupos obligatorios estan completos

---

### FASE 6: Liberacion con Gates Inteligentes

#### 6.1 Sistema de Gates

**Archivo:** `src/components/liberacion/LiberacionChecklistModal.tsx`

Reemplazar `forzar: true` por defecto con validaciones:

**Gate ROJO (bloquea liberacion):**
- Toxicologico positivo
- INE/licencia faltante
- Sin entrevista registrada

**Gate AMARILLO (permite con justificacion escrita):**
- Midot ambar o no completado
- Psicometricos SIERCP ambar
- Capacitacion incompleta
- Referencias incompletas

**Gate VERDE (informativo, no bloquea):**
- GPS pendiente (ahora flexible)
- RFC faltante

#### 6.2 Sticky Footer

Boton "Liberar" y "Guardar" fijos en la parte inferior del modal para evitar scroll.

---

### FASE 7: Alertas de Envejecimiento

**Archivo nuevo:** `src/hooks/useSupplyPipelineAlerts.ts`

- 7 dias sin cambio: alerta amarilla
- 15 dias: alerta naranja
- 30 dias: alerta roja
- Calculo basado en `updated_at`
- Badge de alertas en el breadcrumb

---

### Archivos a Crear (Total: 8)

| Archivo | Proposito |
|---|---|
| `src/components/leads/supply/SupplyPipelineBreadcrumb.tsx` | Breadcrumb pipeline con conteos |
| `src/hooks/useSupplyPipelineCounts.ts` | Conteos en vivo por etapa |
| `src/hooks/useSupplyPipelineAlerts.ts` | Alertas de envejecimiento |
| `src/components/recruitment/midot/MidotEvaluationTab.tsx` | Tab de evaluacion Midot |
| `src/components/recruitment/midot/MidotResultForm.tsx` | Formulario captura scores + PDF |
| `src/components/recruitment/midot/MidotBadge.tsx` | Badge semaforo Midot |
| `src/hooks/useEvaluacionesMidot.ts` | Hook CRUD Midot |
| Migracion SQL | Tabla evaluaciones_midot + cols GPS flex + tipo_operativo |

### Archivos a Modificar (Total: 7)

| Archivo | Cambio | Complejidad |
|---|---|---|
| `src/components/dashboard/Sidebar.tsx` | +2 sub-items (Evaluaciones, Liberacion) | Baja |
| `src/pages/Leads/LeadApprovals.tsx` | +Breadcrumb | Baja |
| `src/pages/Leads/EvaluacionesPage.tsx` | Breadcrumb + toggle Custodios/Armados + filtros + tab default | Alta |
| `src/pages/Leads/LiberacionPage.tsx` | Breadcrumb + toggle tipo + responsive | Media |
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | +Tab Midot + reorganizar grupos + progress bar | Alta |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | Gates inteligentes + GPS flexible + sticky footer | Alta |
| `src/types/liberacion.ts` | +tipo_operativo + gps_pendiente | Baja |

### Orden de Implementacion por Batches

1. **Batch 1 - Navegacion**: Sidebar + Breadcrumb + Hook conteos (Fase 1)
2. **Batch 2 - Midot**: Migracion + Hook + Tab + Form + Badge (Fase 2)
3. **Batch 3 - Armados**: Migracion candidatos_armados + tipo_operativo + toggles (Fase 3)
4. **Batch 4 - GPS Flex**: Migracion cols + logica omision + alertas (Fase 4)
5. **Batch 5 - UX Evaluaciones**: Filtros + reorganizacion tabs + progress (Fase 5)
6. **Batch 6 - Gates**: Sistema de validacion + sticky footer (Fase 6)
7. **Batch 7 - Alertas**: Hook de envejecimiento + integracion breadcrumb (Fase 7)

### Principios de Seguridad

- RLS en evaluaciones_midot copiando politicas de evaluaciones_psicometricas
- RLS en candidatos_armados copiando politicas de candidatos_custodios
- Queries del breadcrumb son SELECT count (solo lectura)
- GPS flexible no elimina validacion, solo la posterga con trazabilidad
- Gates de liberacion se validan tanto en frontend como en el RPC (defense in depth)

