

# Fix: Ventana de visibilidad de servicios pendientes en Bitácora

## Problema

La query de servicios "Por Iniciar" usa una ventana de **±1 hora** desde `Date.now()`. El servicio de Simply Orange tiene cita a las 10:00 AM CDMX (16:00 UTC), por lo que solo es visible entre 9:00-11:00 AM. Fuera de ese rango, desaparece del tablero.

## Solución

Ampliar la ventana de servicios pendientes para mostrar **todos los servicios del día actual** que aún no han iniciado, en lugar de una ventana de ±1h.

### Cambio en `src/hooks/useBitacoraBoard.ts`

**Líneas 62-78** — Reemplazar la ventana ±1h por una ventana de **día completo**:

- `desde`: inicio del día actual (00:00 CDMX / 06:00 UTC)  
- `hasta`: fin del día actual (23:59 CDMX / 05:59+1 UTC)

Esto garantiza que todos los servicios confirmados/planificados del día sean visibles en la columna "Por Iniciar" desde el momento en que el monitorista abre el tablero, sin importar la hora.

### Archivos

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useBitacoraBoard.ts` | Ampliar ventana de pending query de ±1h a día completo CDMX |

### Nota secundaria

El `id_servicio` del servicio de hoy es un UUID raw (`9ac8ebcb-...`) en lugar del formato `SIGESOR-N`. Esto no bloquea la visibilidad pero indica que se creó por un flujo que no asignó ID secuencial. Se puede corregir por separado si lo deseas.

