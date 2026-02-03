
# Fix: Alineación Visual de Dropdowns de Zona

## Problema

El `SelectContent` del selector de zona aparece desplazado hacia la izquierda de la tabla, sin conexión visual con el `SelectTrigger` que lo activó. Esto genera confusión sobre qué fila se está editando.

## Causa Técnica

El componente `Select` de Radix UI en modo `position="popper"` (default) puede desalinearse cuando está dentro de contenedores con scroll horizontal (como una tabla). Necesita props de alineación explícitos.

## Solución

Agregar props de posicionamiento al `SelectContent`:

```tsx
<SelectContent 
  position="popper" 
  align="start" 
  sideOffset={4}
>
```

Esto fuerza al dropdown a:
- `position="popper"`: Usar posicionamiento flotante relativo al trigger
- `align="start"`: Alinearse al borde izquierdo del trigger
- `sideOffset={4}`: Mantener 4px de separación vertical

## Cambios Requeridos

### Archivo: `CustodiosDataTable.tsx`

**Cambio 1 - SelectContent de Zona (linea ~228):**

```tsx
// Antes
<SelectContent>

// Después
<SelectContent position="popper" align="start" sideOffset={4}>
```

**Cambio 2 - SelectContent de Preferencia (buscar segundo Select):**

Aplicar el mismo fix al selector de preferencia para consistencia visual.

## Impacto Visual

| Antes | Después |
|-------|---------|
| Dropdown flotando a la izquierda | Dropdown alineado bajo el trigger |
| Usuario confundido sobre qué fila edita | Conexión visual clara |

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Agregar props de posicionamiento a ambos SelectContent |
