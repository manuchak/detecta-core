

## Incorporar Rating y Ranking en la Vista de Lista de Perfiles Operativos

### Situacion actual

La tabla de custodios (`CustodiosDataTable`) muestra la columna "Rating" usando el campo estatico `rating_promedio` de la base de datos, que no refleja las metricas calculadas en tiempo real. El ranking de flota no aparece en la lista.

El hook `useOperativeRating` no se puede usar por fila porque ejecuta 5+ sub-queries por custodio, lo cual seria prohibitivo para una tabla de cientos de registros.

### Estrategia: Ranking batch para la lista

Reutilizar la logica de `useFleetRanking` (que ya consulta todos los servicios de 30 dias y calcula scores por custodio) para generar un **mapa completo de rankings** que se pueda consultar por nombre en cada fila de la tabla.

### Cambios propuestos

**1. Crear `src/pages/PerfilesOperativos/hooks/useFleetRankingBatch.ts`**

Nuevo hook que retorna un `Map<string, RankingEntry>` con la posicion, score, y tier de TODOS los custodios activos en los ultimos 30 dias. Reutiliza la misma query y logica de scoring que `useFleetRanking.ts` pero en vez de buscar un solo nombre, retorna el mapa completo.

```typescript
interface RankingEntry {
  posicion: number;
  totalFlota: number;
  percentil: number;
  tier: 'gold' | 'silver' | 'bronze' | 'standard';
  score: number; // el score compuesto usado para ordenar
}
```

Una sola query a `servicios_custodia` de 30 dias, procesada en el cliente para generar el ranking completo. Eficiente porque es exactamente la misma carga que el hook individual.

**2. Modificar `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx`**

- Importar `useFleetRankingBatch`
- Llamar al hook una vez en el componente
- Reemplazar la columna "Rating" (lineas 327-340) con una columna enriquecida que muestre:
  - Posicion de ranking con icono de medalla coloreado por tier (igual que en el header)
  - Score compuesto como tooltip
  - Formato: icono medalla + `#12` con color segun tier
- Mantener la columna de servicios como esta
- Agregar sorting por posicion de ranking

**3. Modificar `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx`** (columna Rating)

La columna "Rating" actual:
```
★ 3.6
```

Se reemplazara por el ranking de flota:
```
🏆 #3  (dorado)
🥈 #15 (plata)
🥉 #42 (bronce)
#78    (gris)
```

Con tooltip mostrando: "Posicion #3 de 85 - Top 4% - Score: 72"

### Resultado visual en la tabla

| Custodio | Zona | Actividad | Servicios | Ranking | Acciones |
|---|---|---|---|---|---|
| Juan Lopez | CDMX | Activo | 87 | Trophy #3 | ... |
| Maria Garcia | EDOMEX | Activo | 54 | Medal #15 | ... |
| Pedro Ruiz | NL | Moderado | 23 | #42 | ... |

### Performance

- Una sola query adicional para toda la tabla (misma que useFleetRanking ya hace)
- Cache de 5 minutos con staleTime
- El mapa se genera una vez y se consulta O(1) por fila
- Sin impacto significativo en carga

### Archivos afectados

| Archivo | Accion |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useFleetRankingBatch.ts` | Crear - hook batch con mapa completo |
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Modificar - reemplazar columna Rating por Ranking |

