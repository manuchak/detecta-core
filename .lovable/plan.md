

# Fix: "En Sitio" sin bloqueos + Badge "Arribado" claro

## Problema raíz identificado

`isUpdatingOperationalStatus` proviene de `updateOperationalStatus.isPending` — es un **estado global de la mutación**. Cuando Tzoali marca UN servicio "En Sitio", `isPending = true` deshabilita **TODOS** los botones de StatusUpdateButton simultáneamente. Si la mutación tarda (inserta mensaje WA + envía notificación cliente), los demás servicios quedan bloqueados hasta que termina.

```text
Servicio A: click "En sitio" → isPending=true → ✅ funciona
Servicio B: click "En sitio" → disabled={true} → ❌ bloqueado
Servicio C: click "En sitio" → disabled={true} → ❌ bloqueado
```

## Solución

### 1. Desbloqueo: Tracking por servicio individual

**`CompactServiceCard.tsx`**: En lugar de pasar `isUpdatingOperationalStatus` global, cada card trackea su propia mutación local. El botón solo se deshabilita si ESE servicio específico está en proceso.

Cambio: mover el `disabled` a depender solo del `serviceId` en progreso, no del estado global. Implementar con un `useState` local en cada card que se activa durante `onStatusUpdate` y se desactiva al resolver.

### 2. Badge "Arribado ✓" prominente

Cuando `hora_llegada_custodio` existe (estado `en_sitio`), mostrar un badge verde claro e inequívoco:

```text
┌──────────────────────────────────────────────┐
│ 09:30  Cliente ABC   [✓ Arribado 09:15] [▼]  │
│ CDMX → Querétaro   Custodio: Juan           │
└──────────────────────────────────────────────┘
```

- Badge: `CheckCircle` icon + "Arribado HH:mm" (hora real de llegada)
- Color: `bg-emerald-100 text-emerald-700 border-emerald-300`
- Reemplaza el badge genérico "En sitio" actual con uno que incluya la hora y sea visualmente más fuerte
- El dropdown "Revertir" se mantiene accesible desde el chevron

### 3. Mismo fix en ScheduledServicesTabSimple

La vista legacy también pasa `isUpdatingOperationalStatus` global — aplicar el mismo patrón de tracking local.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/planeacion/CompactServiceCard.tsx` | Estado local de loading por card; badge "Arribado HH:mm" con hora |
| `src/components/planeacion/StatusUpdateButton.tsx` | Cuando `en_sitio`, mostrar badge "✓ Arribado" con hora en vez de solo "En sitio" |
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Misma lógica de loading local por fila |

