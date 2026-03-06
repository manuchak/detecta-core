

# Diagnostico: "En sitio" se revierte a "Pendiente arribar"

## Problema raiz

La funcion `getOperationalStatus` en `ScheduledServicesTabSimple.tsx` y `CompactServiceCard.tsx` tiene esta logica:

```typescript
// En sitio: hora_llegada_custodio existe Y hora_inicio_real NO existe
if (service.hora_llegada_custodio && !service.hora_inicio_real) {
  return { status: 'en_sitio' };
}
```

Cuando el monitorista inicia el servicio en Bitacora (`useBitacoraBoard.iniciarServicio`), se escribe `hora_inicio_real` en `servicios_planificados`. Esto invalida la condicion `!service.hora_inicio_real`, y el servicio cae al siguiente caso:

```typescript
// La hora de cita ya paso + custodio asignado = "Pendiente arribar"
if (citaTime < now && isFullyAssigned) {
  return { status: 'pendiente_inicio', label: 'Pendiente arribar' };
}
```

**Resultado**: Un servicio que estaba "En sitio" se muestra como "Pendiente arribar" despues de que Bitacora lo inicia. Los datos de la BD de hoy lo confirman: servicios con `hora_llegada_custodio = '05:48:09'` y `hora_inicio_real = '2026-03-06T11:27:49'` muestran "Pendiente arribar" en Planeacion.

## Comportamiento esperado (confirmado por usuario)

Cuando `hora_inicio_real` ya existe, Planeacion debe mostrar el servicio como **"En curso"** (estado de solo lectura) y el boton "En sitio" debe desaparecer. La edicion de estado se bloquea una vez que Bitacora toma control.

## Solucion

Agregar un nuevo estado `'en_curso'` a la logica de `getOperationalStatus`, evaluado **antes** de `pendiente_inicio`:

```typescript
// En curso - monitoreo activo (hora_inicio_real existe, hora_fin_real no)
if (service.hora_inicio_real && !service.hora_fin_real) {
  return { status: 'en_curso', label: 'En curso', icon: Activity, ... };
}
```

### Orden corregido de evaluacion:
1. `completado` — `hora_fin_real` existe
2. `en_curso` — `hora_inicio_real` existe (NUEVO)
3. `en_sitio` — `hora_llegada_custodio` existe, sin `hora_inicio_real`
4. `sin_asignar` — sin custodio
5. `armado_pendiente` — falta armado
6. `pendiente_inicio` — hora paso, completamente asignado
7. `programado` — completamente asignado, hora no ha pasado

### Archivos a modificar:

| Archivo | Cambio |
|---|---|
| `ScheduledServicesTabSimple.tsx` | Agregar estado `en_curso` a `getOperationalStatus` (lineas 200-295) y a `ESTADO_OPERATIVO_CONFIG` (lineas 108-116) |
| `CompactServiceCard.tsx` | Agregar estado `en_curso` a `getOperationalStatus` (lineas 31-128) |
| `StatusUpdateButton.tsx` | Agregar `en_curso` al tipo `OperationalStatus` y asegurar que retorna `null` para ese estado (ya lo hace con el guard existente) |

### Impacto en StatusUpdateButton:
- `canMarkOnSite` ya excluye `en_curso` (solo permite `programado`, `armado_pendiente`, `pendiente_inicio`)
- `canRevert` solo aplica a `en_sitio`
- Para `en_curso`, ambos son `false` → el boton no se renderiza → correcto

### Impacto en semaforo de conteos:
Se agregara `en_curso` al config de estados operativos con color azul para distinguirlo visualmente de "En sitio" (verde) y "Completado" (verde oscuro).

