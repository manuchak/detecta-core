

# Plan: Filtrar drawer de Alertas con umbral de 24h

## Problema

La tarjeta "Alerta" en el dashboard muestra el conteo correcto (3 alertas) gracias al filtro de 1440 minutos aplicado en `useOperationalPulse` y `useServiciosTurnoLive`. Sin embargo, al abrir el drawer de "Alerta", el filtro en `MobileOperationalDashboard.tsx` (línea 217) no incluye ese umbral, mostrando todos los servicios con alertLevel warning/critical — incluyendo zombies con miles de minutos de inactividad.

## Cambio

### `src/components/executive/MobileOperationalDashboard.tsx`

Línea 217 — agregar condición `&& s.minutesSinceLastAction <= 1440`:

```typescript
case 'Alerta': 
  return (s.alertLevel === 'warning' || s.alertLevel === 'critical') 
    && s.minutesSinceLastAction <= 1440;
```

Un cambio de una línea. Esto sincroniza el drawer con el conteo de la tarjeta: solo las 3 alertas accionables aparecerán en la lista.

