
# Análisis de Causa Raíz: Desalineación de Dropdowns

## Diagnóstico Técnico

### Causa Principal Identificada

El bug se origina por **múltiples factores CSS que interfieren con el cálculo de posición de los Portales de Radix UI**:

#### Factor 1: CSS Zoom en HTML (CRÍTICO)
```css
/* src/index.css línea 133-135 */
html {
  zoom: 0.7;
}
```

Cuando se aplica `zoom` al elemento raíz:
- `getBoundingClientRect()` devuelve coordenadas **con el zoom aplicado**
- Los portales se renderizan con `position: fixed` en el `<body>`
- El cálculo de Radix UI asume coordenadas sin zoom
- **Resultado**: El dropdown se posiciona en coordenadas incorrectas (escaladas al 70%)

#### Factor 2: backdrop-filter en Cards
```css
/* src/index.css línea 226 */
.apple-card {
  backdrop-filter: blur(20px);
}
```

`backdrop-filter` crea un **nuevo containing block** para elementos `position: fixed`. Esto significa que los portales insertados en el `<body>` pueden calcular mal su posición relativa a triggers dentro de cards con este estilo.

#### Factor 3: overflow-auto en Table
```tsx
/* src/components/ui/table.tsx línea 9 */
<div className="relative w-full overflow-auto">
  <table ... />
</div>
```

Cuando el trigger está dentro de un contenedor con `overflow: auto`, el scroll horizontal/vertical puede hacer que las coordenadas del trigger cambien sin que el portal se reposicione.

### Por qué los dropdowns aparecen en la esquina superior

El cálculo de posición falla así:
1. Trigger en fila de Abel Cruz tiene coordenadas reales: `{x: 650, y: 700}`
2. Con zoom 0.7, `getBoundingClientRect()` devuelve: `{x: 455, y: 490}`
3. Radix posiciona el portal en: `{x: 455, y: 490}` (sin corregir zoom)
4. El resultado visual: dropdown aparece desplazado hacia arriba-izquierda

---

## Solución Propuesta

### Enfoque: Compensación de Zoom en los Componentes de Portal

Modificar los componentes `PopoverContent` y `SelectContent` para:

1. **Agregar `updatePositionStrategy="always"`** para recalcular posición en cada render
2. **Usar `avoidCollisions`** para ajustar automáticamente cuando hay colisiones
3. **Aplicar corrección de zoom** mediante estilos inline que compensen el factor 0.7

### Cambio 1: PopoverContent (src/components/ui/popover.tsx)

```tsx
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      // Agregar estas props:
      avoidCollisions={true}
      collisionPadding={10}
      sticky="partial"
      className={cn(
        "z-[100] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ...",
        className
      )}
      style={{
        // Compensar el zoom de 0.7 aplicado a html
        zoom: 1.428571, // 1 / 0.7
      }}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
```

### Cambio 2: SelectContent (src/components/ui/select.tsx)

```tsx
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(...)}
      position={position}
      // Agregar:
      avoidCollisions={true}
      collisionPadding={10}
      style={{
        zoom: 1.428571, // Compensar zoom
      }}
      {...props}
    >
      ...
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
```

### Cambio 3: Opción alternativa - Eliminar backdrop-filter del card padre

Si la compensación de zoom no es suficiente, también se puede:

```tsx
// En CustodiosDataTable, envolver la tabla sin backdrop-filter
<div className="[&_.apple-card]:backdrop-filter-none">
  <DataTable ... />
</div>
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/popover.tsx` | Agregar `avoidCollisions`, `collisionPadding`, `sticky`, y `style={{ zoom: 1.428571 }}` |
| `src/components/ui/select.tsx` | Agregar mismas props de colisión y corrección de zoom |

---

## Impacto Esperado

| Antes | Después |
|-------|---------|
| Dropdown aparece en esquina superior izquierda | Dropdown aparece alineado bajo el trigger |
| Coordenadas calculadas incorrectamente por zoom | Zoom compensado en el portal |
| No detecta colisiones con bordes | Reposiciona automáticamente si hay colisión |

---

## Consideraciones Técnicas

1. **La corrección `zoom: 1.428571`** (que es `1/0.7`) cancela el efecto del zoom global aplicado al `<html>`, haciendo que el portal se renderice en tamaño correcto

2. **`avoidCollisions={true}`** hace que Radix recalcule posición si el dropdown se saldría del viewport

3. **`collisionPadding={10}`** deja un margen de 10px con los bordes del viewport

4. **`sticky="partial"`** mantiene el dropdown visible parcialmente incluso al scrollear

5. **Nota de rendimiento**: La prop `updatePositionStrategy="always"` podría impactar rendimiento en listas muy largas, pero es necesaria para tablas con scroll

---

## Validación Post-Implementación

Después de aplicar los cambios, verificar:
- Dropdown de Zona se abre directamente bajo el botón trigger en la fila correcta
- Dropdown de Preferencia se abre alineado con su selector
- Al hacer scroll horizontal en la tabla, los dropdowns abiertos se cierran o reposicionan
- El tamaño de los dropdowns es consistente (no se ven escalados)
