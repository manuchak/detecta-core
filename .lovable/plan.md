

# Blindar Flujo de Supply: Contratos Digitales, Capacitacion y Estudios Socioeconomicos

## Problema

El equipo de Supply no puede avanzar en la liberacion porque:
1. Los **contratos** (5 documentos legales) se manejan en fisico -- no hay forma de generarlos, firmarlos digitalmente y registrarlos dentro del sistema
2. La **capacitacion** requiere completar quizzes en linea, pero el equipo la imparte de forma presencial -- necesitan poder marcarla como completada manualmente
3. No se pueden **eliminar contratos** generados incorrectamente
4. No existe modulo de **estudios socioeconomicos** para evaluar el contexto del custodio

---

## Fase 1: Actualizar Plantillas de Contratos

### Nuevos tipos de contrato

Los 5 documentos subidos se mapean asi:

| Documento DOCX | Tipo en sistema | Nuevo? |
|---|---|---|
| Convenio de Confidencialidad | `confidencialidad` | Ya existe -- actualizar plantilla HTML |
| Aviso de Privacidad | `aviso_privacidad` | Ya existe -- actualizar plantilla HTML |
| Contrato Propietario de Vehiculo | `prestacion_servicios_propietario` | NUEVO |
| Contrato No Propietario | `prestacion_servicios_no_propietario` | NUEVO |
| Anexo GPS | `anexo_gps` | NUEVO |

### Cambios

**Migracion SQL:**
- Agregar los 3 nuevos valores al CHECK constraint de `tipo_contrato` en `contratos_candidato`
- Insertar las 5 plantillas HTML (contenido convertido de los DOCX) en `plantillas_contrato`
- Las plantillas usaran variables interpolables: `{{nombre_completo}}`, `{{curp}}`, `{{direccion}}`, `{{fecha_actual}}`, `{{marca_vehiculo}}`, `{{modelo_vehiculo}}`, `{{placas}}`, `{{numero_serie}}`, etc.

**`src/hooks/useContratosCandidato.ts`:**
- Actualizar `TipoContrato` con los 3 nuevos tipos
- Actualizar `CONTRATO_LABELS` con las etiquetas
- Actualizar `CONTRATOS_REQUERIDOS` para incluir los 5 contratos obligatorios
- Agregar mutacion `useEliminarContrato` para eliminar contratos mal subidos (con politica RLS para supply)
- Actualizar `getDatosInterpolacion` para incluir datos vehiculares

**`src/components/recruitment/contracts/ContractsTab.tsx`:**
- Agregar boton de eliminar junto a cada contrato no firmado
- Dialog de confirmacion antes de eliminar
- Logica condicional: mostrar contrato propietario o no propietario segun `vehiculo_propio` del candidato

**`src/components/recruitment/contracts/ContractGenerateDialog.tsx`:**
- Agregar campos de datos vehiculares cuando el tipo es `prestacion_servicios_propietario` o `anexo_gps`

---

## Fase 2: Capacitacion Manual por Supply

### Problema
El modulo de capacitacion actual requiere que el candidato complete quizzes online. Supply hace capacitacion presencial y necesita marcarla como completada manualmente.

### Cambios

**Migracion SQL:**
- Agregar columnas a `progreso_capacitacion`:
  - `completado_manual boolean DEFAULT false`
  - `completado_manual_por uuid REFERENCES auth.users`
  - `completado_manual_fecha timestamptz`
  - `completado_manual_notas text`

**`src/hooks/useCapacitacion.ts`:**
- Agregar mutacion `useMarcarCapacitacionManual` que marca todos los modulos como completados manualmente
- Actualizar `calcularProgresoGeneral` para considerar `completado_manual` como equivalente a quiz aprobado

**`src/components/leads/evaluaciones/TrainingTab.tsx`:**
- Agregar boton "Marcar como Completada (Presencial)" visible solo para roles supply
- Dialog con campo de notas y confirmacion
- Badge visual que distingue entre "Completada Online" y "Completada Presencial"

