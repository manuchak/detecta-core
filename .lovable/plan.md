

# Análisis Causa Raíz — Auto-scroll no funciona en cuadrantes Alerta y En Ruta

## Diagrama Fishbone (Ishikawa)

```text
                            AUTO-SCROLL NO SE ACTIVA
                                      │
    ┌─────────────────┬───────────────┼───────────────┬─────────────────┐
    │                 │               │               │                 │
 CSS HEIGHT       OVERFLOW         DETECCIÓN       LIFECYCLE        TIMING
 CHAIN            STACKING        DE OVERFLOW     DE REACT
    │                 │               │               │                 │
    ├─ grid-rows-2    ├─ cell:        ├─ condición    ├─ []deps en      ├─ 3s timeout
    │   sin height    │   overflow-   │   line 84:    │   useEffect     │   puede ser
    │   explícito     │   hidden      │   scrollH <=  │   no re-evalúa  │   insuficiente
    │   (1fr=auto?)   │               │   clientH+10  │   si servicios  │
    │                 ├─ ServiceBlock: │               │   llegan tarde  ├─ ResizeObserver
    ├─ h-full en      │   overflow-   ├─ h-0+flex-1   │                 │   observa el div
    │   grid cell     │   hidden      │   puede dar   ├─ isRunningRef   │   no su contenido
    │   sin parent    │               │   clientH=0   │   nunca se      │
    │   height        ├─ scroll div:  │   en ciertas  │   resetea en    │
    │   definido      │   overflow-y- │   condiciones  │   re-render     │
    │                 │   hidden      │               │                 │
    ├─ min-h-0 en     │               │               │                 │
    │   múltiples     │  ← 3 CAPAS    │               │                 │
    │   niveles       │    DE CLIP    │               │                 │
    │                 │               │               │                 │
    ▼                 ▼               ▼               ▼                 ▼
```

## Causa Raíz Más Probable: Cadena de alturas rota + overflow triple

Hay **3 capas de `overflow-hidden`** apiladas:

| Nivel | Elemento | Overflow | Problema |
|-------|----------|----------|----------|
| 1 | Cell wrapper (L237) | `overflow-hidden` | Clip visual del grid cell |
| 2 | ServiceBlock (L148) | `overflow-hidden` | Clip del flex parent |
| 3 | Scroll div (L162) | `overflow-y-hidden` | El que debería scrollear |

El `overflow-hidden` en el **ServiceBlock** (nivel 2) es el principal sospechoso. Al estar en el flex parent del scroll div, puede causar que el contenido se recorte **antes** de que el scroll div lo detecte como overflow propio. Resultado: `scrollHeight === clientHeight` → condición línea 84 nunca se cumple → el loop nunca arranca.

Adicionalmente, `h-full` en el cell wrapper (L237) puede no resolver a una altura definida porque CSS Grid con `grid-rows-2` (que genera `1fr 1fr`) no siempre proporciona una altura explícita para que `height: 100%` se resuelva correctamente en hijos.

## Plan de Corrección

### `src/components/monitoring/radar/RadarServicesList.tsx`

1. **Eliminar `overflow-hidden` de ServiceBlock** (L148) — solo el scroll div necesita controlar overflow
2. **Cambiar grid a alturas explícitas**: Reemplazar `grid-rows-2` por `grid-rows-[1fr_1fr]` o usar `grid-template-rows` con altura fija para asegurar que los hijos resuelvan `h-full`
3. **Agregar log de diagnóstico temporal** en `startScroll` para confirmar valores de `scrollHeight` vs `clientHeight` (se elimina después)
4. **Simplificar la cadena**: El cell wrapper tampoco necesita `overflow-hidden` si el scroll div ya lo maneja — cambiar a `overflow-clip` o eliminarlo

### Cambios concretos:

```tsx
// ServiceBlock — QUITAR overflow-hidden del contenedor padre
<div className={`h-full flex flex-col min-h-0 ${isAlert && items.length > 0 ? 'bg-red-950/20' : ''}`}>

// Cell wrapper — cambiar overflow-hidden por overflow-clip (no afecta scrollHeight)  
<div className={`min-h-0 h-full ${i % 2 === 0 ? 'border-r...' : ''} ...`}>

// Grid container — asegurar rows explícitas
<div className="flex-1 grid grid-cols-2 grid-rows-[1fr_1fr] min-h-0 overflow-hidden">
```

Esto elimina las 2 capas de clip intermedias, dejando solo el scroll div como dueño del overflow, y asegura que la condición `scrollHeight > clientHeight` se evalúe correctamente.

