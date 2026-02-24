

# Solución definitiva para el mapa de Rutas y Zonas en Seguridad

## Diagnóstico

El token de Mapbox se carga correctamente (los logs lo confirman), pero el canvas del mapa se renderiza con **0px de altura** porque la cadena de alturas CSS está rota en dos puntos:

```text
SecurityPage (h-[var(--content-height-full)]) -- OK
  └─ Tabs (flex-1 flex flex-col min-h-0) -- OK
       └─ TabsContent (flex-1 min-h-0 mt-3) -- PROBLEMA 1: no tiene "flex flex-col"
            └─ RouteRiskIntelligence (flex flex-col h-full) -- h-full no se resuelve
                 └─ grid (flex-1 min-h-0) -- flex-1 no funciona sin padre flex
                      └─ Map wrapper (min-h-[400px]) -- el min-h se ignora en grid sin height
                           └─ Map div (absolute inset-0) -- 0px porque padre no tiene altura
```

**Problema 1**: `TabsContent` con `flex-1 min-h-0` participa como flex child del Tabs, pero no es un flex container. Entonces `h-full` de `RouteRiskIntelligence` no se propaga.

**Problema 2**: La columna del mapa en el grid usa `min-h-[400px]` pero el mapa interior usa `absolute inset-0`, que depende de que el padre tenga una altura computada real. Con el layout flex roto, el padre colapsa.

## Corrección (2 archivos)

### 1. `src/pages/Security/SecurityPage.tsx` (línea 50)

Agregar `flex flex-col` al TabsContent de "routes" para que propague la altura a su hijo:

```
// Antes:
<TabsContent value="routes" className="flex-1 min-h-0 mt-3">

// Después:
<TabsContent value="routes" className="flex-1 flex flex-col min-h-0 mt-3">
```

### 2. `src/components/security/routes/RouteRiskIntelligence.tsx` (línea 32)

Reemplazar `min-h-[400px]` por una altura explícita calculada con CSS para que el contenedor del mapa siempre tenga dimensiones reales, y mantener `zoom: 1` para la corrección de distorsión de Mapbox:

```
// Antes:
<div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[400px]" style={{ zoom: 1 }}>

// Después:
<div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[420px] h-full" style={{ zoom: 1 }}>
```

Y asegurar que el grid padre use `flex-1` correctamente:

```
// Antes:
<div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 flex-1 min-h-0 mt-1">

// Después:
<div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 flex-1 min-h-0 mt-1" style={{ minHeight: 0 }}>
```

## Por qué esta solución es definitiva

1. **Cadena de alturas CSS ininterrumpida**: Cada nivel de la jerarquía propaga correctamente la altura desde `--content-height-full` hasta el canvas de Mapbox
2. **min-h-[420px] + h-full**: Garantiza que el mapa nunca colapse a 0px (el min-h como fallback) pero crezca hasta llenar el espacio disponible (h-full)
3. **zoom: 1 se mantiene**: Respeta el patrón estándar del proyecto para neutralizar la distorsión del canvas de Mapbox
4. **ResizeObserver ya existe**: El componente `RiskZonesMap` ya tiene el observer con resize() escalonado, así que una vez que el contenedor tenga altura real, el mapa se renderizará correctamente

## Resultado esperado

El mapa se renderizará ocupando toda la altura disponible del tab "Rutas y Zonas", mostrando los tramos carreteros con sus colores de riesgo, POIs, puntos seguros y zonas sin cobertura celular.
