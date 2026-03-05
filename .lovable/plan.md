

# Diagnóstico: Zoom 0.7 y espacio vertical desperdiciado en Tiempos

## Problema

La tabla de Tiempos usa `max-h-[calc(100vh-280px)]` (línea 286 de `ServiceTimesTable.tsx`), pero con zoom 0.7 el viewport real es 1.43x más alto. `100vh` a zoom 0.7 equivale solo al 70% de la pantalla real, dejando ~30% de espacio muerto abajo.

El resto del sistema ya usa variables CSS compensadas:
- `--content-height-with-tabs: calc(var(--vh-full) - 120px)` donde `--vh-full = calc(100vh * 1.4286)`
- Bitácora Board y Command Center ya usan estas variables

## Corrección

**`ServiceTimesTable.tsx` línea 286**: Cambiar el contenedor de scroll de:
```
max-h-[calc(100vh-280px)]
```
a:
```
max-h-[calc(var(--content-height-with-tabs,calc(100vh-200px))-100px)]
```

Esto alinea el comportamiento con Bitácora y Command Center, usando la altura compensada por zoom menos el espacio del header/filtros del Card.

Un solo cambio, una línea.

