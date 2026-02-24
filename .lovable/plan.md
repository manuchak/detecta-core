

# Fix: Mapa de Tramos Carreteros No Visible en Modulo de Seguridad

## Causa Raiz

El proyecto usa `zoom: 0.7` global en `html` (src/index.css linea 153) para densidad de informacion. Esto **distorsiona el canvas de Mapbox GL JS** porque el motor calcula coordenadas y dimensiones basandose en el tamano real del contenedor, pero CSS zoom cambia el tamano visual sin que Mapbox lo sepa.

Otros mapas del sistema ya tienen el fix aplicado:
- `IncidentesMap.tsx`: usa `style={{ height: '400px', zoom: 1 }}`
- `ShiftServicesMap.tsx`: misma estrategia
- Dialogs/Sheets: usan `zoom: 1.428571` (que es `1/0.7`) para compensar

**El RiskZonesMap NO tiene ninguna compensacion de zoom.** Ademas, su contenedor padre en `RouteRiskIntelligence.tsx` depende de altura por Flexbox (`flex-1`) que puede colapsar a 0px cuando la cadena de alturas se rompe por el zoom distorsionado.

## Solucion

### Archivo 1: `src/components/security/routes/RouteRiskIntelligence.tsx`

Agregar `style={{ zoom: 1 }}` al contenedor del mapa y un `min-h` de seguridad para que el mapa nunca colapse a 0:

```text
ANTES (linea 32):
<div className="relative rounded-lg overflow-hidden border bg-muted/10">

DESPUES:
<div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[400px]" style={{ zoom: 1 }}>
```

Esto neutraliza el zoom global para todo el area del mapa (incluyendo la leyenda y los controles de capas que estan como overlays absolutos dentro del mismo contenedor).

### Archivo 2: `src/components/security/map/RiskZonesMap.tsx`

Ningun cambio estructural necesario. El componente ya tiene:
- ResizeObserver (linea 94)
- Staggered resize calls (lineas 73-75)
- Container con `absolute inset-0` (linea 331)

Estos mecanismos ya son correctos; solo necesitan que el contenedor padre tenga el zoom neutralizado para funcionar.

## Por que esta es la solucion de raiz

Las soluciones anteriores intentaban compensar con `m.resize()` repetidos, pero el problema fundamental es que Mapbox calcula su canvas en un contexto de zoom 0.7x. El unico fix real es que el contenedor del mapa opere a `zoom: 1`, igual que todos los otros mapas del sistema. Esto es consistente con el patron documentado en la memoria del proyecto (`mapbox-zoom-distortion-neutralization`).

## Resultado esperado

El mapa de tramos carreteros sera visible inmediatamente con todos sus layers (segmentos de riesgo, POIs, puntos seguros, zonas muertas), interactivo (click en segmentos), y con coordenadas correctas (popups alineados al cursor).
