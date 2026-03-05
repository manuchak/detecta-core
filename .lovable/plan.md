

# Fix: Validación de folio duplicado no excluye servicios cancelados

## Problema

Axel sigue viendo "El ID de servicio 'TEOVTEL-790' ya existe" porque la migración SQL (partial unique index) solo resuelve el constraint a nivel de base de datos, pero hay **3 validaciones en el frontend** que hacen queries sin filtrar cancelados:

1. **`EditServiceForm.tsx` línea 178-183** — Debounce validation en el useEffect
2. **`EditServiceForm.tsx` línea 249-254** — `validateServiceId()` al guardar
3. **`useServiciosPlanificados.ts` línea 155-159** — Validación pre-INSERT en creación

Las 3 queries usan `.eq('id_servicio', newId)` sin excluir `estado_planeacion = 'cancelado'`.

## Fix

Agregar `.neq('estado_planeacion', 'cancelado')` a las 3 queries:

### Archivo 1: `src/components/planeacion/EditServiceForm.tsx`

**Línea 182** (debounce validation):
```typescript
.eq('id_servicio', debouncedServiceId)
.neq('id', service?.id || '')
.neq('estado_planeacion', 'cancelado')  // ← agregar
.maybeSingle();
```

**Línea 253** (validateServiceId):
```typescript
.eq('id_servicio', newId)
.neq('id', service?.id || '')
.neq('estado_planeacion', 'cancelado')  // ← agregar
.maybeSingle();
```

### Archivo 2: `src/hooks/useServiciosPlanificados.ts`

**Línea 158** (pre-INSERT check):
```typescript
.eq('id_servicio', data.id_servicio)
.neq('estado_planeacion', 'cancelado')  // ← agregar
.maybeSingle();
```

3 líneas agregadas, cero cambios de lógica. Alinea el frontend con el partial unique index de la base de datos.

