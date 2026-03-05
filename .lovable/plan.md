

# Command Center C4 — Diagnóstico y Rediseño

## Problemas detectados

### 1. Nadie aparece "en turno" (bug crítico)
La lógica actual de `en_turno` es **circular**: se determina revisando si el monitorista tiene asignaciones activas en `bitacora_asignaciones_monitorista` con `inicio_turno` en las últimas 8h. Pero la tabla está **vacía** — nadie ha usado el Command Center para asignar servicios todavía. Resultado: 0 en turno, todos aparecen como "sin turno activo".

**Evidencia real de hoy:**
- Abelardo Rodríguez: 50 eventos registrados hoy
- David Corona Rojo: 36 eventos registrados hoy
- Ambos están activamente monitoreando, pero el sistema no los reconoce

### 2. Los 15 "sin asignar" son falsos
Los servicios ya tienen `hora_inicio_real` (los monitoristas ya los iniciaron en la Bitácora). No están "sin asignar" — están en operación sin registro formal de quién los monitorea.

### 3. UX del coordinador: no hay flujo natural
El coordinador llega y ve una pantalla inerte. No hay forma de: (a) saber quién está trabajando ahora, (b) activar un turno, (c) ver actividad real.

## Plan de corrección

### Cambio 1: `en_turno` derivado de actividad real (no de asignaciones)

Reemplazar la lógica circular. Un monitorista está "en turno" si:
- Tiene eventos registrados (`servicio_eventos_ruta.registrado_por`) en las últimas 2 horas, **O**
- El coordinador lo marcó manualmente como "en turno"

Para esto, agregar un query que detecte actividad reciente por monitorista y usarlo como señal primaria.

### Cambio 2: Auto-detección de quién monitorea qué servicio

Si no hay asignación formal pero un monitorista está registrando eventos en un servicio, el sistema debe inferir esa relación y mostrarla. Esto resuelve el "15 sin asignar" falso.

Lógica: consultar `servicio_eventos_ruta` agrupando por `servicio_id` y `registrado_por` para los servicios activos de hoy. El último `registrado_por` de cada servicio = monitorista implícito.

### Cambio 3: Botón "Fichar Turno" para monitoristas

Agregar una acción simple en el hook para que el coordinador pueda marcar quién está en turno sin necesidad de asignar servicios primero. Insertar un registro en `bitacora_asignaciones_monitorista` con un `servicio_id` sentinel o agregar una columna `en_turno_manual` a la lógica.

Enfoque más simple: usar la actividad real como fuente y el botón de "Activar/Desactivar turno" como override visual (sin nueva tabla — solo un estado en el query derivado).

### Cambio 4: UI mejorada del Command Center

- Columna izquierda: monitoristas con estado derivado de actividad real (verde pulsante = eventos en última hora, amarillo = última hora sin actividad, gris = sin actividad hoy)
- Cada monitorista muestra los servicios que está monitoreando (inferidos de eventos) + los asignados formalmente
- Columna derecha: solo servicios verdaderamente sin cobertura (sin eventos recientes de ningún monitorista)
- El botón "Auto-distribuir" solo aplica a servicios genuinamente sin cobertura

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useMonitoristaAssignment.ts` | Agregar query de actividad reciente por monitorista desde `servicio_eventos_ruta`. Reemplazar lógica de `en_turno`. Agregar `inferredAssignments` (servicio→monitorista por actividad). Combinar asignaciones formales + inferidas. |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Usar servicios sin cobertura real (no solo sin asignación formal). Agregar indicadores de actividad en tiempo real. |
| `src/components/monitoring/coordinator/MonitoristaCard.tsx` | Agregar indicador visual de última actividad (hace X min). Diferenciar servicios asignados vs inferidos. |

### Sin cambios de base de datos
Toda la información necesaria ya existe en `servicio_eventos_ruta` y `user_roles`. Solo cambia cómo se consulta y presenta.

