
# Propuesta UI/UX: Correccion del Espacio Vertical con Zoom 70%

## Diagnostico del Problema

El `zoom: 0.7` en `html` reduce visualmente todo al 70%, pero:
- Las unidades de viewport (`100vh`, `min-h-screen`) siguen calculando sobre el viewport **real**
- El contenido ocupa solo 70% del espacio vertical disponible
- Se crean espacios en blanco de ~30% en la parte inferior de cada pagina

### Visualizacion del Problema

```text
+--------------------------------+
|  TopBar (real 56px → visual 39px)  |
+--------------------------------+
|  Sidebar  |  Contenido         |
|           |  (70% del alto)    |
|           |                    |
|           +--------------------+
|           |  ESPACIO VACIO     |
|           |  (~30% del viewport)|
+--------------------------------+
```

## Solucion Propuesta: Variables CSS de Viewport Escalado

En lugar de quitar el zoom (perdiendo la densidad de informacion que te gusta), propongo **compensar matematicamente** las alturas de viewport.

### Logica de Compensacion

Si el zoom es 0.7, entonces:
- `100vh` visual equivale a `100vh / 0.7 = 142.86vh` real
- Crear variables CSS que pre-calculen esto

### Implementacion

**1. Nuevas Variables CSS en `index.css`:**

```css
:root {
  --zoom-scale: 0.7;
  --zoom-compensation: 1.4286; /* 1 / 0.7 */
  
  /* Viewport compensado */
  --vh-full: calc(100vh * var(--zoom-compensation));
  --vh-90: calc(90vh * var(--zoom-compensation));
  --vh-80: calc(80vh * var(--zoom-compensation));
  
  /* Alturas de contenido comunes */
  --content-height-full: calc(var(--vh-full) - 56px); /* menos TopBar */
  --content-height-with-tabs: calc(var(--vh-full) - 120px); /* menos TopBar + tabs */
  --content-height-with-filters: calc(var(--vh-full) - 180px); /* menos TopBar + tabs + filtros */
}
```

**2. Clases Utilitarias de Tailwind:**

```css
/* Clases para alturas escaladas */
.h-viewport-full { height: var(--vh-full); }
.h-content-full { height: var(--content-height-full); }
.h-content-tabs { height: var(--content-height-with-tabs); }
.h-content-filters { height: var(--content-height-with-filters); }
.min-h-viewport-full { min-height: var(--vh-full); }
```

**3. Actualizacion de Componentes Afectados:**

Reemplazar calculos hardcodeados:

| Archivo | Antes | Despues |
|---------|-------|---------|
| `ServiciosConsulta.tsx` | `h-[calc(100vh-340px)]` | `h-[calc(var(--vh-full)-340px)]` |
| `ScheduledServicesTabSimple.tsx` | `max-h-[calc(100vh-380px)]` | `max-h-[calc(var(--vh-full)-380px)]` |
| `CustodianZoneBubbleMap.tsx` | `h-[calc(100vh-280px)]` | `h-[calc(var(--vh-full)-280px)]` |
| Layouts con `min-h-screen` | `min-h-screen` | `min-h-[var(--vh-full)]` |

## Alternativa Considerada: Quitar Zoom

Ventajas:
- Elimina la complejidad de compensacion
- Viewport nativo = calculo simple

Desventajas:
- Requiere reajustar **todos** los componentes manualmente
- Se pierde la densidad de informacion actual
- Tipografias, paddings, borders necesitan ajuste individual

**Recomendacion**: Mantener zoom 0.7 con compensacion CSS es mas eficiente.

## Resultado Esperado

```text
+--------------------------------+
|  TopBar                        |
+--------------------------------+
|  Sidebar  |  Contenido         |
|           |  (100% del alto    |
|           |   compensado)      |
|           |                    |
|           |                    |
|           |  [Sin espacios]    |
+--------------------------------+
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/index.css` | Agregar variables de viewport compensado y clases utilitarias |
| `src/pages/Facturacion/components/ServiciosConsulta.tsx` | Usar `var(--vh-full)` en calculos de altura |
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Usar variables compensadas |
| `src/pages/Planeacion/components/configuration/*.tsx` | Actualizar mapas y listas |
| `src/layouts/UnifiedLayout.tsx` | Usar `min-h-[var(--vh-full)]` si aplica |
| ~15-20 componentes adicionales | Buscar y reemplazar patrones `100vh` |

## Beneficios

1. **Consistencia**: Una sola fuente de verdad para el factor de escala
2. **Mantenibilidad**: Cambiar zoom en un lugar actualiza todo
3. **Retrocompatibilidad**: Los componentes que no usen viewport no se afectan
4. **Densidad preservada**: Mantiene el beneficio del zoom 70%
