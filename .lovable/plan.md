

# Fix: Mapa no disponible + Scroll pegado en Pulso Operativo

## Bug 1: Mapa no disponible

**Causa raíz**: `RouteMap` en `AlertServiceDrawer.tsx` lee `MAPBOX_ACCESS_TOKEN` de forma síncrona (línea 88), pero este valor comienza como string vacío (`''`). Solo se llena cuando algún otro componente (como el mapa del Radar) llama a `initializeMapboxToken()`. Si el drawer se abre antes de que eso ocurra, el token está vacío y muestra "Mapa no disponible".

**Solución**: Hacer que `RouteMap` use un `useState` + `useEffect` para llamar a `initializeMapboxToken()` de forma asíncrona. Mientras carga, mostrar un skeleton. Una vez obtenido el token, construir la URL del Static API normalmente.

### Cambio en `src/components/executive/AlertServiceDrawer.tsx`

- Importar `useState`, `useEffect` y `initializeMapboxToken`
- Reescribir `RouteMap` para cargar el token async antes de renderizar la imagen

## Bug 2: Scroll pegado en Pulso Operativo

**Causa raíz**: El contenedor `<div className="space-y-4 max-w-lg mx-auto">` del `MobileOperationalDashboard` no tiene padding-bottom. Al hacer scroll hasta el fondo dentro del `<main className="flex-1 overflow-auto">` de `UnifiedLayout`, el último elemento queda pegado al borde y el gesto de scroll-up compite con el bounce/overscroll del navegador móvil. Además, los drawers de vaul pueden capturar gestos táctiles.

**Solución**: Agregar `pb-24` al contenedor principal del `MobileOperationalDashboard` para dar espacio de respiración al final, y añadir `overscroll-behavior-y-contain` al mismo contenedor para evitar que el scroll se propague al contenedor padre.

### Cambio en `src/components/executive/MobileOperationalDashboard.tsx`

Línea 248: cambiar de:
```
<div className="space-y-4 max-w-lg mx-auto">
```
a:
```
<div className="space-y-4 max-w-lg mx-auto pb-24" style={{ overscrollBehaviorY: 'contain' }}>
```

## Resumen de archivos

| Archivo | Cambio |
|---------|--------|
| `AlertServiceDrawer.tsx` | RouteMap carga token async con `initializeMapboxToken()` |
| `MobileOperationalDashboard.tsx` | Agregar `pb-24` y `overscroll-behavior-y: contain` |

