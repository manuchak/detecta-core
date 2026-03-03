

# Plan: Corregir Lógica del Dashboard de Seguridad

## Problemas Identificados

### 1. Postura Operativa CRÍTICA — falso positivo
**Causa raíz:** La condición `operativeCritical > 5 && controlEffectivenessRate < 50` se dispara porque:
- `operativeCritical = 14` (13 siniestros históricos + 1 alta) — cuenta TODOS los incidentes históricos desde 2024
- `controlEffectivenessRate = 0%` — ningún incidente tiene `controles_activos` populado

**Problema conceptual:** La postura operativa debería reflejar el estado ACTUAL, no contar siniestros de hace 2 años. Los 13 siniestros históricos no tienen controles documentados porque ocurrieron antes de que existiera el sistema.

**Fix:** La postura debe evaluarse solo sobre una ventana temporal reciente (últimos 90 días) y ponderar `daysSinceLastCritical` desde el último siniestro real, no desde security_events de zonas H3.

### 2. Control Effectiveness 0% — lógica incorrecta
**Causa raíz:** Se calcula como `incidentes con controles_activos[] AND control_efectivo=true`. Hay 0 incidentes con `controles_activos` populado → 0/0 = 0%.

**Problema conceptual:** El checklist de servicio (380 registros completados en `checklist_servicio`) ES el control mitigador principal de Detecta. Cada checklist completado = control activo ejecutado. La efectividad debería cruzar: servicios con checklist completado vs servicios que tuvieron siniestro.

**Fix:** Recalcular efectividad como: `servicios con checklist / total servicios`. Y para el cruce: de los servicios que tuvieron siniestro, ¿cuántos tenían checklist completado? Eso mide si el control previno o no el evento.

### 3. DRF Period Selector (DoD/WoW/MoM/QoQ/YoY) no cambia nada visible
**Causa raíz:** El gauge siempre muestra `currentDRF` (global all-time). Solo cambia el texto de tendencia debajo. El sparkline y demás cards no reaccionan al periodo.

**Fix:** 
- El gauge debe mostrar el DRF del periodo seleccionado (`selectedTrend.current`), no el global
- El breakdown debe recalcularse para el periodo seleccionado
- La sparkline debe mostrar datos granulares del periodo (ej: MoM = 30 puntos diarios, QoQ = 12 puntos semanales)

### 4. DRF Sparkline muestra 0-25 / nunca debería ser 0
**Causa raíz:** El sparkline NO usa el DRF real — usa `heatmapData` (conteo diario de incidentes) como proxy falso. Días sin incidentes = score 0.

**Fix:** Calcular el DRF real por cada día/punto del sparkline. El DRF tiene componentes estructurales (exposure=95%, mitigation=76%) que dan un piso mínimo ~30-40 puntos incluso sin incidentes recientes. El DRF actual global debería ser ~33.9 basado en la exposición de zonas (95% alto/extremo de 2,144 zonas).

### 5. Concepto de DRF — qué debería medir realmente
El usuario espera que el DRF refleje: **"¿qué tan expuesto está Detecta basado en las rutas contratadas?"** — es decir, ¿estamos aceptando más riesgo a cambio de crecer?

**Fix conceptual:** El DRF debe cruzar:
- **Exposure:** Rutas contratadas que pasan por zonas alto/extremo (de `servicios_planificados` con coordenadas)
- **Siniestralidad histórica:** Tasa de siniestros por cada 1,000 servicios (del Fill Rate)
- **Mitigación:** % de servicios con checklist completado (380/3,040 = 12.5%)
- El periodo selector debe filtrar servicios Y siniestros al rango temporal

## Cambios Propuestos

### A. `useDetectaRiskFactor.ts` — Recalcular DRF por periodo
- Mover el cálculo para que `currentDRF` refleje el periodo seleccionado, no all-time
- Incluir datos de `checklist_servicio` (380 completados) como fuente de mitigación real
- Incluir datos de `siniestros_historico` para tasa de siniestralidad por periodo
- Retornar breakdown por periodo para que el gauge y barras cambien al seleccionar DoD/WoW/etc.
- El DRF nunca debe ser 0: la exposición a zonas (95% alto/extremo) da un piso estructural

### B. `useSecurityDashboard.ts` — Postura basada en ventana reciente
- Filtrar `operativeCritical` a últimos 90 días solamente
- Calcular `controlEffectivenessRate` desde `checklist_servicio`: completados/total servicios en periodo
- `daysSinceLastCritical` desde el último siniestro (`es_siniestro=true`), no desde security_events

### C. `PostureBanner.tsx` — Umbrales ajustados
- Usar tasa de siniestralidad reciente en vez de conteo absoluto histórico
- 0 siniestros en 90 días + checklist >50% = Estable
- Siniestro reciente (<30 días) = Elevada
- Siniestro reciente (<7 días) = Crítica

### D. `DetectaRiskFactorCard.tsx` — Gauge reactivo al periodo
- El gauge muestra `selectedTrend.current` en vez de `global.score`
- El breakdown se recalcula por periodo
- Añadir label "Global" cuando no hay periodo seleccionado

### E. `DRFSparkline.tsx` + `SecurityDashboard.tsx` — Sparkline real
- Calcular DRF real por cada punto usando la fórmula con componentes estructurales
- Usar datos de `siniestros_historico` (servicios mensuales + siniestros) para puntos históricos
- El piso mínimo será ~30-40 por la exposición a zonas alto/extremo

### F. Control Effectiveness card — datos reales
- Fuente: `checklist_servicio` (380 completos) / servicios en periodo
- Mostrar: "380 checklists completados de 3,040 servicios (12.5%)"
- El checklist ES el control ISO 28000 §6.2 — documentarlo en la narrativa

## Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `useDetectaRiskFactor.ts` | Query `checklist_servicio` + `siniestros_historico`, DRF por periodo, breakdown reactivo |
| `useSecurityDashboard.ts` | Ventana 90 días para postura, control effectiveness desde checklists |
| `PostureBanner.tsx` | Umbrales basados en siniestralidad reciente |
| `DetectaRiskFactorCard.tsx` | Gauge muestra periodo seleccionado, breakdown reactivo |
| `SecurityDashboard.tsx` | Sparkline con DRF real (no proxy de heatmap) |

