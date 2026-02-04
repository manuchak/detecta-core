

# Plan: Corregir Contenedor Padre del Layout

## Problema

`UnifiedLayout.tsx` usa `h-screen` (`100vh` sin compensar) como altura del contenedor principal. Esto limita todo el contenido al 70% visible del viewport, anulando las variables compensadas usadas en los componentes hijos.

## Solucion

Cambiar el contenedor principal de `UnifiedLayout` para usar la altura compensada.

## Implementacion

### Archivo: `src/layouts/UnifiedLayout.tsx`

**Linea 71 - Antes:**
```tsx
<div className="h-screen flex flex-col overflow-hidden bg-background">
```

**Despues:**
```tsx
<div className="h-viewport-full flex flex-col overflow-hidden bg-background">
```

Esto usa la clase utilitaria que ya existe en `index.css`:
```css
.h-viewport-full {
  height: var(--vh-full); /* calc(100vh * 1.4286) */
}
```

## Resultado Esperado

```text
ANTES:                           DESPUES:
+------------------------+       +------------------------+
| TopBar                 |       | TopBar                 |
+------------------------+       +------------------------+
| Sidebar | Contenido    |       | Sidebar | Contenido    |
|         | (70% alto)   |       |         |              |
|         |              |       |         | (100% alto   |
|         +--------------+       |         |  compensado) |
|         | ESPACIO      |       |         |              |
|         | VACIO 30%    |       |         |              |
+------------------------+       +------------------------+
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/layouts/UnifiedLayout.tsx` | Cambiar `h-screen` por `h-viewport-full` en linea 71 |

## Nota

Este cambio propagara la altura correcta a todos los modulos que usan `UnifiedLayout` (Planeacion, Facturacion, CRM Hub, etc.), resolviendo el problema de espacio vertical en todo el sitio.

