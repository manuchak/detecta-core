

# Plan: Workflow Completo de Cartera y Touchpoints

## Diagnostico del Estado Actual

Tras analizar el modulo completo, se identificaron las siguientes brechas criticas que hacen el flujo confuso para los usuarios:

### Brechas Identificadas

| Area | Problema | Impacto en UX |
|------|----------|---------------|
| Asignacion CSM | Solo existe `useAssignCSM` pero no hay UI para asignarlos masiva o individualmente desde Cartera | El campo "CSM" en la tabla muestra "Sin asignar" sin forma de corregirlo in-situ |
| Touchpoint Lifecycle | No hay estado (pendiente/completado) ni forma de marcar un seguimiento como realizado | El usuario crea touchpoints pero no puede cerrar el ciclo |
| Touchpoint List | Solo lectura, sin boton "Nuevo", sin edicion, sin accion sobre seguimientos vencidos | El analista debe ir a Cartera para crear touchpoints, flujo no intuitivo |
| Perfil de Cliente | Muestra touchpoints como lista plana, sin acciones ni contexto de seguimiento | No se puede actuar desde el perfil del cliente |
| Playbooks | Ejecuta solo para el primer cliente de la etapa, sin seleccion ni confirmacion | Accion automatica sin control del usuario |
| Conexion entre vistas | No hay navegacion directa entre touchpoint vencido -> cliente -> accion | El usuario debe hacer clicks manuales para conectar contextos |

### Mejores Practicas de la Industria (Gainsight/Totango/ChurnZero)

Basado en la investigacion, los patrones que aplican directamente a este sistema:

1. **"Task-based Touchpoints"**: Los touchpoints deben ser tareas con estado (abierto -> completado/reprogramado), no registros planos. Totango los llama "SuccessPlays" y siempre tienen un resultado esperado.

2. **"Contextual Actions"**: Toda accion disponible debe ser ejecutable desde donde el usuario esta (inline editing), no forzar navegacion a otra vista. ChurnZero usa "action sidebars" que aparecen sobre la vista actual.

3. **"Portfolio-First View"**: La tabla de cartera es el centro de operaciones. Asignacion, touchpoints y alertas deben ser operables directamente desde esta vista con un patron de "click to expand" o "slide-over panel".

4. **"Follow-up Engine"**: Los seguimientos vencidos deben ser la primera cosa visible, con accion de un click para completar o reprogramar.

---

## Solucion Propuesta

### Fase 1: Touchpoint Lifecycle (Columna `estado`)

**Objetivo**: Convertir touchpoints de registros planos a tareas con ciclo de vida.

**Cambios en BD**:
- Agregar columna `estado` a `cs_touchpoints` con valores: `pendiente`, `completado`, `cancelado` (default: `completado` para los existentes, `pendiente` cuando hay `siguiente_accion`)

**Archivos a modificar**:
- `src/hooks/useCSTouchpoints.ts`: Agregar `estado` al tipo, crear `useCompleteTouchpoint` mutation, crear `useRescheduleTouchpoint` mutation
- `src/integrations/supabase/types.ts`: Se regenera automaticamente

### Fase 2: Touchpoints List Accionable

**Objetivo**: Transformar la lista de touchpoints de solo-lectura a centro de operaciones.

**Archivos a crear/modificar**:
- `src/pages/CustomerSuccess/components/CSTouchpointsList.tsx`: Rediseno completo con:
  - Boton "Nuevo Touchpoint" en header con modal completo (selector de cliente)
  - Tabs: "Pendientes" | "Vencidos" | "Historial"
  - Cada fila con acciones inline: "Completar" (un click), "Reprogramar" (date picker), "Ver cliente"
  - Filas vencidas con highlighting y accion prioritaria
  - Click en nombre de cliente abre el perfil

**Patron UX**: Vista tipo "Task Inbox" donde los pendientes/vencidos son lo primero.

```text
+--------------------------------------------------+
| [Nuevo Touchpoint]              [Filtros]         |
|--------------------------------------------------|
| Pendientes (3) | Vencidos (2) | Historial        |
|--------------------------------------------------|
| ! BIRKENSTOCK - Llamar a Juan   Vence: 15/02     |
|   [Completar]  [Reprogramar]   [Ver cliente ->]  |
|--------------------------------------------------|
| ! SERVAL - Enviar cotizacion    Vencio: 10/02    |
|   [Completar]  [Reprogramar]   [Ver cliente ->]  |
+--------------------------------------------------+
```

