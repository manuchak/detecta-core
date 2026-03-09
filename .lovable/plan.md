

# Densificar waypoints del corredor México-Nogales (15D)

## Problema
El corredor `mexico-nogales` tiene solo 8 waypoints para 1,800 km. Los segmentos largos se dibujan como líneas rectas que cortan por la Sierra Madre en vez de seguir la autopista 15D por la costa del Pacífico. Visualmente la ruta parece cruzar Durango/Chihuahua cuando en realidad va por Nayarit/Sinaloa/Sonora.

## Cambio

### `src/lib/security/highwayCorridors.ts` — Corredor `mexico-nogales`
Reemplazar los 8 waypoints actuales con ~20-25 puntos que sigan la curvatura real de la 15D:

```text
Actual (8 pts):
CDMX → GDL(Acatlán) → Tepic → Mazatlán → Los Mochis → Guaymas → Hermosillo → Nogales

Propuesto (~22 pts):
CDMX → Toluca(Lib) → Morelia(Lib) → Zamora → La Barca → Macrolib GDL
→ Tepic → Compostela → Las Varas → San Blas(cruce)
→ Mazatlán → Culiacán → Los Mochis → Guasave
→ Cd. Obregón → Guaymas → Empalme → Hermosillo
→ Santa Ana → Magdalena → Imuris → Nogales
```

Cada punto con coordenadas reales [lng, lat] siguiendo la traza carretera, no en línea recta.

No se cambia ninguna lógica, solo se densifican las coordenadas del array `waypoints` de este corredor.

| Archivo | Cambio |
|---------|--------|
| `src/lib/security/highwayCorridors.ts` | Densificar waypoints de `mexico-nogales` (~8 → ~22 pts) |

