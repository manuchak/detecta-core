

# Fishbone: Referencia eliminada pero sigue apareciendo

## Causa Raíz

```text
                ┌──────────────────────────────┐
                │  Toast dice "eliminada" pero  │
                │  la referencia sigue visible  │
                └──────────────┬───────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   RLS Policies           Frontend               Supabase
   ────────────           ────────               ────────
   NO existe policy       No valida              .delete() con
   DELETE en tabla        filas afectadas         RLS no lanza
   referencias_candidato  (error=null → toast     error, solo
                          "eliminada")            retorna 0 rows
```

**La tabla `referencias_candidato` tiene 3 policies RLS:**
- SELECT → `has_supply_read_role()`
- INSERT → `has_supply_role()`
- UPDATE → `has_supply_role()`
- **DELETE → NO EXISTE**

Supabase con RLS habilitado y sin policy DELETE simplemente no elimina ninguna fila, pero **no retorna error**. El frontend ve `error = null`, dispara `onSuccess`, muestra el toast "Referencia eliminada", invalida queries, y el refetch trae la misma fila intacta.

## Fix

1. **Migración SQL**: Crear policy DELETE en `referencias_candidato` usando `has_supply_role()`
2. **Frontend defensivo**: Validar que la operación realmente eliminó filas (opcional pero recomendado)

```sql
CREATE POLICY "Supply puede eliminar referencias"
ON public.referencias_candidato
FOR DELETE
TO authenticated
USING (has_supply_role());
```

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Agregar policy DELETE con `has_supply_role()` |
| `src/hooks/useReferencias.ts` | (Opcional) Verificar `.delete()` retorna rows afectadas |

