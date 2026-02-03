
# Plan: Fix Bug de Sincronización en Reactivación de Bajas

## Problema

Cuando se reactiva un operativo desde la pestaña "Bajas", el cambio se refleja en las tarjetas de estadísticas pero NO en el listado de "Custodios/Armados" al cambiar de tab.

## Causa Raíz

1. **staleTime de 5 minutos**: Las queries de `useOperativeProfiles` tienen `staleTime: 5 * 60 * 1000`, lo que causa que TanStack Query no refetch inmediatamente después de `invalidateQueries`
2. **invalidateQueries vs refetch**: `invalidateQueries` marca queries como "stale" pero no fuerza un refetch si la query no tiene observers activos o si el staleTime no ha expirado
3. **Bug secundario**: La query de armados filtra solo por `estado = 'activo'` y no incluye `'suspendido'`

## Solución

### 1. Modificar `useCambioEstatusOperativo.ts`

Cambiar de `invalidateQueries` a `refetchQueries` para forzar un refetch inmediato:

```typescript
// ANTES (líneas 110-114)
queryClient.invalidateQueries({ queryKey: ['custodios'] });
queryClient.invalidateQueries({ queryKey: ['operative-profiles'] });

// DESPUÉS
await queryClient.refetchQueries({ queryKey: ['operative-profiles'] });
queryClient.invalidateQueries({ queryKey: ['custodios'] });
queryClient.invalidateQueries({ queryKey: ['armados'] });
```

### 2. Modificar `useReactivacionMasiva.ts`

Aplicar el mismo fix para reactivación masiva.

### 3. Fix secundario en `useOperativeProfiles.ts`

Corregir la query de armados para incluir suspendidos:

```typescript
// ANTES (línea 179)
.eq('estado', 'activo')

// DESPUÉS
.in('estado', ['activo', 'suspendido'])
```

### 4. Reducir staleTime (opcional pero recomendado)

Reducir el staleTime a 1 minuto para mejor UX:

```typescript
staleTime: 1 * 60 * 1000 // 1 minuto
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCambioEstatusOperativo.ts` | Usar `refetchQueries` en lugar de solo `invalidateQueries` |
| `src/hooks/useReactivacionMasiva.ts` | Mismo fix para reactivación masiva |
| `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts` | Fix query armados + reducir staleTime |

## Resultado Esperado

- Al reactivar un operativo, el listado se actualiza inmediatamente
- Las estadísticas y listas permanecen sincronizadas
- Los armados suspendidos también aparecen en su listado correspondiente
