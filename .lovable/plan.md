

# Fix: Limitar historial DRF a periodos con datos reales

## Problema

Los datos en `siniestros_historico` van de **2024-01 a 2026-02** y los incidentes de **2024-02 a 2026-02**. No hay datos antes de 2024. Sin embargo, YoY muestra barras para 2022 y 2023 con score ~33 porque el componente de exposición geográfica (35% del DRF) siempre aporta ~33 puntos aunque no existan servicios ni incidentes en ese periodo. Esto es engañoso.

Lo mismo aplica a DoD: las barras muestran ~35 para todos los días porque la siniestralidad (datos mensuales) no tiene granularidad diaria, y la exposición domina el score.

## Solución

### 1. `useDetectaRiskFactor.ts` — Filtrar periodos sin datos

- Determinar la **fecha más antigua con datos** del fill rate (`fillRate[0].fecha`, que es `2024-01`)
- Después de calcular el `history` array para cada periodo, **eliminar los puntos cuyo rango cae completamente antes de la fecha más antigua**
- Para DoD: calcular `HISTORY_DEPTH` dinámico basado en los días que realmente tienen datos de incidentes o checklists (si un día no tiene absolutamente nada, marcar el score como solo exposición base para que sea distinguible)
- Si un periodo tiene menos de 2 puntos históricos, mostrar lo que haya sin forzar 5 barras

### 2. `DRFPeriodCards.tsx` — Manejar historial variable

- Aceptar que `history` puede tener 1-5 puntos (no siempre 5)
- Ajustar el layout para que las tarjetas con menos barras no se vean rotas

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `useDetectaRiskFactor.ts` | Detectar fecha mínima de datos, filtrar offsets sin datos reales, no generar puntos fantasma |
| `DRFPeriodCards.tsx` | Soportar historial de longitud variable |

