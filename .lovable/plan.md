
# Plan: Diagnosticar y Corregir Bug de Custodios Mostrando 0 Resultados

## Diagnóstico Profundo

### Evidencia de los Logs
```
✅ Encontrados 104 custodios disponibles
✅ Procesados 104/104 custodios
✅ Custodios categorizados: { disponibles: 87, parcialmente_ocupados: 2, ocupados: 0, no_disponibles: 15 }
```

La query **SÍ retorna datos**, pero la UI muestra "Sin datos de custodios" con 0 en todos los conteos.

### Causa Raíz Identificada: Doble Fuente de `servicioNuevo`

El problema está en que hay **DOS lugares** donde se construye `servicioNuevo`:

1. **useCustodianStepLogic.ts** (línea 72-84):
```tsx
const servicioNuevo = useMemo(() => {
  if (!formData.fecha || !formData.hora) return undefined;
  // ...
}, [formData.fecha, formData.hora, ...]);
```

2. **CustodianStep/index.tsx** (línea 59-61):
```tsx
const isReadyToQuery = isHydrated && servicioNuevo && 
  Boolean(servicioNuevo.fecha_programada) && 
  Boolean(servicioNuevo.hora_ventana_inicio);
```

El `servicioNuevo` del hook depende de `formData` del **CONTEXTO**, pero cuando se navega desde ServiceStep:

```text
Render 1: formData.hora = "" (valor viejo del contexto)
          → servicioNuevo = undefined
          → isReadyToQuery = false
          → query NO se ejecuta con esa key

Render 2: formData.hora = "05:00" (después de que React procesa el setState)
          → servicioNuevo = { hora: "05:00", ... }
          → isReadyToQuery = true
          → query SE EJECUTA y retorna 104 custodios

Render 3: ??? 
          → categorized vuelve a undefined por cambio de key o estado
          → UI muestra 0 custodios
```

### El Bug Real: Query Key Inestable

Mirando `useProximidadOperacional.ts` línea 81-88:
```tsx
const stableKey = servicioNuevo ? [
  servicioNuevo.fecha_programada ?? null,
  servicioNuevo.hora_ventana_inicio ?? null,
  // ...
] : ['sin-servicio'];
```

Cuando `servicioNuevo` oscila entre `undefined` y un valor válido (debido a re-renders por cambios en `formData`), la **query key cambia**:

- Key A: `['custodios-con-proximidad-equitativo', '2026-02-04', '05:00', ...]` → 104 custodios
- Key B: `['custodios-con-proximidad-equitativo', 'sin-servicio']` → undefined

Si el componente se re-renderiza y lee el estado con Key B (que no tiene cache), mostrará 0 custodios.

## Solución Propuesta

### Fix 1: Memoización Estricta del Query Key

Evitar que el key oscile usando un ref estable:

```tsx
// CustodianStep/index.tsx
const stableQueryKey = useRef<string[] | null>(null);

// Solo actualizar el key cuando tengamos datos válidos
useEffect(() => {
  if (servicioNuevo?.fecha_programada && servicioNuevo?.hora_ventana_inicio) {
    stableQueryKey.current = [
      servicioNuevo.fecha_programada,
      servicioNuevo.hora_ventana_inicio,
      servicioNuevo.origen_texto || '',
      servicioNuevo.destino_texto || '',
    ];
  }
}, [servicioNuevo]);

// Usar el key estable para la query
const queryableServicio = stableQueryKey.current 
  ? buildServicioFromKey(stableQueryKey.current) 
  : undefined;
```

### Fix 2: Preservar Cache Durante Oscilaciones

Modificar la query para NO descartar datos cuando el key cambie temporalmente:

```tsx
// useProximidadOperacional.ts
return useQuery({
  queryKey: ['custodios-con-proximidad-equitativo', ...stableKey],
  queryFn: async (): Promise<CustodiosCategorizados> => { ... },
  enabled: isEnabled && stableKey[0] !== 'sin-servicio',
  
  // NUEVO: Mantener datos anteriores mientras se re-fetch
  placeholderData: (previousData) => previousData,
  
  // NUEVO: Incrementar staleTime para evitar refetch innecesarios
  staleTime: 2 * 60 * 1000, // 2 minutos
});
```

