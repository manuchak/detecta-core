

# Corredor Cuautitlán → Chihuahua: ruta vacía en el mapa

## Diagnóstico

El corredor `queretaro-ciudad-juarez` existe en `highwayCorridors.ts` (id: `queretaro-ciudad-juarez`, 1200km, waypoints de Querétaro a Cd. Juárez pasando por SLP, Zacatecas, Torreón y Chihuahua), pero **no tiene ningún segmento** en `highwaySegments.ts`. Busqué `corridorId: 'queretaro-ciudad-juarez'` y no hay coincidencias — por eso el mapa no dibuja nada en ese eje.

La ruta real desde Cuautitlán a Chihuahua sería:

```text
Cuautitlán → Arco Norte/57D → Querétaro → SLP (57D) → Zacatecas (49) → 
Fresnillo → Durango (45) → Parral → Delicias → Chihuahua (45)
```

Alternativa por Torreón:
```text
... → Zacatecas → Fresnillo → Torreón (49) → Delicias → Chihuahua
```

## Plan de implementación

### A. Crear ~10 segmentos para el corredor `queretaro-ciudad-juarez`

Dividir los 1,200km en segmentos operativos con waypoints precisos:

| Segmento | Tramo | Km | Riesgo | Tipo |
|---|---|---|---|---|
| qro-jua-1 | Querétaro Norte - San Luis Potosí | 0-200 | medio | cuota (57D) |
| qro-jua-2 | SLP - Aguascalientes (entronque) | 200-330 | medio | cuota (45D) |
| qro-jua-3 | Aguascalientes - Zacatecas | 330-430 | medio | cuota (45D) |
| qro-jua-4 | Zacatecas - Fresnillo | 430-500 | alto | mixta |
| qro-jua-5 | Fresnillo - Río Grande | 500-620 | alto | libre (45) |
| qro-jua-6 | Río Grande - Jiménez | 620-780 | extremo | libre (45) |
| qro-jua-7 | Jiménez - Delicias | 780-880 | alto | libre (45) |
| qro-jua-8 | Delicias - Chihuahua Sur | 880-980 | medio | cuota (45D) |
| qro-jua-9 | Chihuahua Sur - Chihuahua | 980-1050 | medio | cuota |
| qro-jua-10 | Chihuahua - Cd. Juárez (enlace) | 1050-1200 | alto | libre (45) |

### B. Agregar ~5 POIs operativos en el corredor

- Blackspot: Fresnillo-Río Grande (zona de asalto a transporte)
- Blackspot: Jiménez-Camargo (Desierto de Chihuahua)
- Caseta: Palmillas (57D)
- Base GN: Delicias
- Gasolinera segura: Matehuala (ya existe en otro corredor pero se referencia)

### C. Enriquecer geometrías de los nuevos segmentos

Invocar `enrich-segment-geometries` para los ~10 segmentos nuevos, para que se dibujen sobre la carretera real en lugar de líneas rectas.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Agregar ~10 segmentos + ~5 POIs para corredor `queretaro-ciudad-juarez` |
| Edge function `enrich-segment-geometries` | Invocar para los nuevos segmentos |

