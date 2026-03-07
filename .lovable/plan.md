

# Plan Revisado: Solo 2 Bugs

Se eliminan todos los cambios a pestañas executive, starmap y kpis del dashboard.

---

## Bug 1: Scroll pegado en pestaña Operativo

**Causa raíz**: Vaul (drawer) manipula `body.style.overflow` al abrir/cerrar. Combinado con `overscroll-y-contain` en `<main>`, el scroll queda atrapado al intentar subir desde el fondo.

**Cambios**:

### `src/layouts/UnifiedLayout.tsx`
- Quitar `overscroll-y-contain` del `<main>`. Dejar: `overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]`

### `src/components/executive/MobileOperationalDashboard.tsx`
- Quitar `touch-pan-y` del contenedor
- Agregar limpieza forzada de body overflow al cerrar cada drawer:
```typescript
const handleDrawerChange = (open: boolean, setter: Function) => {
  if (!open) {
    setter(null);
    requestAnimationFrame(() => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    });
  }
};
```
- Usar este handler en `onOpenChange` de `AlertServiceDrawer` y `PhaseServicesDrawer`

---

## Bug 2: Iconos como cuadrados de colores en Home móvil

**Cambios**:

### `src/components/home/MobileHomeLayout.tsx`
- Aumentar icono a `h-7 w-7` con `strokeWidth={1.5}` explícito para mejorar visibilidad

### `src/index.css`
- En `.liquid-glass-app-mobile`: reducir `backdrop-filter` blur de 20px a 12px

---

**Archivos tocados**: 4 archivos, 0 cambios a pestañas executive/starmap/kpis.

