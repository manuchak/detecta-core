

# Problema: Todos los periodos muestran el mismo DRF (~35)

## Diagnóstico

El problema esta en `calcForOffset` (linea 245-253 del hook). Hay dos causas raiz:

1. **Zonas (`zones`) no tienen dimension temporal** -- se pasan siempre las mismas ~2,100 zonas sin filtrar por fecha. Como el 95% son extremo/alto, `exposureScore` = 95 siempre. Con peso 35%, esto aporta ~33.25 puntos fijos al DRF sin importar el periodo.

2. **Fallback a datos globales** -- cuando no hay `fillRate` o incidentes en un dia especifico (lo cual es comun para DoD), la linea `fr.length > 0 ? fr : fillRate` usa TODA la historia. Resultado: siniestralidad identica en todos los offsets.

Combinados, estos dos factores hacen que el DRF sea ~35 para todos los periodos historicos, que es exactamente lo que se ve en la UI.

## Solucion

La exposicion geografica es **estructural** (no cambia dia a dia, las zonas de riesgo no se mueven). Lo que SI varia temporalmente son: incidentes, siniestros, severidad y mitigacion. El DRF por periodo debe reflejar **solo los componentes temporales**, usando la exposicion como constante de contexto.

### Cambios en `useDetectaRiskFactor.ts`

1. **Separar componentes temporales de estructurales** en `calcForOffset`:
   - `exposureScore` permanece constante (es correcto, la geografia no cambia por dia)
   - `siniestralidad`: en vez de fallback a toda la historia, calcular la tasa usando una ventana proporcional al periodo (DoD = ultimos 30 dias, WoW = ultimos 2 meses, MoM = ultimo anio, etc.)
   - `incidentRate`: filtrar incidentes estrictamente al rango del periodo. Si no hay incidentes, el rate es 0 (no fallback)
   - `severityIndex`: mismo filtro temporal estricto
   - `mitigationRate`: filtrar checklists al rango del periodo

2. **Ventanas de contexto por periodo** para siniestralidad:
   - DoD: ventana de 30 dias alrededor de la fecha
   - WoW: ventana de 8 semanas
   - MoM: ventana de 12 meses
   - QoQ: ventana de 8 trimestres
   - YoY: todo el historico

   Esto genera variacion real porque la tasa de siniestros por 1,000 servicios cambia segun la ventana.

3. **Normalizar incidentRate relativo al periodo** -- en vez de dividir por `totalServicesAll`, dividir por los servicios del periodo (o estimacion proporcional). Asi un dia con 2 incidentes pesa diferente a un dia con 0.

### Resultado esperado

```text
┌──── Día ──────────┐
│  Hoy    ██████ 34 │  (0 incidentes hoy, solo exposicion)
│  Ayer   ██████ 34 │  (0 incidentes ayer)
│  01 mar ███████ 38│  (2 incidentes ese dia, sube)
│  28 feb █████ 33  │  (0 incidentes)
│  27 feb ██████ 35 │  (1 incidente)
└───────────────────┘
```

Los scores ahora variaran porque `incidentRate` y `severityIndex` reflejan los incidentes reales del dia, no un fallback global.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `useDetectaRiskFactor.ts` | Refactorizar `calcForOffset` para usar ventanas temporales proporcionales en vez de fallback global; normalizar incidentRate por servicios del periodo |