### Fix 3: Guard Más Robusto con Retry

En CustodianStep, esperar un poco antes de mostrar "Sin datos":

```tsx
// CustodianStep/index.tsx

// Estado para tracking de intentos
const [queryAttempts, setQueryAttempts] = useState(0);
const maxRetries = 3;

// Si no hay datos después de que la query debería haber terminado, forzar retry
useEffect(() => {
  if (isHydrated && isReadyToQuery && !isLoadingOrPending && !categorized && queryAttempts < maxRetries) {
    const timeoutId = setTimeout(() => {
      console.log(`[CustodianStep] Retry ${queryAttempts + 1}/${maxRetries}`);
      refetchCustodians();
      setQueryAttempts(prev => prev + 1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }
}, [isHydrated, isReadyToQuery, isLoadingOrPending, categorized, queryAttempts]);

// Mostrar loading mientras hay retries pendientes
const isEffectivelyLoading = isLoadingOrPending || 
  (queryAttempts < maxRetries && !categorized && isReadyToQuery);
```

### Fix 4: Debugging Visible en UI (Temporal)

Agregar información de debug visible en desarrollo:

```tsx
{/* Debug panel - solo en desarrollo */}
{import.meta.env.DEV && (
  <div className="text-xs bg-muted p-2 rounded space-y-1 opacity-60">
    <p>isHydrated: {String(isHydrated)}</p>
    <p>formData.fecha: {formData.fecha || '(vacío)'}</p>
    <p>formData.hora: {formData.hora || '(vacío)'}</p>
    <p>servicioNuevo: {servicioNuevo ? 'OK' : 'undefined'}</p>
    <p>isReadyToQuery: {String(isReadyToQuery)}</p>
    <p>isLoading: {String(isLoading)}</p>
    <p>isPending: {String(isPending)}</p>
    <p>categorized: {categorized ? `${custodianCounts.disponibles + custodianCounts.parcialmenteOcupados}` : 'undefined'}</p>
  </div>
)}
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `CustodianStep/index.tsx` | Query key estable con useRef, retry logic, debug panel |
| `useProximidadOperacional.ts` | Agregar `placeholderData`, aumentar `staleTime` |

## Flujo Corregido

```text
1. Usuario navega a CustodianStep
2. Render 1: formData.hora aún vacío
   → servicioNuevo = undefined
   → isReadyToQuery = false
   → UI muestra "Cargando..."

3. Render 2: formData.hora = "05:00"
   → servicioNuevo = válido
   → stableQueryKey.current se actualiza
   → isReadyToQuery = true
   → Query se ejecuta

4. Render 3+: Cualquier re-render...
   → stableQueryKey.current mantiene el valor
   → La misma query key se usa
   → placeholderData mantiene los 104 custodios visibles
   → UI muestra la lista correctamente

5. Si por alguna razón categorized es undefined:
   → Retry automático (hasta 3 veces)
   → Usuario ve "Cargando..." en lugar de "Sin datos"
```

## Beneficios

1. **Query key estable**: Evita oscilaciones por re-renders
2. **Datos persistentes**: `placeholderData` mantiene datos visibles
3. **Auto-recovery**: Retry automático en caso de estado inconsistente
4. **Debugging visible**: Panel de debug ayuda a diagnosticar futuros problemas
5. **UX mejorada**: Usuario nunca ve "Sin datos" incorrectamente

## Riesgo y Mitigación

| Riesgo | Mitigación |
|--------|------------|
| Datos stale mostrados | `staleTime` de 2 min es aceptable para este caso de uso |
| Retries infinitos | Límite de 3 retries |
| Debug panel en producción | Condicionado a `import.meta.env.DEV` |
