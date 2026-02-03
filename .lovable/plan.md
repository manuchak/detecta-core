
# Plan: Corregir Sidebar Cortado que Obliga a Scroll

## Diagnóstico

El sidebar se corta porque:

1. **TopBar está fuera del SidebarProvider**: En `UnifiedLayout.tsx`, el `SimplifiedTopBar` (altura `h-14` = 3.5rem) está renderizado antes del `SidebarProvider`
2. **Sidebar usa posicionamiento fixed desde top:0**: El componente `Sidebar` de shadcn tiene hardcodeado `fixed inset-y-0 h-svh`, lo que significa:
   - `inset-y-0` = `top: 0; bottom: 0`
   - `h-svh` = `height: 100svh`
3. **Resultado**: El sidebar tiene 100% del viewport de altura pero empieza desde y=0, mientras que el contenido visible empieza después del TopBar (y=3.5rem). Esto causa que los últimos 3.5rem del sidebar queden fuera del viewport, obligando al scroll interno.

## Solución

Modificar el componente `Sidebar` base para respetar la altura del TopBar.

### Archivo: `src/components/ui/sidebar.tsx`

**Cambios en líneas 223-244** (el div contenedor del sidebar desktop):

Cambiar:
```tsx
<div
  className={cn(
    "duration-200 relative h-svh w-[--sidebar-width] bg-transparent...",
  )}
/>
<div
  className={cn(
    "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width]...",
  )}
>
```

A:
```tsx
<div
  className={cn(
    "duration-200 relative h-[calc(100svh-3.5rem)] w-[--sidebar-width] bg-transparent...",
  )}
/>
<div
  className={cn(
    "duration-200 fixed top-14 bottom-0 z-10 hidden h-[calc(100svh-3.5rem)] w-[--sidebar-width]...",
  )}
>
```

**Cambios específicos**:

| Original | Nuevo | Razón |
|----------|-------|-------|
| `h-svh` | `h-[calc(100svh-3.5rem)]` | Restar altura del TopBar |
| `inset-y-0` | `top-14 bottom-0` | Iniciar desde debajo del TopBar |

### Impacto

- El sidebar ahora iniciará visualmente debajo del TopBar
- El contenido del sidebar cabrá exactamente en el espacio disponible
- No más scroll interno innecesario
- El footer del sidebar (Quick Stats) será visible sin scroll

## Verificación Post-Implementación

1. El sidebar debe mostrar todos los grupos de navegación sin scroll (a menos que haya muchos módulos expandidos)
2. El footer "Vista Rápida" debe ser visible al fondo
3. El colapsar/expandir sidebar debe seguir funcionando correctamente
4. En móvil (Sheet), el comportamiento no debe cambiar (usa `h-full`)

## Alternativa Considerada (No Elegida)

Mover `SimplifiedTopBar` dentro del `SidebarProvider` - rechazado porque:
- Requeriría reestructurar múltiples layouts
- El TopBar conceptualmente es global, no parte del sidebar
- Mayor riesgo de regresiones
