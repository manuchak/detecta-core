

# Análisis de Causa Raíz: Gráficos Cortados y Espacio en Blanco

## Diagrama Fishbone (Ishikawa)

```text
                              GRÁFICOS CORTADOS + ESPACIO EN BLANCO
                                            │
    ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
    │                   │                   │                   │                   │
CONTENEDOR          CONFLICTO DE        CADENA DE           OVERFLOW
   PADRE            VARIABLES CSS       CÁLCULOS            OCULTO
    │                   │                   │                   │
    │                   │                   │                   │
 Hub usa            Charts usan        Offset de 260px    TabsContent tiene
 100vh              var(--vh-full)     es incorrecto      overflow-auto
    │                   │                   │                   │
    ▼                   ▼                   ▼                   ▼
 CAUSA RAÍZ #1      CAUSA RAÍZ #2      CAUSA RAÍZ #3      EFECTO SECUNDARIO
```

## Causa Raíz #1: Inconsistencia en el Contenedor Padre (CRÍTICA)

**Archivo**: `FacturacionHub.tsx` línea 60

```tsx
// ❌ ACTUAL - Usa 100vh directo
<div className="flex flex-col h-[calc(100vh-3.5rem)]">

// ✓ CORRECTO - Debe usar la variable compensada
<div className="flex flex-col h-[calc(var(--vh-full)-3.5rem)]">
```

**Por qué es crítico**:
- El sistema usa `zoom: 0.7` (línea 152-154 de index.css)
- `100vh` representa solo el 70% del viewport real
- `var(--vh-full)` = `100vh × 1.4286` = viewport real compensado
- **Resultado**: El Hub tiene ~700px de altura, pero los charts intentan ocupar ~800px

## Causa Raíz #2: Conflicto de Cálculos

**Archivo**: `FacturacionDashboard.tsx` líneas 81 y 143

```tsx
// El dashboard dice:
h-[calc(var(--vh-full)-260px)]  // = ~840px en pantalla 1080p

// Pero el Hub (padre) dice:
h-[calc(100vh-3.5rem)]          // = ~700px con zoom 0.7
```

Los hijos quieren ser **más grandes** que el contenedor padre. CSS trunca el excedente.

## Causa Raíz #3: Offset Incorrecto

El offset de 260px no refleja la altura real de los elementos superiores:

| Elemento | Altura Real |
|----------|-------------|
| Hub Header (h-14) | 56px |
| TabsList container (pt-2) | 8px |
| TabsList (h-9) | 36px |
| TabsContent padding (py-3) | 24px |
| HeroBar (grid h-[72px] + gap) | ~80px |
| Dashboard spacing (space-y-3) | 12px |
| **Total** | **~216px** |

Pero además, el Hub resta `3.5rem` (~56px) para el TopBar global, así que el cálculo correcto es más complejo.

## Solución Propuesta

### Paso 1: Corregir FacturacionHub.tsx (línea 60)

```tsx
// ANTES
<div className="flex flex-col h-[calc(100vh-3.5rem)]">

// DESPUÉS - Usar variable CSS compensada
<div className="flex flex-col h-[calc(var(--vh-full)-3.5rem)]">
```

### Paso 2: Simplificar con Variables CSS Predefinidas

El sistema ya tiene variables optimizadas (index.css líneas 20-23):

```css
--content-height-full: calc(var(--vh-full) - 56px);      /* TopBar */
--content-height-with-tabs: calc(var(--vh-full) - 120px); /* TopBar + Tabs */
--content-height-with-filters: calc(var(--vh-full) - 180px); /* TopBar + Tabs + Filtros */
```

### Paso 3: Ajustar Dashboard Cards

En `FacturacionDashboard.tsx`, usar un offset que considere solo los elementos internos del dashboard:

```tsx
// ANTES - Offset hardcodeado
h-[calc(var(--vh-full)-260px)]

// DESPUÉS - Offset ajustado considerando:
// - Contenido ya está dentro de TabsContent con padding
// - HeroBar: ~80px
// - Gaps: ~12px
// Total interno: ~92px + un margen de seguridad
h-[calc(var(--content-height-with-tabs)-100px)]
```

O usando cálculo directo más preciso:
```tsx
h-[calc(var(--vh-full)-220px)]
```

## Cambios Específicos

### Archivo 1: `src/pages/Facturacion/FacturacionHub.tsx`

**Línea 60**: Cambiar altura del contenedor principal
```tsx
// ANTES
<div className="flex flex-col h-[calc(100vh-3.5rem)]">

// DESPUÉS
<div className="flex flex-col h-[calc(var(--vh-full)-3.5rem)]">
```

### Archivo 2: `src/pages/Facturacion/components/FacturacionDashboard.tsx`

**Línea 81**: Card del Bar Chart
```tsx
// ANTES
<Card className="lg:col-span-3 border-border/50 flex flex-col h-[calc(var(--vh-full)-260px)] min-h-[400px]">

// DESPUÉS - Usar variable predefinida + offset interno
<Card className="lg:col-span-3 border-border/50 flex flex-col h-[calc(var(--content-height-with-tabs)-100px)] min-h-[400px]">
```

**Línea 143**: Card del Pie Chart
```tsx
// ANTES
<Card className="lg:col-span-2 border-border/50 flex flex-col h-[calc(var(--vh-full)-260px)] min-h-[400px]">

// DESPUÉS
<Card className="lg:col-span-2 border-border/50 flex flex-col h-[calc(var(--content-height-with-tabs)-100px)] min-h-[400px]">
```

## Cálculo de la Nueva Altura

```text
Viewport Real (1080p):                    1080px
var(--vh-full):                           1080px × 1.4286 = 1542px (compensado para zoom)
var(--content-height-with-tabs):          1542px - 120px = 1422px
Menos HeroBar + spacing interno:          1422px - 100px = 1322px

Altura disponible para charts:            1322px
Bar Chart (10 barras × 22px + margins):   ~300px → ✓ Cabe perfectamente
Pie Chart + Legend + Insights:            ~400px → ✓ Cabe perfectamente
```

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Bar Chart: barras visibles | 6/10 | 10/10 |
| Espacio blanco inferior | ~200px | 0px |
| Consistencia de variables | ❌ Mezcladas | ✓ Unificadas |
| Pie Chart | Tamaño correcto | Tamaño correcto |

## Archivos a Modificar

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `FacturacionHub.tsx` | 60 | `100vh` → `var(--vh-full)` |
| `FacturacionDashboard.tsx` | 81 | `var(--vh-full)-260px` → `var(--content-height-with-tabs)-100px` |
| `FacturacionDashboard.tsx` | 143 | `var(--vh-full)-260px` → `var(--content-height-with-tabs)-100px` |

## Beneficios

1. **Consistencia**: Todo el módulo usa el mismo sistema de variables CSS
2. **Mantenibilidad**: Variables predefinidas facilitan ajustes futuros
3. **Aprovechamiento total del viewport**: Sin espacio desperdiciado
4. **Todos los clientes visibles**: Las 10 barras del chart se mostrarán correctamente

