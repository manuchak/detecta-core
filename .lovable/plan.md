
## Debug y Optimizacion del Modulo de Planeacion

Tras una revision exhaustiva del codigo modificado en las Fases 2 y 3, se identificaron **5 problemas** que deben corregirse para mantener la estabilidad y performance del modulo.

---

### Problema 1 (CRITICO): `assignArmedGuard` no usa logica multi-armado

La mutacion `assignArmedGuard` (lineas 384-429 de `useServiciosPlanificados.ts`) **no fue actualizada** en la Fase 2. Sigue usando solo campos escalares y no inserta en `asignacion_armados`. Mientras que `reassignArmedGuard` SI fue actualizado correctamente.

Esto significa que cualquier flujo que use `assignArmedGuard` (primera asignacion de armado) **no crea registro en la tabla relacional**, rompiendo la fuente de verdad.

**Correccion**: Alinear `assignArmedGuard` con la misma logica de `reassignArmedGuard`:
- Insertar en `asignacion_armados`
- Contar armados asignados vs requeridos para determinar estado
- Mantener escritura dual en campos escalares

---

### Problema 2 (CRITICO): `reassignCustodian` usa scalar check, no multi-armado

En linea 567:
```
const shouldBeConfirmed = !currentService.requiere_armado || currentService.armado_asignado;
```

Esto usa el campo escalar `armado_asignado` para determinar si el servicio esta confirmado. Para servicios multi-armado (2+ requeridos), un solo nombre en el campo escalar no refleja si todos los armados estan asignados.

**Correccion**: Usar `countArmadosAsignados` (igual que en `assignCustodian` y `reassignArmedGuard`):
```
const armadosAsignados = await countArmadosAsignados(currentService.id_servicio);
const armadosRequeridos = currentService.cantidad_armados_requeridos || 1;
const shouldBeConfirmed = !currentService.requiere_armado || armadosAsignados >= armadosRequeridos;
```

---

### Problema 3 (PERFORMANCE): N+1 potencial en `AdditionalArmedGuard`

El componente `AdditionalArmedGuard` ejecuta `useArmadosDelServicio(servicioId)` -- una query individual por servicio. Actualmente solo se usa en `ScheduledServicesTabSimple.tsx` pero no se renderiza en el map principal (se usa inline solo en Row 3 con datos locales). Sin embargo, el componente esta importado y disponible.

El riesgo es que si se usa dentro del `.map()` de servicios, generaria N queries paralelas (una por servicio).

**Correccion**: Agregar un guard en el componente para que NO ejecute la query cuando `servicioId` no se proporciona y documentar que para uso en listas, se debe pasar datos pre-cargados en vez de IDs individuales. Actualmente no es un problema activo, pero se debe prevenir.

---

### Problema 4 (BUG): `removeAssignment` para armed_guard no limpia `asignacion_armados`

La mutacion `removeAssignment` (lineas 728-808) al remover un armado solo limpia los campos escalares (`armado_asignado`, `armado_id`) pero **no cancela/elimina registros en `asignacion_armados`**. Esto deja registros fantasma en la tabla relacional.

**Correccion**: Cuando `assignmentType === 'armed_guard'`, tambien actualizar registros en `asignacion_armados` con `estado_asignacion = 'cancelado'` para el servicio correspondiente.

---

### Problema 5 (BUG): `assignArmedGuard` usa `.single()` sin fallback

En linea 395:
```
.eq('id', serviceId)
.single();
```

Esto viola la convencion del proyecto (`.maybeSingle()`). Si el servicio no existe, lanza un error no controlado en vez de un mensaje user-friendly.

**Correccion**: Cambiar a `.maybeSingle()` y agregar null-check como en las demas mutaciones.

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useServiciosPlanificados.ts` | Fix #1: `assignArmedGuard` multi-armado. Fix #2: `reassignCustodian` count check. Fix #4: `removeAssignment` limpia relacional. Fix #5: `.maybeSingle()` |

### Secuencia

1. Fix `assignArmedGuard` para insertar en `asignacion_armados` y calcular estado (critico)
2. Fix `reassignCustodian` para usar conteo relacional
3. Fix `removeAssignment` para cancelar registros en `asignacion_armados`
4. Fix `.single()` a `.maybeSingle()`

Todos los cambios son en un solo archivo, sin impacto en UI ni nuevas dependencias.
