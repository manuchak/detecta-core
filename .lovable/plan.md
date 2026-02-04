
# Plan: Compensacion de Zoom para Dialog y Sheet

## Problema
Los componentes `Dialog` y `Sheet` no tienen la compensacion de zoom (`1.428571`) que ya se aplico a otros componentes de portal como `Popover`, `Tooltip`, `Select`, y `DropdownMenu`. Esto causa que los modales y paneles laterales se vean al 70% de su tamano esperado debido al zoom global de `0.7` en `index.css`.

## Solucion
Agregar `style={{ zoom: 1.428571 }}` a los componentes de contenido de Dialog y Sheet, siguiendo el patron ya establecido en otros componentes.

## Cambios Tecnicos

### Archivo 1: `src/components/ui/dialog.tsx`

**Lineas 37-43** - Agregar style con zoom al DialogPrimitive.Content:

```tsx
<DialogPrimitive.Content
  ref={ref}
  className={cn(
    "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
    className
  )}
  style={{ zoom: 1.428571 }}  // <-- AGREGAR ESTA LINEA
  {...props}
>
```

### Archivo 2: `src/components/ui/sheet.tsx`

**Lineas 60-63** - Agregar style con zoom al SheetPrimitive.Content:

```tsx
<SheetPrimitive.Content
  ref={ref}
  className={cn(sheetVariants({ side }), className)}
  style={{ zoom: 1.428571 }}  // <-- AGREGAR ESTA LINEA
  {...props}
>
```

## Resultado Esperado
- Los modales (Dialog) se mostraran al 100% de su tamano diseñado
- Los paneles laterales (Sheet) se mostraran al 100% de su tamano diseñado
- Consistencia visual con el resto de componentes de portal ya corregidos
