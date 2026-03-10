

# Fix: PauseOverlay no es visualmente prominente

## Problema

1. El overlay solo cubre el grid de columnas (line 121-131), no la `MonitoristaAssignmentBar` ni el filtro de coordinador — el monitorista sigue viendo elementos interactivos arriba
2. `bg-background/80` con `backdrop-blur-md` es demasiado sutil — se confunde con la interfaz normal
3. `opacity-10` en el grid es tan bajo que parece vacío, no "pausado"

## Fix

### `PauseOverlay.tsx` — Hacer el overlay visualmente inconfundible

- Cambiar de `absolute inset-0` a `fixed inset-0` con `z-[100]` para cubrir toda la pantalla
- Fondo más opaco y con color distintivo: `bg-background/95` 
- Agregar un borde/banner superior con color de acento para señalizar estado
- Aumentar el tamaño del timer y del ícono
- Agregar una animación sutil de breathing al contenedor principal

### `BitacoraBoard.tsx` — Simplificar integración

- Mover el `PauseOverlay` fuera del `relative` div — renderizarlo al nivel raíz del return ya que ahora es `fixed`
- Eliminar las clases `pointer-events-none select-none opacity-10` del grid (el overlay fixed ya lo cubre todo)

### Resultado visual esperado

```text
┌─────────────────────────────────────┐
│  ██████ PAUSA DE DESAYUNO ████████  │  ← banner colored top
│                                     │
│          ☀️ (ícono grande)          │
│                                     │
│           14:32                     │  ← timer xxl
│       ═══════════════               │  ← progress bar
│    "Servicios atendidos por equipo" │
│                                     │
│      [ Retomar mis servicios ]      │
│                                     │
└─────────────────────────────────────┘
```

Pantalla completa, sin ambigüedad. 2 archivos, ~15 líneas cambiadas.

