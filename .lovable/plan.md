

# Bug: Iconos se ven como cuadrados de color en iOS Safari

## Causa Raíz

Es un **bug conocido de WebKit/Safari**: cuando un elemento tiene `backdrop-filter` (como `.liquid-glass-app` con `blur(20px)`), los SVGs hijos pueden **no renderizarse**. Safari crea una capa de compositing para el backdrop-filter y en ciertos casos los SVG inline (los iconos de Lucide) simplemente no se pintan. Lo que el usuario ve es solo el `div` con `backgroundColor: ${module.color}15` — sin el icono SVG encima.

En la screenshot se confirma: los cuadrados coloreados son el contenedor `p-2 rounded-xl` con el color de fondo, pero el `<Icon>` SVG dentro es invisible.

## Solución

Forzar un **nuevo contexto de compositing** en el contenedor del icono para que Safari lo renderice en su propia capa, independiente del backdrop-filter del padre.

### `src/components/home/ModuleGrid.tsx`

Agregar `style={{ transform: 'translateZ(0)' }}` (o `will-change: transform`) al div que contiene el icono. Esto crea una nueva capa GPU y resuelve el bug de WebKit:

```tsx
<div 
  className="p-2 rounded-xl"
  style={{ 
    backgroundColor: `${module.color}15`,
    transform: 'translateZ(0)',  // ← Fuerza nueva capa, fix iOS Safari
  }}
>
  <Icon 
    className="h-6 w-6" 
    style={{ color: module.color }}
  />
</div>
```

### Opcional — Aplicar lo mismo a `.liquid-glass-app` en CSS

Como medida preventiva, agregar `isolation: isolate` al contenedor glass en `src/index.css` para que todos los hijos tengan su propio stacking context:

```css
.liquid-glass-app {
  /* ... existing styles ... */
  isolation: isolate;
}
```

### Archivos a modificar
- `src/components/home/ModuleGrid.tsx` — agregar `transform: translateZ(0)` al wrapper del icono
- `src/index.css` — agregar `isolation: isolate` a `.liquid-glass-app`

Cambio mínimo, sin impacto visual, resuelve el bug de rendering en iOS Safari.