### Fase 3: Asignacion CSM desde Cartera

**Objetivo**: Permitir asignar/reasignar CSM directamente desde la tabla de cartera.

**Archivos a modificar**:
- `src/pages/CustomerSuccess/components/CSCartera.tsx`:
  - Columna CSM: Click inline abre un `Select` con la lista de CSMs (usando `useCSMOptions`)
  - Boton de "Asignacion masiva": Seleccionar multiples clientes y asignar CSM en batch
  - Indicador visual: clientes "Sin asignar" con badge de alerta

**Patron UX**: Edicion inline tipo spreadsheet para la columna CSM.

```text
| Cliente      | CSM                    | ...  |
|-------------|------------------------|------|
| BIRKENSTOCK | [v] Maria Lopez        | ...  |
| SERVAL      | [!] Sin asignar [+]    | ...  |
| FLEXI       | [v] Carlos Ramirez     | ...  |
```

### Fase 4: Panel de Cliente Enriquecido

**Objetivo**: Hacer el perfil modal del cliente accionable, no solo informativo.

**Archivos a modificar**:
- `src/pages/CustomerSuccess/components/CSClienteProfileModal.tsx`:
  - Tab "Touchpoints": Agregar boton "Nuevo Touchpoint" dentro del tab
  - Cada touchpoint: Mostrar estado con badge de color y acciones (completar/reprogramar)
  - Seguimientos pendientes: Destacarlos con borde amarillo/rojo segun vencimiento
  - Boton "Asignar CSM" visible en el header del modal si no tiene CSM

### Fase 5: Flujo Conectado y Navegacion Contextual

**Objetivo**: Conectar todas las vistas para que el usuario nunca se pierda.

**Cambios**:
- Desde KPI "Seg. Pendientes" en Panorama: Click navega a Operativo > Touchpoints > tab "Vencidos"
- Desde alerta en `CSAlertsFeed`: Click en alerta de tipo "sin_contacto_30d" abre el perfil con tab Touchpoints pre-seleccionado
- Desde tabla Cartera: Click en "Dias s/c" de un cliente abre modal con el touchpoint mas reciente visible
- Desde Playbooks: "Ejecutar" muestra un mini-selector de clientes de la etapa antes de crear el touchpoint

---

## Resumen de Archivos Afectados

| Archivo | Tipo de Cambio |
|---------|---------------|
| `cs_touchpoints` (BD) | Agregar columna `estado` |
| `src/hooks/useCSTouchpoints.ts` | Agregar mutations: complete, reschedule, update |
| `src/pages/CustomerSuccess/components/CSTouchpointsList.tsx` | Rediseno completo con tabs y acciones |
| `src/pages/CustomerSuccess/components/CSCartera.tsx` | Inline CSM assignment + indicadores |
| `src/pages/CustomerSuccess/components/CSClienteProfileModal.tsx` | Touchpoints accionables + asignacion CSM |
| `src/pages/CustomerSuccess/components/CSPlaybooks.tsx` | Selector de cliente antes de ejecutar |
| `src/pages/CustomerSuccess/components/CSPanorama.tsx` | Navegacion contextual desde KPIs |
| `src/pages/CustomerSuccess/components/CSAlertsFeed.tsx` | Deep-links a touchpoints |
| `src/hooks/useAssignCSM.ts` | Agregar mutation para asignacion masiva |

## Secuencia de Implementacion

Se recomienda implementar en orden Fase 1 -> 2 -> 3 -> 4 -> 5, ya que cada fase construye sobre la anterior. Las fases 3 y 4 pueden ejecutarse en paralelo.

### Notas Tecnicas

- La columna `estado` en `cs_touchpoints` usara un migration SQL: `ALTER TABLE cs_touchpoints ADD COLUMN estado text NOT NULL DEFAULT 'completado'` y luego actualizar registros con `siguiente_accion IS NOT NULL AND fecha_siguiente_accion >= NOW()` a `pendiente`.
- La edicion inline de CSM usa el pattern existente de `useAssignCSM` que ya hace `update` a `pc_clientes.csm_asignado`.
- Los tabs de touchpoints usan el componente `Tabs` de Radix ya existente en el proyecto.
- No se requieren edge functions nuevas; toda la logica es frontend + queries directas a Supabase.

