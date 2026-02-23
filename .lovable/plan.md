

# Fix: GMV MTD truncado por límite de 1,000 filas en KPIs Bar

## Problema

La tarjeta "GMV MTD" muestra $4.59M mientras el grafico MoM muestra $4.7M para febrero. La causa raiz es que `ExecutiveKPIsBar.tsx` hace un query directo a `servicios_custodia` **sin paginacion**, lo que trunca los resultados a 1,000 filas (limite por defecto de Supabase). El grafico MoM usa un RPC server-side que no tiene este limite.

## Solucion

Agregar paginacion al query de `ExecutiveKPIsBar` usando el mismo patron `fetchAllPaginated` que ya existe en `useExecutiveMultiYearData.ts`.

## Cambios

### 1. `src/components/executive/ExecutiveKPIsBar.tsx`

- Importar o duplicar la funcion `fetchAllPaginated` desde `useExecutiveMultiYearData`
- Reemplazar los dos queries directos (current y prev) con llamadas paginadas
- Esto asegura que todos los servicios del mes se incluyan en el calculo de GMV, servicios, clientes, custodios y armados

**Antes (truncado a 1,000 filas):**
```ts
const { data: currentServices } = await supabase
  .from('servicios_custodia')
  .select('id, cobro_cliente, ...')
  .gte('fecha_hora_cita', currentRange.start)
  .lte('fecha_hora_cita', currentRange.end)
  .not('estado', 'eq', 'Cancelado');
```

**Despues (paginado):**
```ts
const currentServices = await fetchAllPaginated(() =>
  supabase
    .from('servicios_custodia')
    .select('id, cobro_cliente, ...')
    .gte('fecha_hora_cita', currentRange.start)
    .lte('fecha_hora_cita', currentRange.end)
    .not('estado', 'eq', 'Cancelado')
);
```

### 2. Extraer `fetchAllPaginated` a utilidad compartida (opcional pero recomendado)

Mover la funcion `fetchAllPaginated` de `useExecutiveMultiYearData.ts` a un archivo de utilidad (e.g., `src/utils/supabasePagination.ts`) para reutilizarla en ambos componentes sin duplicar codigo.

## Impacto

- Los KPIs (Servicios, GMV MTD, AOV, Clientes, Custodios, Armados) mostraran valores consistentes con el grafico MoM
- Sin cambios visuales ni de esquema
- Patron ya probado en el hook multi-year

