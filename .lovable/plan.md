

## Mejoras al Dashboard Ejecutivo: GMV Diario y GMV MoM

### Cambio 1: GMV Diario - De barras a linea suavizada

**Archivo:** `src/components/executive/GmvDailyChart.tsx`

- Reemplazar el `BarChart` + `Bar` de Recharts por `AreaChart` + `Area` con `type="monotone"` para lograr la curva suavizada
- Agregar puntos (`dot`) en cada dia para marcar los hitos diarios
- Mantener el gradiente debajo de la linea (area fill) para dar contexto visual
- Conservar el tooltip con la misma informacion (dia, GMV, servicios)
- Mantener las etiquetas de valor en los puntos mas relevantes

### Cambio 2: Layout - Mas espacio para GMV MoM

**Archivo:** `src/pages/Dashboard/ExecutiveDashboard.tsx`

El layout actual del Bloque 1 es:

```text
[ GMV Diario (1/3) ] [ YTD Card (1/3) ] [ GMV MoM (1/3) ]
```

Se cambiara a un layout donde GMV MoM ocupe 2 columnas:

```text
[ GMV Diario (1/3) ] [ GMV MoM Multi-Ano (2/3)          ]
```

- `GmvDailyChart` mantiene 1 columna (`lg:col-span-1`)
- `GmvMoMChart` se expande a 2 columnas (`lg:col-span-2`)
- `GmvAccumulatedCard` (YTD 2026 vs 2025) se reubica dentro de la tarjeta de GMV MoM como un header compacto o se mueve al Bloque 2

Para no perder ninguna informacion, la tarjeta YTD se reubicara al Bloque 2, reemplazando la posicion antes del donut de clientes:

```text
Bloque 1: [ GMV Diario (1/3) ] [ GMV MoM Multi-Ano (2/3)          ]
Bloque 2: [ YTD Card (1/3)   ] [ GMV por Cliente (1/3) ] [ GMV por Ano (1/3) ]
Bloque 3: [ GMV Trimestre     ] [ ... resto igual ...                        ]
```

### Detalle tecnico

**GmvDailyChart.tsx:**
- Cambiar imports de `BarChart, Bar` a `AreaChart, Area`
- Agregar gradiente `linearGradient` para el fill del area
- Usar `type="monotone"` en el `Area` para curva suavizada
- Configurar `dot={{ fill: 'hsl(var(--primary))', r: 3 }}` para los puntos en cada dia
- Remover `LabelList` (las etiquetas de barras) ya que en linea suavizada se ven mejor solo en el tooltip

**ExecutiveDashboard.tsx:**
- Bloque 1: cambiar de 3 columnas iguales a `GmvDailyChart` (1 col) + `GmvMoMChart` (2 cols con `lg:col-span-2`)
- Bloque 2: agregar `GmvAccumulatedCard` como primera tarjeta, seguida de `GmvClientDonut` y `GmvByYearChart`
- Mover `GmvByQuarterChart` a un nuevo Bloque 3 o mantenerlo en el existente

No se elimina ni omite ninguna tarjeta ni dato; solo se reorganiza el orden para dar mas espacio al grafico MoM multi-ano.
