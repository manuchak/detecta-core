
# Analisis Fishbone: Desplazamiento de Dropdowns Post-Zoom

## Diagrama Causa-Raiz (Ishikawa/Fishbone)

```text
                                    DROPDOWNS DESPLAZADOS
                                            |
    +-------------------+-------------------+-------------------+-------------------+
    |                   |                   |                   |                   |
METODO             MAQUINA              MATERIAL            MEDICION
    |                   |                   |                   |
    |                   |                   |                   |
[Zoom global       [getBoundingClient    [Radix Popper      [sideOffset
 0.7 en html]       Rect() retorna        calcula posicion   no compensado]
    |               coords escaladas]     pre-zoom]              |
    |                   |                   |               [alignOffset
[Compensacion          |               [Portal renderiza    no compensado]
 1.428571 en       [Transform              fuera del             |
 portal content]    translate afectado     contexto zoom]   [collisionPadding
    |               por zoom del               |             no compensado]
    |               contenedor]           [Floating UI
[Posicionamiento       |                  no soporta
 calculado antes   [Coordenadas            CSS zoom
 de compensacion]   del trigger            nativamente]
                    en espacio 70%]
```

## Causa Raiz Identificada

**El problema fundamental**: Radix UI Popper calcula la posicion del dropdown usando `getBoundingClientRect()` del trigger, que retorna coordenadas en el espacio visual escalado (70%). Luego posiciona el dropdown con `transform: translate(x, y)`. Cuando aplicamos `zoom: 1.428571` al contenido del dropdown para compensar, la transformacion de posicion tambien se escala, causando un desplazamiento visual.

### Flujo del Bug

1. Trigger esta en documento con `zoom: 0.7`
2. `getBoundingClientRect()` retorna posicion visual (ej: `top: 280px`)
3. Popper calcula: "dropdown debe ir en `translate(0, 288px)`"
4. Dropdown se renderiza en portal con `zoom: 1.428571`
5. El `translate` TAMBIEN se escala: `288px * 1.428571 = 411px` visual
6. Resultado: dropdown aparece ~130px mas abajo de lo esperado

## Solucion Propuesta

### Estrategia: Compensar el sideOffset

Dado que el contenido del dropdown se escala 1.428571x, el `sideOffset` debe dividirse por ese factor para que el resultado visual sea el correcto:

- `sideOffset` original: 4px
- `sideOffset` compensado: `4 / 1.428571 = 2.8px` -> redondeado a 3px

Sin embargo, esto es una solucion parcial. La solucion completa requiere ajustar el wrapper del popper.

### Solucion Robusta: CSS Transform en Wrapper

Aplicar la compensacion de zoom al wrapper del popper (`[data-radix-popper-content-wrapper]`) en lugar del contenido interno, y usar `transform-origin` para mantener la posicion relativa.

---

## Plan de Implementacion

### Fase 1: Refactorizar Compensacion de Zoom (Solucion Principal)

#### Cambio 1: Crear CSS global para wrapper del popper

**Archivo**: `src/index.css` (agregar despues de las reglas de zoom)

```css
/* Compensacion de zoom para Radix Popper wrappers */
[data-radix-popper-content-wrapper] {
  zoom: 1.428571 !important;
}

/* Alternativa para Firefox */
@supports not (zoom: 1.428571) {
  [data-radix-popper-content-wrapper] {
    transform: scale(1.428571);
    transform-origin: var(--radix-popper-transform-origin);
  }
}
```

#### Cambio 2: Remover zoom inline de componentes

**Archivos a modificar** (remover `style={{ zoom: 1.428571 }}`):
- `src/components/ui/popover.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/dropdown-menu.tsx` (Content y SubContent)
- `src/components/ui/select.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/hover-card.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/drawer.tsx`

### Fase 2: Ajustar Offsets para Precision Visual

#### Cambio 3: Compensar sideOffset en componentes criticos

Para componentes con posicionamiento preciso, ajustar el `sideOffset` dividiendo por 1.428571:

**Archivo**: `src/components/ui/dropdown-menu.tsx`
```tsx
// Antes: sideOffset = 4
// Despues: sideOffset = Math.round(4 / 1.428571) = 3
>(({ className, sideOffset = 3, ...props }, ref) => (
```

**Archivo**: `src/components/ui/popover.tsx`
```tsx
>(({ className, align = "center", sideOffset = 3, ...props }, ref) => (
```

**Archivo**: `src/components/ui/tooltip.tsx`
```tsx
>(({ className, sideOffset = 3, ...props }, ref) => (
```

### Fase 3: Casos Especiales (Dialog/Sheet/Drawer)

Los modales (Dialog, Sheet, AlertDialog, Drawer) no usan popper positioning, usan `position: fixed`. Para estos:

#### Cambio 4: Mantener compensacion en modales pero sin wrapper

**Archivo**: `src/index.css`
```css
/* Modales fijos - compensacion directa */
[data-radix-dialog-content],
[data-radix-alert-dialog-content] {
  zoom: 1.428571;
}

/* Drawers y Sheets */
[data-vaul-drawer],
[data-radix-dialog-content][data-sheet="true"] {
  zoom: 1.428571;
}
```

**Alternativa**: Mantener el `style={{ zoom: 1.428571 }}` en Dialog/Sheet/AlertDialog/Drawer ya que no tienen problemas de posicionamiento relativo.

---

## Resumen de Archivos a Modificar

| Archivo | Accion |
|---------|--------|
| `src/index.css` | Agregar reglas CSS para `[data-radix-popper-content-wrapper]` |
| `src/components/ui/popover.tsx` | Remover style zoom, ajustar sideOffset a 3 |
| `src/components/ui/tooltip.tsx` | Remover style zoom, ajustar sideOffset a 3 |
| `src/components/ui/dropdown-menu.tsx` | Remover style zoom (Content y SubContent), ajustar sideOffset a 3 |
| `src/components/ui/select.tsx` | Remover style zoom |
| `src/components/ui/context-menu.tsx` | Remover style zoom |
| `src/components/ui/menubar.tsx` | Remover style zoom |
| `src/components/ui/hover-card.tsx` | Remover style zoom |
| `src/components/ui/dialog.tsx` | MANTENER style zoom (modal fijo) |
| `src/components/ui/sheet.tsx` | MANTENER style zoom (modal fijo) |
| `src/components/ui/alert-dialog.tsx` | MANTENER style zoom (modal fijo) |
| `src/components/ui/drawer.tsx` | MANTENER style zoom (modal fijo) |

---

## Resultado Esperado

Antes (actual):
```
[Trigger] -----------------> [Dropdown desplazado ~130px abajo]
```

Despues (solucion):
```
[Trigger] --> [Dropdown alineado correctamente]
```

## Riesgos y Mitigacion

| Riesgo | Mitigacion |
|--------|------------|
| Firefox no soporta zoom | Fallback con transform: scale() |
| Submenus anidados | Probar DropdownMenuSubContent especificamente |
| Colisiones con viewport | collisionPadding ya esta configurado |

## Orden de Ejecucion

1. Agregar reglas CSS globales (index.css)
2. Remover zoom inline de componentes popper (8 archivos)
3. Ajustar sideOffset en componentes principales
4. Verificar visualmente cada componente
5. Probar en Firefox para fallback
