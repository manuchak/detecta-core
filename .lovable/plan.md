

# Bitácora: Flujo vertical por columna en "En Curso"

## Problema actual

La grilla `grid-cols-2` llena las tarjetas de izquierda a derecha (fila por fila). El sketch del usuario muestra que quieren flujo **columna por columna**: primero se llena toda la columna izquierda de arriba abajo, luego la derecha. Esto reduce errores porque el monitorista sigue un orden visual natural descendente.

## Propuesta de altura

Basado en las dimensiones del tablero:

- **Altura disponible del panel**: ~`100vh - 170px` (header + tabs + buscador)
- **Altura por tarjeta**: ~85px (3 filas de info + padding)
- **Tarjetas visibles por columna**: ~8-9 en pantalla 1080p

La altura **no necesita fijarse manualmente** — cada columna ocupará `flex-1` (50% de la altura disponible no aplica, sino 100% de altura) con scroll independiente. La clave es dividir el array de servicios en dos mitades y renderizar cada mitad en su propia columna scrollable.

```text
Flujo actual (grid row-first):     Propuesta (column-first):
┌─────┬─────┐                      ┌─────┬─────┐
│  1  │  2  │                      │  1  │  5  │
│  3  │  4  │                      │  2  │  6  │
│  5  │  6  │                      │  3  │  7  │
│  7  │  8  │                      │  4  │  8  │
└─────┴─────┘                      └─────┴─────┘
```

## Implementación

### `BoardColumnEnCurso.tsx` — Cambio de layout

Reemplazar el `grid grid-cols-2` por dos columnas `flex` independientes:

1. Dividir `filtered` en dos mitades: `leftCol = filtered.slice(0, half)`, `rightCol = filtered.slice(half)`
2. Renderizar dos `div` lado a lado, cada uno con `overflow-y-auto` independiente
3. Las tarjetas fluyen de arriba hacia abajo dentro de cada columna
4. Ambas columnas ocupan `flex-1` en ancho (50/50) y `h-full` en altura

```tsx
const half = Math.ceil(filtered.length / 2);
const leftCol = filtered.slice(0, half);
const rightCol = filtered.slice(half);

<div className="flex-1 flex gap-2 min-h-0">
  <div className="flex-1 overflow-y-auto space-y-1.5">
    {leftCol.map(s => <ServiceCard ... />)}
  </div>
  <div className="flex-1 overflow-y-auto space-y-1.5">
    {rightCol.map(s => <ServiceCard ... />)}
  </div>
</div>
```

| Archivo | Cambio |
|---------|--------|
| `BoardColumnEnCurso.tsx` | Reemplazar grid por dos columnas flex con scroll independiente |

