

## Libreria de Graficas Nativas para PDF

### Objetivo
Crear un conjunto de componentes de graficas reutilizables usando las primitivas SVG nativas de `@react-pdf/renderer` (`Svg`, `Rect`, `Circle`, `Line`, `Path`, `Text`, `G`) que se integren al Design System existente en `src/components/pdf/`.

### Componentes a Implementar

| Componente | Uso Principal | Primitivas SVG |
|---|---|---|
| `PDFBarChart` | Comparativas mensuales, costos, servicios | `Rect`, `Line`, `Text` |
| `PDFLineChart` | Tendencias temporales (CPA, engagement) | `Path`, `Circle`, `Text` |
| `PDFPieChart` | Distribuciones porcentuales (costos, proveedores) | `Path`, `Text` |
| `PDFGaugeChart` | KPIs porcentuales (retención, aprovechamiento) | `Path`, `Circle`, `Text` |
| `PDFHorizontalBarChart` | Rankings, comparativas simples | `Rect`, `Text` |
| `PDFStackedBarChart` | Composición por categoría (proveedores) | `Rect`, `Line`, `Text` |

### API de cada componente

Todos los componentes seguiran una interfaz consistente:

```typescript
// Datos genéricos
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

// Props comunes
interface BaseChartProps {
  width?: number;    // default 500
  height?: number;   // default 200
  title?: string;
}

// Bar Chart
interface PDFBarChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  showValues?: boolean;
  barColor?: string;
}

// Line Chart
interface PDFLineChartProps extends BaseChartProps {
  labels: string[];
  series: ChartSeries[];
  showDots?: boolean;
  showGrid?: boolean;
}

// Pie Chart
interface PDFPieChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  showLabels?: boolean;
  showPercentages?: boolean;
  innerRadius?: number; // >0 = donut
}

// Gauge
interface PDFGaugeChartProps {
  value: number;       // 0-100
  label?: string;
  size?: number;       // default 100
  color?: string;
  thresholds?: { value: number; color: string }[];
}
```

### Estructura de archivos

```
src/components/pdf/
  charts/
    index.ts              -- re-exporta todo
    chartUtils.ts         -- helpers: escalado, paths SVG, colores
    PDFBarChart.tsx
    PDFLineChart.tsx
    PDFPieChart.tsx
    PDFGaugeChart.tsx
    PDFHorizontalBarChart.tsx
    PDFStackedBarChart.tsx
```

Se actualizara `src/components/pdf/index.ts` para re-exportar los charts.

### Detalles tecnicos

**Helpers en `chartUtils.ts`:**
- `scaleLinear(domain, range)` -- mapeo de valores a pixeles (sin dependencia de d3)
- `describeArc(cx, cy, r, startAngle, endAngle)` -- genera path SVG para arcos (pie/gauge)
- `polylinePath(points)` -- genera string de path SVG para lineas
- `getChartColors(n)` -- devuelve n colores del palette corporativo

**Ejes y Grid:**
- Eje Y con ticks automaticos y labels alineados a la izquierda
- Eje X con labels rotados si son largos
- Grid horizontal con lineas punteadas (stroke-dasharray via `strokeDasharray`)
- Margen interno configurable para acomodar labels

**Palette de colores por defecto:**
Usara los tokens existentes: `PDF_COLORS.red`, `PDF_COLORS.info`, `PDF_COLORS.success`, `PDF_COLORS.warning`, `PDF_COLORS.orange`, `PDF_COLORS.locationBlue`

**Gauge:**
- Arco semicircular (180 grados) con aguja indicadora
- Colores por umbrales (verde >= 70, amarillo >= 40, rojo < 40) configurables
- Texto central con el valor

**Pie/Donut:**
- Calculo de arcos via funciones trigonometricas
- Labels externos con lineas conectoras opcionales
- Soporte donut via `innerRadius`

### Secuencia de implementacion

1. Crear `chartUtils.ts` con todas las funciones helper
2. Crear `PDFBarChart.tsx` (mas simple, valida la base)
3. Crear `PDFHorizontalBarChart.tsx` (variante)
4. Crear `PDFLineChart.tsx` (multi-serie)
5. Crear `PDFPieChart.tsx` (con soporte donut)
6. Crear `PDFGaugeChart.tsx` (semicircular)
7. Crear `PDFStackedBarChart.tsx` (multi-serie apilado)
8. Crear `charts/index.ts` y actualizar `pdf/index.ts`

### Consideraciones

- **Sin dependencias externas**: todo se construye con primitivas SVG de `@react-pdf/renderer` y matematicas basicas (sin d3, sin recharts)
- **Consistencia visual**: usa `PDF_COLORS`, `PDF_FONT_SIZES` del design system existente
- **Responsive dentro del PDF**: width/height configurables, escalado proporcional interno
- **Fuente Inter**: los textos dentro de SVG usaran `fontFamily: 'Inter'` para consistencia con el resto del PDF

