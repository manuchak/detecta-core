

# Fix: QoQ debe ser promedio ponderado de meses, no cálculo independiente

## Problema

QoQ calcula el DRF usando todo el rango del trimestre como un bloque monolítico. Esto introduce distorsiones porque:
- La ventana de siniestralidad es 24 meses (vs 12 para MoM), inflando ese componente
- La mitigación se diluye al incluir enero (sin checklists) en el denominador
- El resultado (39) no es consistente con los meses individuales (25, 39, 35 → esperado ~33)

## Solución

Para QoQ y YoY: calcular como **promedio ponderado por servicios** de los sub-periodos mensuales, no como cálculo independiente. Esto garantiza consistencia jerárquica: el trimestre refleja fielmente sus meses.

### Cambio en `useDetectaRiskFactor.ts`

En `calcForOffset`, cuando `period === 'QoQ'`:
1. Obtener el rango del trimestre (from, to)
2. Calcular el DRF de cada mes individual dentro del rango (reutilizando la lógica MoM)
3. Promediar los scores ponderados por `servicios_completados` de cada mes
4. El breakdown final es el promedio ponderado de los breakdowns mensuales

Para `YoY`: mismo principio, promedio ponderado de los 12 meses (o los que tengan datos).

```
Q1-26 = (Jan_score × Jan_services + Feb_score × Feb_services + Mar_score × Mar_services) 
         / (Jan_services + Feb_services + Mar_services)
```

Esto produciría un Q1 cercano a ~33, coherente con los meses.

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `useDetectaRiskFactor.ts` | QoQ/YoY como promedio ponderado de sub-periodos mensuales |

