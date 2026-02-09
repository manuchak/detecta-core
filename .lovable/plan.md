
# Optimizar TV Dashboard para ocupar 100% de pantalla

## Problemas identificados

1. **Padding excesivo**: El contenedor raiz tiene `p-4` (16px en cada lado) que desperdicia espacio en una TV de 50".
2. **Mapa no llena su contenedor**: El div del mapa usa `h-full` pero la cadena de alturas desde `flex-1` no siempre propaga correctamente a Mapbox. El canvas necesita dimensiones absolutas.
3. **Zoom del navegador**: El proyecto usa un sistema de compensacion de zoom al 70% (`--vh-full: calc(100vh * 1.4286)`). En la TV, si el navegador esta al 70%, la pagina se ve pequena. Se debe usar `100vh` directo o aplicar la compensacion.

## Solucion

### 1. `src/pages/Monitoring/MonitoringTVPage.tsx`

- Reducir padding de `p-4` a `p-2` y gap de `gap-3` a `gap-2` para maximizar espacio
- Usar `h-screen w-screen` (ya lo tiene) -- esto es correcto para TV al 100% zoom
- Agregar comentario para que si el navegador de la TV tiene zoom 70%, se use `h-[var(--vh-full)]` en vez de `h-screen`

### 2. `src/components/monitoring/tv/TVMapDisplay.tsx`

- Cambiar el contenedor del mapa de `h-full` a posicionamiento absoluto (`absolute inset-0`) para que Mapbox siempre ocupe el 100% del espacio disponible
- Estructura: contenedor padre con `relative` (ya lo tiene) y mapa con `absolute inset-0`
- Esto fuerza a Mapbox a tomar las dimensiones reales del contenedor sin depender de la cadena de flex/grid

### 3. Contenedor del area principal (grid del mapa + lista)

- Asegurar que el grid central use `min-h-0` (ya lo tiene) y que el mapa tenga altura explicita via CSS

## Cambios especificos

### Archivo 1: `src/pages/Monitoring/MonitoringTVPage.tsx`

```text
Antes:  className="dark h-screen w-screen overflow-hidden bg-gray-950 text-white p-4 flex flex-col gap-3"
Despues: className="dark h-screen w-screen overflow-hidden bg-gray-950 text-white p-2 flex flex-col gap-2"
```

Reducir padding y gaps para ganar ~16px en cada borde.

### Archivo 2: `src/components/monitoring/tv/TVMapDisplay.tsx`

Cambiar la estructura interna para que el canvas de Mapbox use posicionamiento absoluto:

```typescript
return (
  <div className={`relative rounded-xl overflow-hidden border border-white/10 ${className || ''}`}>
    <div ref={mapContainer} className="absolute inset-0" />
    {/* Legend overlay - sin cambios */}
  </div>
);
```

El cambio clave es `className="absolute inset-0"` en vez de `className="w-full h-full"`. Esto garantiza que el canvas de Mapbox siempre ocupe exactamente el area del contenedor padre, resolviendo el problema de que el mapa no llene su espacio.

### Archivo 3: `src/components/monitoring/tv/TVSummaryBar.tsx`

Reducir padding de las tarjetas KPI de `px-4 py-3` a `px-3 py-2` para ganar espacio vertical.

## Nota sobre el zoom del navegador

Si la TV tiene el navegador al 70% zoom (como el resto del proyecto), el dashboard se vera pequeno. Hay dos opciones:

- **Opcion A (recomendada)**: Abrir la URL `/monitoring/tv` en una ventana del navegador al **100% zoom** (Ctrl+0). El dashboard ya usa `h-screen` que es correcto al 100%.
- **Opcion B**: Si no se puede cambiar el zoom, reemplazar `h-screen` por `h-[var(--vh-full)]` para compensar.

La recomendacion es Opcion A: configurar el navegador de la TV al 100% zoom ya que este dashboard es independiente del resto del sistema.
