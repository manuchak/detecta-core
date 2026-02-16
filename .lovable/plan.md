

# Fix: Servicios pendientes no aparecen para custodios (Rodrigo, Jorge, Daniel)

## Causa Raiz

El hook `useNextService.ts` solicita las columnas `origen_lat` y `origen_lng` de la tabla `servicios_planificados`, pero esas columnas **no existen** en esa tabla (solo existen en `servicios_custodia`). Esto causa un error HTTP 400 silencioso que hace que la query falle, retornando cero servicios planificados.

Es el mismo patron de bug que corregimos anteriormente con `km_recorridos`/`cobro_cliente` en `useCustodianServices.ts`.

## Impacto

Afecta a **todos** los custodios cuyo proximo servicio esta en `servicios_planificados`. La tarjeta principal del dashboard muestra "Sin servicios pendientes" aunque tengan servicios confirmados para hoy.

## Fix

### Archivo: `src/hooks/useNextService.ts`

Eliminar `origen_lat` y `origen_lng` del SELECT de `servicios_planificados` (lineas 50-51) y asignar `null` a esos campos en el mapeo del resultado (linea 102-103).

El SELECT de `servicios_custodia` (lineas 74-75) se mantiene sin cambios ya que esas columnas SI existen en esa tabla.

### Cambio especifico

```text
Antes (linea 41-51):
  .select(`
    id,
    id_servicio,
    nombre_cliente,
    origen,
    destino,
    fecha_hora_cita,
    estado_planeacion,
    tipo_servicio,
    origen_lat,      <-- NO EXISTE
    origen_lng       <-- NO EXISTE
  `)

Despues:
  .select(`
    id,
    id_servicio,
    nombre_cliente,
    origen,
    destino,
    fecha_hora_cita,
    estado_planeacion,
    tipo_servicio
  `)
```

Y en el mapeo (lineas 93-104), asignar `origen_lat: null` y `origen_lng: null` para servicios planificados.

## Verificacion

Rodrigo Becerril (tel 5542954197) tiene el servicio SIINSRH-738 confirmado para hoy 16:00 UTC. Tras el fix, debera aparecer como proximo servicio con boton para iniciar checklist.

