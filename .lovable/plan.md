

# Compactar tarjetas móviles de Bitácora

## Problema

En el screenshot se ve que 2 tarjetas "En Destino" ocupan el 100% del viewport (743px). Causas:
- `ServiceCardEnDestino`: `p-4 py-5` + `space-y-2.5` + nombre cliente `text-base` + 2 botones full-width apilados (`h-11` + `h-10`) = ~280px por tarjeta
- `ServiceCardActive`: `px-4 py-4` + `mt-3` entre filas + botones `h-9` = ~180px por tarjeta
- Ambas usan demasiado espacio vertical en elementos que pueden condensarse

## Solución: Layout compacto en móvil

### ServiceCardEnDestino — de ~280px a ~120px
- Eliminar `space-y-2.5` → usar gaps mínimos (`gap-1`)
- Badge "EN DESTINO" + timer en una sola línea compacta (`text-[10px]`)
- Cliente `text-sm` (no `text-base`)
- Custodio + comm en línea, sin padding extra
- **Botones side-by-side** en vez de stacked: `[Liberar] [Revertir]` en una fila con `flex gap-2`
- Botones `h-9` (no `h-11`)
- Padding `p-3` (no `p-4 py-5`)

### ServiceCardActive — de ~180px a ~110px
- Padding `px-3 py-2.5` (no `px-4 py-4`)
- Timer `text-lg` (no `text-xl`)
- Row 3 spacing `mt-1.5` (no `mt-3`)
- Botones de acción `h-8` (no `h-9 min-h-[44px]`) — mantener tocables pero no excesivos

### ServiceCardPending — ya es compacta, ajuste menor
- Padding `px-3 py-2` (no `px-4 py-3`)

## Resultado esperado

~4-5 tarjetas visibles por pantalla en vez de 2, manteniendo legibilidad y funcionalidad.

## Archivos

| Archivo | Cambio |
|---|---|
| `ServiceCardEnDestino.tsx` | Layout compacto: gaps reducidos, botones side-by-side, padding menor |
| `ServiceCardActive.tsx` | Padding y spacing reducidos |
| `ServiceCardPending.tsx` | Ajuste menor de padding |

