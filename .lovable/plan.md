

# Bug: "invalid input syntax for type uuid: 'provider-...'"

## Causa raíz

En `ReassignmentModal.tsx` línea 373, cuando se selecciona un proveedor externo, `selectedId` tiene el valor prefijado `"provider-{uuid}"` (usado para distinguir en el Select). Este valor se pasa como `newId` al mutation:

```tsx
newId: selectedId || undefined,  // ← "provider-405b254c-e486-463c-..."
```

En `useServiciosPlanificados.ts` línea 751, ese valor se escribe directamente en `armado_id` (columna UUID):

```tsx
armado_id: newArmadoId,  // ← "provider-..." no es un UUID válido
```

## Solución

En `ReassignmentModal.tsx` línea 373, cuando el tipo es `proveedor`, pasar `undefined` como `newId` (ya que no hay un armado interno):

```tsx
newId: selectedType === 'proveedor' ? undefined : (selectedId || undefined),
```

**1 archivo, 1 línea.**

