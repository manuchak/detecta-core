

# Mostrar count de gastos pendientes en el pill del Coordinador

## Problema
El pill de "Gastos" en la barra lateral del Coordinador tiene `count={0}` hardcodeado. No hay indicación visual de solicitudes pendientes hasta que se abre el drawer.

## Cambio

### `CoordinatorCommandCenter.tsx`

1. Agregar una query ligera (count only) a `solicitudes_apoyo_extraordinario` con `estado = 'pendiente'`:

```typescript
const { data: gastosPendientes = 0 } = useQuery({
  queryKey: ['gastos-pendientes-count'],
  queryFn: async () => {
    const { count } = await supabase
      .from('solicitudes_apoyo_extraordinario')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente');
    return count || 0;
  },
  refetchInterval: 30_000,
});
```

2. Actualizar el FooterPill de Gastos:
```typescript
<FooterPill
  icon={<Receipt className="h-3.5 w-3.5" />}
  label="Gastos"
  count={gastosPendientes}
  panel="gastos"
  variant={gastosPendientes > 0 ? 'warning' : 'default'}
/>
```

### Archivo afectado
- `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` — agregar query de count y conectar al pill

