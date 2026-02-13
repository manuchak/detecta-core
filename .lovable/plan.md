

## Fix: Alinear criterio de "En Riesgo" entre Funnel y Tarjeta KPI

### Problema

La tarjeta KPI "Clientes en Riesgo" y el Funnel de Fidelidad usan criterios diferentes para clasificar riesgo:

| Criterio | Tarjeta KPI (Cartera) | Funnel (Fidelidad) |
|---|---|---|
| Quejas >= 2 | En Riesgo | En Riesgo |
| Sin contacto > 60d Y sin servicios 90d | En Riesgo | En Riesgo |
| Sin contacto > 60d PERO con servicios 90d | NO es riesgo | Es riesgo |

La linea 59 del funnel marca como "en_riesgo" a cualquier cliente con `dias_sin_contacto > 60`, sin verificar si tiene servicios recientes. Esto atrapa 4 clientes extra que la tarjeta KPI correctamente excluye.

### Solucion

Actualizar `calculateStage()` en `src/hooks/useCSLoyaltyFunnel.ts` para que use la misma condicion que `calcSalud()` en Cartera.

### Cambio en `src/hooks/useCSLoyaltyFunnel.ts`

Reemplazar lineas 53-59:

```
const sinActividadReciente = client.dias_sin_contacto > 60;
if (client.quejas_abiertas >= 2 || (sinActividadReciente && !client.ultimo_servicio)) {
  return 'en_riesgo';
}
if (sinActividadReciente) return 'en_riesgo';
```

Por:

```
const sinActividadReciente = client.dias_sin_contacto > 60;
if (client.quejas_abiertas >= 2 || (sinActividadReciente && client.servicios_90d === 0)) {
  return 'en_riesgo';
}
```

Esto:
- Elimina la linea 59 que marcaba riesgo solo por `dias_sin_contacto > 60`
- Unifica la condicion: riesgo = `quejas >= 2` O `(sin contacto > 60d Y sin servicios en 90d)`
- Clientes con servicios recientes pero sin touchpoint manual no seran penalizados

### Resultado

Ambos componentes mostraran el mismo numero de clientes en riesgo (3 en este caso).
