

# Fix: UI Móvil del Módulo de Monitoreo

## Problemas identificados (del screenshot)

1. **BoardColumnEnCurso usa 2 columnas** — las tarjetas se renderizan side-by-side (`flex gap-2` con `flex-1` × 2), haciendo el texto ilegible y truncado en 390px
2. **Textos microscópicos** — font sizes de 8px, 10px, 11px en tarjetas que ya están comprimidas en media pantalla
3. **Popovers se superponen** — `CheckpointPopover` usa `Popover` (w-80 = 320px) que en 390px viewport clipea o se superpone a las tarjetas
4. **DropdownMenu de eventos especiales** — se abre dentro de tarjetas apretadas y queda cortado

## Solución

### 1. BoardColumnEnCurso — Single column en mobile
Detectar `useIsMobile()` y renderizar una sola columna en vez de dos. Las tarjetas ocuparán el ancho completo.

### 2. Tarjetas móviles más legibles
Crear variantes mobile-aware de `ServiceCardActive` y `ServiceCardEnDestino`:
- Subir font sizes: cliente de `text-xs` → `text-sm`, custodio de `text-[11px]` → `text-xs`, folio de `text-[10px]` → `text-xs`
- Timer hero más grande: de `text-lg` → `text-xl`
- Padding de `px-3 py-3` → `px-4 py-4`
- Touch targets: botones de acción de `h-6` → `h-9` con `min-h-[44px]`
- Badges de tipo de `text-[8px]` → `text-[10px]`

### 3. CheckpointPopover → Drawer en mobile
Usar `useIsMobile()` en `CheckpointPopover`. Si es mobile, renderizar un `Drawer` (Vaul) en vez de `Popover`. Mismo contenido, pero full-width sheet desde abajo.

### 4. DropdownMenu — side="top" en mobile  
Forzar `side="top"` en el `DropdownMenuContent` cuando es mobile para evitar que se corte contra el borde inferior.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `BoardColumnEnCurso.tsx` | Single column en mobile via `useIsMobile()` |
| `ServiceCardActive.tsx` | Font sizes, padding, touch targets más grandes en mobile |
| `ServiceCardEnDestino.tsx` | Mismos ajustes de legibilidad |
| `ServiceCardPending.tsx` | Mismos ajustes de legibilidad |
| `CheckpointPopover.tsx` | Drawer en mobile en vez de Popover |

5 archivos, cambios quirúrgicos con `useIsMobile()` para no afectar desktop.

