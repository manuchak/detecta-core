

# Plan: Incorporar Historial de Siniestros y Enriquecer BDD de Incidentes

## Contexto Actual

**Datos encontrados:**
- La tabla `incidentes_operativos` solo tiene 10 registros (todos de Feb 2026).
- El Fill Rate contiene **12 siniestros históricos** (Feb 2024 — Dic 2025) que no existen en la BDD.
- Hay 3 informes detallados: **Monterosa** (Jul 2025, robo consumado con armas), **Doraldent/Benotto** (Sep 2025, intento de robo + secuestro custodio), y un **polígrafo** (Ago 2024, robo Benotto).

**Criterio de criticidad del usuario:**
- **Crítico (siniestro):** Robo consumado o pérdida humana
- **No crítico:** Todo lo demás (falla mecánica, protocolo incumplido, retén, narco-bloqueo, etc.)

## Paso 1 — Insertar los 12 siniestros históricos en `incidentes_operativos`

Usar el insert tool para agregar los 12 registros del Fill Rate con los datos disponibles:

| Fecha | Severidad | Tipo | Nota | Cliente |
|-------|-----------|------|------|---------|
| 2024-02-06 | crítica | robo | (sin detalle) | — |
| 2024-02-10 | crítica | robo | (sin detalle) | — |
| 2024-03-05 | crítica | robo | (sin detalle) | — |
| 2024-04-27 | crítica | robo | (sin detalle) | — |
| 2024-08-14 | crítica | robo | Robo Benotto (ver polígrafo) | Benotto |
| 2024-09-07 | crítica | robo | (sin detalle) | — |
| 2024-10-09 | crítica | robo | (sin detalle) | — |
| 2024-11-30 | crítica | robo | (sin detalle) | — |
| 2025-07-09 | crítica | asalto | Robo Monterosa — Lázaro Cárdenas a Tultepec | Monterosa |
| 2025-09-03 | crítica | asalto | Intento robo Doraldent — secuestro custodio | Doraldent |
| 2025-11-05 | crítica | robo | Robo unidad Monterosa, servicio local | Monterosa |
| 2025-11-27 | crítica | robo | Robo Suave-Facil, Naucalpan-Monterrey | Suave-Facil |
| 2025-12-02 | crítica | robo | Robo CrossMotion, entrando GDL, folio CRCSMTI-18 | CrossMotion |

Para los 3 con informes detallados (Monterosa Jul, Doraldent Sep, Benotto Ago), se enriquecerán con:
- Coordenadas GPS exactas del evento
- Zona geográfica precisa
- Descripción narrativa del modus operandi
- Acciones tomadas (protocolo de reacción, 911, polígrafos)

## Paso 2 — Reclasificar severidad de los 10 incidentes existentes

Los 10 incidentes actuales (Feb 2026) son todos no-críticos según el criterio del usuario (fallas mecánicas, protocolo incumplido, retén, narco-bloqueo). Actualizar los que tengan severidad "alta" a "media" si no involucran robo ni pérdida humana:

- `e7c7bb89` (derrame gasolina, alta → media)
- `d3590558` (narco-bloqueo, alta → media)
- `a61ccffe` (agresión/secuestro, alta → **se mantiene crítica** por involucrar privación de libertad)

## Paso 3 — Agregar columna `es_siniestro` para distinción binaria

Migración para agregar un campo booleano `es_siniestro` a `incidentes_operativos`:
- `true` = siniestro (robo consumado, pérdida humana, asalto con armas)
- `false` = evento no crítico

Esto permite filtrar y calcular métricas como el **fill rate de siniestralidad** (siniestros / servicios totales).

## Paso 4 — Crear tabla `siniestros_historico` para el Fill Rate completo

Tabla ligera para almacenar el registro mensual de servicios/siniestros del Fill Rate, permitiendo análisis de tendencia:

```
siniestros_historico:
  id, fecha (date), servicios_solicitados (int), servicios_completados (int),
  siniestros (int), eventos_no_criticos (int), nota (text)
```

Insertar las 12 filas del Fill Rate + los datos mensuales de servicios (Page 2 del xlsx) para tener el volumen operativo histórico desde Ene 2023.

## Paso 5 — Dashboard: Panel de Siniestralidad Histórica

Nuevo componente en el módulo de Seguridad:

- **KPIs**: Total siniestros, tasa de siniestralidad (siniestros/servicios ×1000), tendencia MoM
- **Gráfico de líneas**: Servicios vs Siniestros por mes (desde 2024)
- **Timeline de siniestros**: Lista cronológica de los 12+ siniestros con badges de severidad, cliente afectado, y link al informe si existe
- **Fill Rate visual**: Barra de progreso mostrando servicios completados vs solicitados por periodo

## Paso 6 — Enriquecer DRF y analytics con datos históricos

Los hooks existentes (`useDetectaRiskFactor`, `useIncidentAnalytics`, `useIncidentesExecutive`) automáticamente reflejarán los nuevos datos una vez insertados, ya que consultan `incidentes_operativos`. El campo `es_siniestro` permitirá segmentar el DRF para ponderar siniestros con mayor peso que eventos no críticos.

## Resumen técnico de cambios

| Acción | Tipo |
|--------|------|
| INSERT 12+ siniestros históricos | Data (insert tool) |
| UPDATE severidad de 2 incidentes existentes | Data (insert tool) |
| ADD columna `es_siniestro` boolean | Migración |
| CREATE tabla `siniestros_historico` | Migración |
| INSERT fill rate mensual (27 meses) | Data (insert tool) |
| Nuevo `SiniestroHistoryPanel.tsx` | Componente UI |
| Actualizar `useDetectaRiskFactor.ts` para ponderar siniestros | Hook |
| Fix build error gl-matrix (tsconfig skipLibCheck) | Config |

