

# Alinear visibilidad de monitorista con vista de coordinador

## Problema
La query "inferred" que agregamos (desde `servicio_eventos_ruta.registrado_por`) trae servicios extra que el monitorista tocó en algún momento pero que el coordinador ya no tiene asignados a ese agente. Esto rompe la paridad entre ambas vistas.

## Solución
Eliminar la query "inferred" de `assignedIdsQuery`. La única fuente de verdad debe ser `bitacora_asignaciones_monitorista` con `activo = true` — exactamente lo que el coordinador gestiona.

## Cambio

**`src/hooks/useBitacoraBoard.ts`** — simplificar `assignedIdsQuery` (líneas 71-100):

- Eliminar la segunda query a `servicio_eventos_ruta`
- Eliminar el merge de Sets
- Devolver solo los `servicio_id` de asignaciones formales activas

```typescript
const assignedIdsQuery = useQuery({
  queryKey: ['bitacora-my-assignments', user?.id],
  queryFn: async () => {
    if (!user?.id) return [];
    const { data, error } = await supabase
      .from('bitacora_asignaciones_monitorista')
      .select('servicio_id')
      .eq('monitorista_id', user.id)
      .eq('activo', true);
    if (error) throw error;
    return (data || []).map((r: any) => r.servicio_id);
  },
  enabled: needsFilter && !!user?.id,
  refetchInterval: 30_000,
  staleTime: 10_000,
});
```

Esto garantiza que el monitorista ve exactamente los mismos servicios que el coordinador le tiene asignados. Si hay un servicio faltante, la solución correcta es que el coordinador lo asigne, no que aparezca "mágicamente" por actividad histórica.

