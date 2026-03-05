

# Fix: Separar "Custodio en sitio" de "Inicio de servicio"

## Problema raíz

El campo `hora_inicio_real` tiene doble semántica:
- **Planeación** lo usa para indicar "custodio llegó al punto de origen" (vía `mark_on_site` en `StatusUpdateButton`)
- **Monitoreo/Bitácora** lo usa para indicar "monitorista validó e inició el workflow"

Cuando Planeación marca "En sitio", el servicio desaparece de "Por Iniciar" y aparece directamente en "En Curso" porque el query de pending filtra `hora_inicio_real IS NULL` y el de active filtra `hora_inicio_real IS NOT NULL`.

## Solución

Separar los conceptos usando un campo dedicado para el posicionamiento del custodio, sin alterar el campo que controla el inicio del workflow de monitoreo.

### Cambio 1: Nuevo campo `hora_llegada_custodio` (ya existe en el schema)

El campo `hora_llegada_custodio` ya existe en `servicios_planificados`. Solo hay que usarlo correctamente.

### Cambio 2: `useServiciosPlanificados.ts` — `updateOperationalStatus`

Cambiar `mark_on_site` para que escriba en `hora_llegada_custodio` en lugar de `hora_inicio_real`:

```typescript
const updateData = action === 'mark_on_site' 
  ? { hora_llegada_custodio: new Date().toISOString() }
  : { hora_llegada_custodio: null };
```

### Cambio 3: `CompactServiceCard.tsx` — `getOperationalStatus`

Actualizar la lógica de estado operativo para usar `hora_llegada_custodio` en lugar de `hora_inicio_real` para determinar si el custodio está "en sitio":

```typescript
if (service.hora_llegada_custodio && !service.hora_inicio_real) {
  return { status: 'en_sitio', ... };
}
```

### Cambio 4: `ScheduledServicesTabSimple.tsx` — misma lógica de `getOperationalStatus`

Sincronizar la función duplicada de estado operativo con el mismo cambio.

### Sin cambios en Bitácora

`useBitacoraBoard.ts` sigue usando `hora_inicio_real` exclusivamente para el inicio validado por monitoreo. Los queries de pending/active no se tocan.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useServiciosPlanificados.ts` | `mark_on_site` escribe `hora_llegada_custodio` en vez de `hora_inicio_real` |
| `src/components/planeacion/CompactServiceCard.tsx` | `getOperationalStatus` usa `hora_llegada_custodio` |
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Misma corrección en función duplicada |

