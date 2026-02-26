

# Complemento Trimestral y Anual para el Plan 2026

## Contexto

El dashboard actual del Plan 2026 es excelente para seguimiento day-to-day del mes en curso, pero no ofrece visibilidad sobre el progreso hacia las metas trimestrales ni anuales. Al estar a mitad de un Q, no hay forma de saber si el ritmo acumulado va en linea con el objetivo del trimestre o del ano.

## Diseno propuesto

Agregar **dos secciones nuevas** al final del `StrategicPlanTracker`, despues de la tabla de varianza diaria:

### Seccion 1: Scorecard Trimestral (Q actual)

Una card con 3 columnas (Servicios, GMV, Custodios Activos) que muestra:

```text
+------------------------------------------------------+
|  Progreso Trimestral - T1 2026                       |
|------------------------------------------------------|
|  SERVICIOS        GMV             CUSTODIOS ACTIVOS   |
|  2,100 / 2,500    $16.8M / $17.1M    85 / 90         |
|  [===████████░░]  [===████████░░░]   [===████████░]   |
|  84% completado   98% completado     94% completado   |
|  Ritmo: 23.3/dia  Ritmo: $186K/dia   --               |
|  Proy: 2,610      Proy: $17.5M       --               |
+------------------------------------------------------+
```

- Meta del Q = suma de `business_targets` de los 3 meses del trimestre
- Actual del Q = suma de servicios/GMV reales acumulados en esos meses
- Barra de progreso visual con color segun % (verde >90%, amarillo 75-90%, rojo <75%)
- Proyeccion lineal basada en ritmo actual vs dias restantes del Q

### Seccion 2: Scorecard Anual

Similar pero para el ano completo:

```text
+------------------------------------------------------+
|  Progreso Anual 2026                                 |
|------------------------------------------------------|
|  SERVICIOS        GMV             CUSTODIOS ACTIVOS   |
|  2,100 / 10,000   $16.8M / $68.4M   85 / 100        |
|  [==███░░░░░░░░]  [==███░░░░░░░░░]  [==████░░░░░░]  |
|  21% completado   25% completado     85% completado   |
|  Proy YE: 10,500  Proy YE: $72M     --               |
|  vs 2025: +12%    vs 2025: +15%      --               |
+------------------------------------------------------+
```

- Meta anual = suma de los 12 meses de `business_targets`
- Proyeccion Year-End basada en ritmo actual extrapolado
- Comparacion vs ano anterior (datos ya disponibles en `useExecutiveMultiYearData`)

## Cambios tecnicos

### 1. Nuevo hook: `src/hooks/useQuarterlyAnnualProgress.ts`

- Consume `useBusinessTargets(currentYear)` para obtener las metas mensuales de todo el ano
- Consume `useExecutiveMultiYearData` para obtener datos reales historicos por mes
- Calcula:
  - Q actual: meses que pertenecen, dias transcurridos del Q, dias restantes
  - Acumulado real del Q (sumando meses completados + MTD del mes actual)
  - Meta del Q (suma de target_services/target_gmv de los 3 meses)
  - Acumulado real del ano
  - Meta anual (suma de 12 meses)
  - Proyeccion lineal Q y anual
  - Comparacion vs ano anterior (YTD equivalent)

### 2. Nuevo componente: `src/components/executive/QuarterlyAnnualScorecard.tsx`

- Renderiza las dos secciones (Q y Anual)
- Usa barras de progreso con colores semanticos
- Incluye badges de estado (En Meta / En Riesgo / Fuera de Meta)
- Usa el mismo patron visual del StrategicPlanTracker (Cards, fonts, spacing)

### 3. Modificar `src/components/executive/StrategicPlanTracker.tsx`

- Importar y renderizar `QuarterlyAnnualScorecard` al final del componente, despues de la tabla de varianza diaria (linea 284)

### Dependencias de datos

- `business_targets`: Ya existe, contiene metas mensuales por ano
- `useExecutiveMultiYearData`: Ya calcula `quarterlyByYear` y `yearlyTotals` con datos reales
- No se requieren nuevas tablas ni migraciones SQL