---

## Fase 3: Estudios Socioeconomicos

### Contexto
Los estudios socioeconomicos son investigaciones de campo sobre el entorno del candidato (vivienda, familia, referencias vecinales, situacion economica). Actualmente se hacen en papel o por proveedores externos.

### Modelo de datos

**Nueva tabla: `estudios_socioeconomicos`**
```text
- id uuid PK
- candidato_id uuid FK -> candidatos_custodios
- proveedor: 'interno' | 'externo'
- nombre_proveedor text (si externo)
- fecha_estudio date
- estado: 'pendiente' | 'en_proceso' | 'completado' | 'rechazado'
- resultado_general: 'favorable' | 'con_observaciones' | 'desfavorable'
- score_vivienda int (1-10)
- score_entorno int (1-10)
- score_familiar int (1-10)
- score_economico int (1-10)
- score_referencias int (1-10)
- score_global decimal (promedio)
- observaciones text
- recomendacion text
- archivo_url text (PDF del estudio completo)
- realizado_por uuid FK -> auth.users
- created_at, updated_at
```

**RLS:** Acceso para roles supply, supply_lead, supply_admin, admin, owner.

### UI

**Nuevo componente: `src/components/recruitment/socioeconomico/SocioeconomicoTab.tsx`**
- Formulario para registrar el estudio con los 5 scores (barras de 1-10)
- Semaforo visual basado en score_global: Verde (>=7), Ambar (5-6.9), Rojo (<5)
- Upload de PDF del estudio completo
- Historial de estudios previos si existen

**Nuevo badge: `SocioeconomicoBadge.tsx`**
- Indicador visual en el panel de evaluacion del candidato

**Integracion en `CandidateEvaluationPanel.tsx`:**
- Nueva pestana "Socioeconomico" con icono Home/Shield

---

## Fase 4: Integrar en Smart Gates de Liberacion

### Cambios en `LiberacionChecklistModal.tsx`

Agregar validaciones al gate system:

**Yellow gates (advertencia):**
- "Contratos no completados" -- si los contratos requeridos no estan todos firmados
- "Capacitacion no completada" -- si la capacitacion no esta marcada como completada (online o manual)
- "Estudio socioeconomico pendiente" -- si no hay estudio o esta en proceso

**Red gates (bloqueo):**
- "Estudio socioeconomico desfavorable" -- si el resultado es desfavorable

Esto requiere nuevos hooks en el modal para consultar el progreso de contratos, capacitacion y socioeconomico del candidato.

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| Nueva migracion SQL | Tipos contrato, plantillas HTML, tabla socioeconomicos, columnas capacitacion manual |
| `src/hooks/useContratosCandidato.ts` | Nuevos tipos, eliminar contrato, datos vehiculares |
| `src/hooks/useCapacitacion.ts` | Mutacion completado manual |
| `src/hooks/useEstudioSocioeconomico.ts` | NUEVO: CRUD completo |
| `src/components/recruitment/contracts/ContractsTab.tsx` | Boton eliminar, logica propietario/no-propietario |
| `src/components/recruitment/contracts/ContractGenerateDialog.tsx` | Campos vehiculares |
| `src/components/leads/evaluaciones/TrainingTab.tsx` | Boton completado manual |
| `src/components/recruitment/socioeconomico/SocioeconomicoTab.tsx` | NUEVO |
| `src/components/recruitment/socioeconomico/SocioeconomicoBadge.tsx` | NUEVO |
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | Agregar tab socioeconomico |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | Smart gates para contratos, capacitacion, socioeconomico |
| `src/integrations/supabase/types.ts` | Tipos generados |

## Orden de implementacion

1. Migracion SQL (todo junto)
2. Fase 1: Contratos (tipos + plantillas + eliminar + vehiculares)
3. Fase 2: Capacitacion manual
4. Fase 3: Estudios socioeconomicos
5. Fase 4: Smart gates actualizados

