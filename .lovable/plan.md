

# Mover pills del footer a una barra lateral

## Problema
Las pills de acción (Correcciones, Entregas, Gastos, Abandonados) están en un footer horizontal que queda fuera de vista en pantalla.

## Cambio

Convertir el footer toolbar (líneas 422-451) en una **barra lateral derecha fija** con las pills apiladas verticalmente. El layout principal pasa de `flex-col` a usar una estructura con la grilla de agentes a la izquierda y una columna estrecha (~48px colapsada, mostrando solo iconos+badge) a la derecha.

### Layout nuevo

```text
┌─────────────────────────────────┬────┐
│  HEADER                         │    │
├─────────────────────────────────┤ P  │
│                                 │ I  │
│  SCROLL AREA (grilla agentes)   │ L  │
│                                 │ L  │
│                                 │ S  │
└─────────────────────────────────┴────┘
```

### Detalle
- La columna lateral tendrá `flex-col gap-2 py-3 px-1.5 border-l bg-card/90` con las 4 pills orientadas verticalmente (icono + badge, sin texto label para ahorrar espacio)
- Se mantiene el tooltip con el label completo al hacer hover
- Los Sheet drawers no cambian

### Archivo afectado
- `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` — mover pills de footer a sidebar derecha

