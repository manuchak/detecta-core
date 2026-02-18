
# Debug Profundo: Modulo de Planeacion y Asignaciones

## Resumen Ejecutivo

Se identificaron **6 problemas** clasificados por severidad. El mas critico es una inconsistencia de datos que causa que las asignaciones de armados se "pierdan" dependiendo de la ruta de codigo que las creo.

---

## CRITICO: Inconsistencia en `servicio_custodia_id` (datos corruptos)

### Problema

El campo `asignacion_armados.servicio_custodia_id` (tipo `text`) almacena **dos tipos diferentes de valor** dependiendo de quien inserta:

| Ruta de codigo | Valor insertado | Ejemplo |
|---|---|---|
| `useServiciosPlanificados.ts` (lineas 410, 705) | `id_servicio` (codigo humano) | `LUCOLLM-92` |
| `useArmedGuardsOperativos.ts` (linea 578) | `servicioId` (UUID del param) | `aced7b24-cb11-...` |
| `ConfirmationStep/index.tsx` (linea 86) | `formData.servicioId` (variable) | Depende del flujo |

### Datos actuales en BD

- **28 registros totales** en `asignacion_armados`
- **20** usan `id_servicio` (formato texto como `LUCOLLM-92`)
- **3** usan `id` UUID de `servicios_planificados`
- **5** son huerfanos (no coinciden con ninguno)

### Consecuencia

- `useArmadosDelServicio` (linea 34) busca `.eq('servicio_custodia_id', servicioId)` -- si recibe un UUID pero el dato guardado fue un `id_servicio`, **no encuentra nada**
- `countArmadosAsignados` (linea 54) tiene el mismo problema -- puede retornar 0 cuando hay armados asignados
- Esto causa que servicios con armado asignado muestren "0/1 armados" y el `estado_planeacion` nunca pase a `confirmado`
- La vista `armados_disponibles_extendido` une con `sc.id_servicio` (via JOIN en la CTE), ignorando los registros que fueron guardados con UUID

### Correccion propuesta

1. Estandarizar: todas las inserciones deben usar `id_servicio` (texto humano) ya que es la clave usada por la mayoria de las rutas y la vista
2. Corregir `useArmedGuardsOperativos.ts` linea 578: debe recibir/usar `id_servicio` en vez de UUID
3. Migrar los 3 registros huerfanos/UUID a su `id_servicio` correcto
4. Agregar indice en `asignacion_armados(servicio_custodia_id)` si no existe

---

## ALTO: `useFilterRechazados` no recibe contexto de armado

### Problema

En `useCustodioRechazos.ts` linea 113-122, `useFilterRechazados` llama a `useRechazosVigentes()` **sin** pasar `inclujeArmado`. Esto significa que siempre usa el default (`true`), lo cual coincidentalmente funciona. Pero si alguien usa `useFilterRechazados` para un servicio sin armado, excluira custodios innecesariamente.

### En `CustodianStep/index.tsx` linea 55

```typescript
const { data: rechazadosIds = [] } = useRechazosVigentes();
```

Tambien sin contexto. El CustodianStep conoce `formData.incluye_armado` pero no lo pasa al hook.

### Correccion propuesta

Pasar `{ inclujeArmado: formData.incluye_armado }` en CustodianStep. Actualizar `useFilterRechazados` para aceptar opciones.

---

## ALTO: Doble llamada a `supabase.auth.getUser()` en asignacion

### Problema

En `useArmedGuardsOperativos.ts`, la funcion `assignArmedGuard` llama a `supabase.auth.getUser()` **dos veces** (linea 585 y linea 632). Cada llamada es una peticion HTTP al servidor de auth.

### Correccion propuesta

Extraer `const { data: { user } } = await supabase.auth.getUser()` una sola vez al inicio de la funcion.

---

## MEDIO: Log duplicado en `useArmedGuardsOperativos.ts`

### Problema

Las lineas 415 y 418 tienen exactamente el mismo `console.log`:

```typescript
console.log(`[Armed] Processed ${processedGuards.length} guards with fail-open strategy`);
console.log(`[Armed] Processed ${processedGuards.length} guards with fail-open strategy`);
```

### Correccion

Eliminar la linea duplicada (418).

---

## MEDIO: `useProximidadOperacional` no se ejecuta sin servicio

### Problema

En linea 499:
```typescript
enabled: isEnabled && stableKey[0] !== 'sin-servicio',
```

Cuando `servicioNuevo` es `undefined`, el queryKey empieza con `'sin-servicio'` y la query **no se ejecuta**. Esto es intencional para el flujo de creacion, pero significa que si alguien abre el CustodianStep sin haber completado RouteStep (sin fecha/hora), la lista de custodios estara vacia sin mensaje de error claro.

El `stableServicioRef` en CustodianStep (linea 60-69) mitiga esto parcialmente pero introduce un escenario donde datos stale permanecen si el usuario retrocede y cambia la ruta.

### Correccion propuesta

No requiere cambio de codigo -- el ref es correcto. Solo documentar que la query no se ejecuta sin datos de servicio.

---

## BAJO: `useServicioLookup` usa `data.id` en vez de `data.id_servicio` para buscar armados

### Problema

En `useServicioLookup.ts` linea 67:
```typescript
.eq('servicio_custodia_id', data.id)  // Usa UUID
```

Pero la mayoria de los registros en `asignacion_armados` usan `id_servicio`. Esto causa que la busqueda de armados vinculados **falle silenciosamente** para servicios cuyo armado fue asignado via `useServiciosPlanificados`.

### Correccion propuesta

Cambiar a `.eq('servicio_custodia_id', data.id_servicio)` para consistencia con la mayoria de las inserciones.

---

## Plan de Implementacion

### Paso 1: Migracion SQL - Normalizar datos existentes

Actualizar los ~8 registros en `asignacion_armados` que usan UUID para que usen `id_servicio`, creando consistencia.

### Paso 2: Corregir inserciones en codigo

- `useArmedGuardsOperativos.ts`: asegurar que `servicio_custodia_id` reciba `id_servicio`
- `useServicioLookup.ts`: cambiar query a usar `id_servicio`

### Paso 3: Corregir filtro de rechazos

- `CustodianStep/index.tsx`: pasar `inclujeArmado` a `useRechazosVigentes`
- `useFilterRechazados`: aceptar opciones opcionales

### Paso 4: Limpieza menor

- Eliminar log duplicado
- Extraer `getUser()` duplicado

### Archivos a modificar

1. `supabase/migrations/` - Nueva migracion para normalizar datos
2. `src/hooks/useArmedGuardsOperativos.ts` - Fix servicio_custodia_id + getUser duplicado + log duplicado
3. `src/hooks/useServicioLookup.ts` - Fix query de armados vinculados
4. `src/hooks/useCustodioRechazos.ts` - Agregar opciones a useFilterRechazados
5. `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/index.tsx` - Pasar contexto armado
