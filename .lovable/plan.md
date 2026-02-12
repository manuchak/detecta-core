

## Actualizar Ficha de Custodio con Rating, Score y Ranking General

### Concepto

Enriquecer la ficha/header del perfil operativo con las metricas calculadas del sistema de rating, y agregar un **Ranking General** que posiciona al custodio dentro de toda la flota basado en su performance de los ultimos 30 dias. El ranking incentiva la excelencia al mostrar su posicion competitiva.

### Ranking General - Logica

El ranking se calcula comparando el `scoreGlobal` de performance (puntualidad + confiabilidad + checklist + docs + volumen) de los ultimos 30 dias de **todos** los custodios activos. Cada custodio recibe una posicion (#1, #2, ... #N).

**Fuente de datos**: Query a `servicios_custodia` de los ultimos 30 dias, agrupando por `nombre_custodio` y calculando un score simplificado por cada uno. El custodio actual se ubica dentro de esa lista ordenada.

**Visualizacion en header**:
- Medalla con posicion: `#3 de 85` (ranking / total flota activa)
- Color por percentil: Top 10% = dorado, Top 25% = plata, Top 50% = bronce, resto = gris

### Cambios en la ficha (PerfilHeader)

La fila de "quick stats" actual muestra:

```text
★ 3.6  |  ⏱ 87 servicios  |  ↗ Score: 6
```

Se actualizara a mostrar metricas **calculadas en tiempo real**:

```text
★ 4.2 Destacado  |  🏆 #3/85  |  ⏱ 87 servicios  |  ↗ Score: 72
```

Donde:
- **Rating**: Viene de `useOperativeRating.ratingGeneral` + label (Excelente/Destacado/etc)
- **Ranking**: Posicion en la flota (#N/Total) con icono de medalla coloreado
- **Servicios**: Se mantiene de `profile.numero_servicios`
- **Score**: Se reemplaza con `useOperativeRating.scoreGeneral` (0-100) en vez del campo estatico

### Archivos a crear/modificar

**1. Crear `src/pages/PerfilesOperativos/hooks/useFleetRanking.ts`**

Nuevo hook que:
- Consulta `servicios_custodia` de los ultimos 30 dias para todos los custodios
- Calcula un score simplificado por custodio (basado en: total servicios completados, puntualidad cuando hay datos, revenue)
- Ordena de mayor a menor y determina la posicion del custodio actual
- Retorna: `{ posicion, totalFlota, percentil, tier }` donde tier es 'gold'/'silver'/'bronze'/'standard'

La query agrupara por nombre_custodio y calculara:
- Servicios completados en 30d
- Revenue total en 30d
- Puntualidad promedio (cuando hay hora_presentacion y fecha_hora_cita)
- Score compuesto simple para ordenamiento

**2. Modificar `src/pages/PerfilesOperativos/components/PerfilHeader.tsx`**

- Importar `useOperativeRating` y `useFleetRanking`
- Reemplazar la seccion de "quick stats" (lineas 144-175) para usar las metricas calculadas:
  - Rating con estrellas + label textual en vez de `profile.rating_promedio`
  - Badge de Ranking con posicion y medalla coloreada
  - Score general del rating (0-100) en vez de `profile.score_total`
  - Mantener servicios y vehiculo/licencia como estan
- Solo se activa para tipo 'custodio' (los armados mantienen el comportamiento actual)

### Detalle visual del ranking

| Percentil | Tier | Icono | Color fondo |
|---|---|---|---|
| Top 10% | Gold | Trophy | amber-500 |
| Top 25% | Silver | Medal | slate-400 |
| Top 50% | Bronze | Award | orange-700 |
| Resto | Standard | Hash | gray-500 |

### Archivos afectados

| Archivo | Accion |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useFleetRanking.ts` | Crear |
| `src/pages/PerfilesOperativos/components/PerfilHeader.tsx` | Modificar - enriquecer quick stats |

Sin cambios de base de datos. Todo se calcula en tiempo real desde datos existentes.

