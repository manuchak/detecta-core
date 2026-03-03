

# Reducir ruido visual en POIs y hacer accionables claros

## Problema

Todos los POIs se renderizan como círculos uniformes de tamaño 5px con color por tipo. El usuario no puede distinguir rápidamente:
- **¿Puedo parar aquí?** (gasolinera vigilada, área de descanso) vs **informativo** (caseta, base GN, entronque)
- **¿Puedo pernoctar?** vs solo descanso breve
- Los puntos verdes (`safe_area`) son demasiado grandes y genéricos — mezclan gasolineras, bases de custodia, áreas de descanso y puestos militares sin distinción

## Solución: Categorización operativa + iconografía diferenciada

### A. Nuevo campo `operationalCategory` en POI

Agregar a la interfaz `POI` un campo que clasifica cada punto por su accionabilidad para el operador:

| Categoría | Significado | Ejemplos | Icono sugerido |
|---|---|---|---|
| `pernocta` | El tracto puede detenerse a dormir | Área de descanso, hotel de ruta, estacionamiento vigilado 24h | 🛏️ cuadrado azul |
| `descanso` | Parada breve (<2h), combustible, sanitarios | Gasolinera vigilada, Pemex con vigilancia | ⛽ círculo verde pequeño |
| `alerta` | Zona de peligro, no detenerse | Blackspot, punto de emboscada | 🔴 triángulo rojo |
| `referencia` | Informativo, no parar | Caseta, entronque, base GN, zona industrial | Punto gris pequeño (3px) |

### B. Cambios visuales en el mapa

En `RiskZonesMap.tsx`, reemplazar el layer uniforme `pois-circle` por renderizado diferenciado:

- **`alerta` (blackspots)**: Triángulo rojo o círculo rojo con borde pulsante, tamaño 7px — estos SÍ deben destacar
- **`pernocta`**: Cuadrado azul 6px — el operador busca esto para planificar
- **`descanso`**: Círculo verde 4px — visible pero no dominante
- **`referencia`**: Círculo gris 3px, opacidad 0.6 — presente pero no compite visualmente

### C. Popups mejorados con info operativa

Agregar al popup de POI:
- **Accionable**: "✅ Puede pernoctar" / "⛽ Parada breve" / "⚠️ NO detenerse" / "ℹ️ Referencia"
- **Servicios disponibles** (para `pernocta`/`descanso`): sanitarios, combustible, vigilancia, estacionamiento tracto

### D. Clasificar POIs existentes

Recorrer los ~90+ POIs en `highwaySegments.ts` y asignar `operationalCategory`:
- `blackspot` → `alerta`
- `tollbooth` → `referencia` (en casetas NO se puede parar)
- `junction` → `referencia`
- `industrial` → `referencia`
- `safe_area` con subtype `gasolinera_vigilada` → `descanso`
- `safe_area` con subtype `area_descanso` → `pernocta`
- `safe_area` con subtype `base_custodia` → `referencia`
- `safe_area` con subtype `puesto_militar` → `referencia`

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Agregar `operationalCategory` a interfaz POI; clasificar todos los POIs existentes |
| `src/components/security/map/RiskZonesMap.tsx` | Renderizado diferenciado por categoría (tamaño, forma, color, opacidad); popups con info operativa |

