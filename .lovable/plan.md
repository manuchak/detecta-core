
# Fix: Eliminar Flash de "Sin Datos de Custodios" Durante Carga Inicial

## Problema Identificado

El componente CustodianStep muestra brevemente el alert "Sin datos de custodios" antes de que la lista cargue correctamente. Esto ocurre por una condicion de carrera en React Query v5:

**Flujo actual:**
1. `isHydrated` se vuelve `true` (borrador restaurado)
2. `isReadyToQuery` se vuelve `true` (datos del servicio disponibles)
3. React Query cambia `enabled` de `false` a `true`
4. **PROBLEMA**: Hay un frame donde `isLoading: false` pero `data: undefined`
5. La condicion `!isLoading && filteredCustodians.length === 0` se evalua como `true`
6. Se muestra NoCustodiansAlert incorrectamente
7. En el siguiente render, `isLoading: true` y se muestra el skeleton

## Solucion

Usar `isPending` de React Query en lugar de solo `isLoading`:

- `isLoading`: true solo cuando esta fetching por primera vez
- `isPending`: true cuando no hay data (independiente del fetch status)

Cuando el query esta deshabilitado (`enabled: false`):
- `isLoading: false` (no esta fetching)
- `isPending: true` (no hay data)

Esto permite detectar el estado inicial correctamente.

---

## Cambios Requeridos

### 1. Archivo: `CustodianStep/index.tsx`

**Cambio A - Extraer `isPending` del hook:**

```typescript
// Antes (linea ~66)
const { data: categorized, isLoading, error, refetch: refetchCustodians } = useCustodiosConProximidad(...)

// Despues
const { data: categorized, isLoading, isPending, error, refetch: refetchCustodians } = useCustodiosConProximidad(...)
```

**Cambio B - Crear variable de estado de carga consolidada:**

```typescript
// Agregar despues de la linea 69
// Estado de carga real: loading o pending (sin datos aun)
const isLoadingOrPending = isLoading || isPending;
```

**Cambio C - Actualizar condicion de NoCustodiansAlert (linea ~436):**

```typescript
// Antes
{!state.selectedCustodianId && !isLoading && filteredCustodians.length === 0 && (
  <NoCustodiansAlert ... />
)}

// Despues
{!state.selectedCustodianId && !isLoadingOrPending && filteredCustodians.length === 0 && (
  <NoCustodiansAlert ... />
)}
```

**Cambio D - Actualizar CustodianList y QuickStats para usar el estado consolidado:**

```typescript
// QuickStats (linea ~407)
<QuickStats categorized={categorized} isLoading={isLoadingOrPending} />

// CustodianList (linea ~449-451)
<CustodianList
  custodians={filteredCustodians}
  isLoading={isLoadingOrPending}
  ...
/>

// ConflictSection (linea ~467)
<ConflictSection
  conflicts={categorized?.noDisponibles || []}
  isLoading={isLoadingOrPending}
  ...
/>
```

---

## Impacto

| Estado | Antes | Despues |
|--------|-------|---------|
| Query deshabilitado | Muestra "Sin datos" (bug) | Muestra skeleton loader |
| Query iniciando | Flash de "Sin datos" | Muestra skeleton loader |
| Query completado sin datos | Muestra "Sin datos" | Muestra "Sin datos" (correcto) |
| Query completado con datos | Muestra lista | Muestra lista (correcto) |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/index.tsx` | Usar `isPending`, consolidar estado de carga |

---

## Notas Tecnicas

- `isPending` es el estado correcto de React Query v5 para detectar "sin data aun"
- No requiere cambios en el hook `useCustodiosConProximidad`
- Compatible con el patron existente de "Hydration-Safe Initialization"
- No afecta el comportamiento cuando hay datos o errores reales
