

# Fix: Mapa de Incidentes sin distorsion de zoom

## Problema

El sitio aplica `zoom: 0.7` global en `html` (linea 153 de `index.css`). Mapbox GL JS calcula las dimensiones del canvas basandose en el tamano real del contenedor, pero el zoom CSS reduce visualmente todo al 70%. Esto causa:

1. El mapa se ve comprimido/desalineado dentro de la tarjeta
2. Los clicks no corresponden a las coordenadas correctas
3. El mapa no ocupa el 100% visual de la Card

## Solucion: Override de zoom en el contenedor del mapa

Aplicar `style={{ zoom: 1 }}` directamente en el wrapper del mapa para neutralizar el zoom global. Este patron ya se usa exitosamente en el proyecto:
- `ChecklistDetailDashboard` usa `style={{ zoom: 1 }}` para modales
- La pagina de TV/Videowall opera fuera del AppShell con zoom 1

Ademas, agregar un `ResizeObserver` para forzar `map.resize()` despues del mount, asegurando que Mapbox recalcule correctamente el canvas (patron ya validado en `RiskZonesMap.tsx`).

## Cambios

### Archivo: `src/components/incidentes/IncidentesMap.tsx`

1. Agregar `style={{ zoom: 1 }}` al div contenedor del mapa para cancelar el zoom 0.7 global
2. Implementar `ResizeObserver` con llamadas escalonadas a `map.resize()` (100ms, 300ms, 1000ms) para garantizar dimensiones correctas del canvas
3. Cambiar la altura del mapa de `360px` fija a `400px` para aprovechar mejor el espacio visual

### Archivo: `src/pages/Incidentes/IncidentesRRSSPage.tsx`

Sin cambios necesarios -- el override de zoom se aplica a nivel del componente del mapa.

## Detalle tecnico

El `zoom: 1` en el contenedor del mapa crea un nuevo contexto de zoom que anula el `zoom: 0.7` del `html`. Visualmente el mapa se renderizara al 100% de su tamano real dentro de la Card. El texto y controles del mapa (+/-) se veran a escala 1:1, lo cual es deseable para interaccion tactil y legibilidad.

El `ResizeObserver` es necesario porque Mapbox inicializa el canvas con dimensiones que pueden no ser definitivas si el layout aun esta calculando (especialmente con CSS zoom).

