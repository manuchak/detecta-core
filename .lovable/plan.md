
# Plan: Correccion Integral de Portales Radix UI con Zoom 70%

## Diagnostico del Problema

El `zoom: 0.7` aplicado al elemento `html` afecta todos los portales de Radix UI que renderizan en `document.body`. Esto causa:

1. **Escala incorrecta**: Los dropdowns aparecen al 70% del tamano esperado
2. **Posicionamiento desplazado**: Las coordenadas calculadas por Radix no compensan el zoom
3. **Inconsistencia visual**: Algunos componentes ya tienen la correccion y otros no

### Estado Actual de Componentes

| Componente | Tiene Compensacion | Estado |
|------------|-------------------|--------|
| SelectContent | Si (`zoom: 1.428571`) | OK |
| PopoverContent | Si (`zoom: 1.428571`) | OK |
| DropdownMenuContent | No | PROBLEMA |
| DropdownMenuSubContent | No | PROBLEMA |
| TooltipContent | No | PROBLEMA |
| ContextMenuContent | No | PROBLEMA |
| ContextMenuSubContent | No | PROBLEMA |
| MenubarContent | No | PROBLEMA |
| MenubarSubContent | No | PROBLEMA |
| HoverCardContent | No | PROBLEMA |
| DialogContent | No | ACEPTABLE* |
| AlertDialogContent | No | ACEPTABLE* |
| SheetContent | No | ACEPTABLE* |

*Los modales centrados (Dialog, AlertDialog) y sheets anclados a bordes funcionan visualmente porque no dependen de posicionamiento relativo al trigger.

## Solucion Propuesta

Aplicar `style={{ zoom: 1.428571 }}` a todos los componentes portal que requieren posicionamiento preciso relativo a su trigger.

## Seccion Tecnica

### Archivos a Modificar

#### 1. `src/components/ui/dropdown-menu.tsx`

**DropdownMenuContent** (linea 63):
```tsx
// Antes
<DropdownMenuPrimitive.Content
  ref={ref}
  sideOffset={sideOffset}
  className={cn(...)}
  {...props}
/>

// Despues
<DropdownMenuPrimitive.Content
  ref={ref}
  sideOffset={sideOffset}
  className={cn(...)}
  style={{ zoom: 1.428571 }}
  {...props}
/>
```

**DropdownMenuSubContent** (linea 46):
```tsx
// Agregar style={{ zoom: 1.428571 }}
```

#### 2. `src/components/ui/tooltip.tsx`

**TooltipContent** (linea 16):
```tsx
// Antes
<TooltipPrimitive.Content
  ref={ref}
  sideOffset={sideOffset}
  className={cn(...)}
  {...props}
/>

// Despues
<TooltipPrimitive.Content
  ref={ref}
  sideOffset={sideOffset}
  className={cn(...)}
  style={{ zoom: 1.428571 }}
  {...props}
/>
```

#### 3. `src/components/ui/context-menu.tsx`

**ContextMenuContent** (linea 60):
```tsx
// Agregar style={{ zoom: 1.428571 }}
```

**ContextMenuSubContent** (linea 44):
```tsx
// Agregar style={{ zoom: 1.428571 }}
```

#### 4. `src/components/ui/menubar.tsx`

**MenubarContent** (linea 92):
```tsx
// Agregar style={{ zoom: 1.428571 }}
```

**MenubarSubContent** (linea 72):
```tsx
// Agregar style={{ zoom: 1.428571 }}
```

#### 5. `src/components/ui/hover-card.tsx`

**HoverCardContent** (linea 14):
```tsx
// Agregar style={{ zoom: 1.428571 }}
```

### Componentes que NO Requieren Cambio

- **DialogContent**: Centrado con `translate(-50%, -50%)`, no afectado por zoom en posicionamiento
- **AlertDialogContent**: Mismo caso que Dialog
- **SheetContent**: Anclado a bordes con `inset-y-0`, no afectado

## Resumen de Cambios

| Archivo | Componentes a Modificar |
|---------|------------------------|
| `dropdown-menu.tsx` | DropdownMenuContent, DropdownMenuSubContent |
| `tooltip.tsx` | TooltipContent |
| `context-menu.tsx` | ContextMenuContent, ContextMenuSubContent |
| `menubar.tsx` | MenubarContent, MenubarSubContent |
| `hover-card.tsx` | HoverCardContent |

**Total**: 8 componentes en 5 archivos

## Resultado Esperado

Todos los menus desplegables, tooltips y popovers apareceran:
- Al tamano visual correcto (compensando el zoom 70%)
- Posicionados correctamente relativo a su trigger
- Consistentes con SelectContent y PopoverContent que ya funcionan
