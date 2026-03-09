

# Fix: Rutas multi-corredor para trayectos largos (Naucalpan→Tijuana)

## Problema
`matchRoute()` busca UN solo corredor que cubra origen y destino. Naucalpan→Tijuana cruza 2-3 corredores y además falta el tramo Nogales→Tijuana. Resultado: el tramo recorrido no se dibuja y el pendiente se muestra en linea recta.

## Causa raiz

```text
Naucalpan ─── mexico-queretaro ─── mexico-nogales ─── [GAP] ─── Tijuana
   ✗ Ningún corredor individual cubre ambos extremos
   ✗ No existe corredor Nogales → Tijuana (~600km)
```

## Cambios

### 1. `src/lib/security/highwayCorridors.ts` — Agregar corredor faltante
Agregar **Nogales-Mexicali-Tijuana (Hwy 2/2D)** con waypoints reales:
- Nogales → Caborca → San Luis RC → Mexicali → Tecate → Tijuana

### 2. `src/lib/radar/routeMatcher.ts` — Multi-corridor chaining
Reescribir `matchRoute()` para encadenar corredores:

**Algoritmo:**
1. Construir grafo de adyacencia: dos corredores son "vecinos" si comparten un waypoint endpoint dentro de 30km
2. BFS/Dijkstra desde el corredor más cercano al origen hasta el corredor más cercano al destino
3. Concatenar waypoints de todos los corredores en la cadena, eliminando duplicados en los puntos de unión
4. Retornar waypoints concatenados + dead zones de todos los corredores cruzados
5. Fallback: si no se encuentra cadena, comportamiento actual (single corridor o linea recta)

```text
Naucalpan → [mexico-queretaro] → [mexico-nogales] → [nogales-tijuana] → Tijuana
              waypoints A            waypoints B          waypoints C
              ═══════════════════════════════════════════════════════
                        concatenados en orden
```

### 3. `src/components/monitoring/radar/RadarMapDisplay.tsx` — Usar segment_geometries
Integrar `useSegmentGeometries()` para reemplazar waypoints rectos con geometrias road-snapped cuando existan en cache:
- Para cada corredor en la cadena, buscar `segment_geometries[corridorId]`
- Si existe, usar sus coordinates (curvas reales de carretera)
- Si no, fallback a waypoints del corredor

### 4. `src/hooks/useServiciosTurnoLive.ts` — Pasar corridorIds (plural)
Cambiar `corridorId: string | null` a `corridorIds: string[]` para reflejar la cadena de corredores.

| Archivo | Cambio |
|---------|--------|
| `src/lib/security/highwayCorridors.ts` | Agregar corredor Nogales-Tijuana |
| `src/lib/radar/routeMatcher.ts` | Multi-corridor chaining (BFS) + merge waypoints |
| `src/components/monitoring/radar/RadarMapDisplay.tsx` | Integrar `useSegmentGeometries` para road-snap |
| `src/hooks/useServiciosTurnoLive.ts` | `corridorIds: string[]` |

