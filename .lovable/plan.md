

# Plan: Implementar Mejoras UI del Análisis Fishbone

## Resumen de Cambios

Aplicar las 3 mejoras críticas identificadas en el análisis de causa raíz para maximizar la eficiencia visual del dashboard de facturación.

## Cambios Específicos

### 1. Pie Chart - Radios Dinámicos (Líneas 136-148)

**Problema**: Radios fijos (`innerRadius={45} outerRadius={75}`) no escalan con el contenedor flex, dejando ~70% del espacio como whitespace.

**Solución**: Usar porcentajes para que el gráfico se adapte al espacio disponible.

```tsx
// ANTES
<Pie
  data={pieData}
  cx="50%"
  cy="50%"
  innerRadius={45}
  outerRadius={75}
  paddingAngle={2}
  dataKey="value"
>

// DESPUÉS
<Pie
  data={pieData}
  cx="50%"
  cy="50%"
  innerRadius="40%"
  outerRadius="70%"
  paddingAngle={1}
  dataKey="value"
>
```

**Impacto**: El pie chart ahora ocupará ~70% del contenedor dinámicamente, escalando con la altura de la card.

---

### 2. Bar Chart - barSize y LabelList (Líneas 116-120)

**Problema**: Sin `barSize` definido, las barras se expanden excesivamente. Sin labels, los usuarios deben hacer hover para ver valores.

**Solución**: 
- Agregar `barSize={22}` para barras compactas y consistentes
- Agregar `LabelList` para mostrar valores directamente

```tsx
// ANTES
<Bar 
  dataKey="ingresos" 
  fill="hsl(var(--primary))" 
  radius={[0, 4, 4, 0]}
/>

// DESPUÉS
<Bar 
  dataKey="ingresos" 
  fill="hsl(var(--primary))" 
  radius={[0, 4, 4, 0]}
  barSize={22}
>
  <LabelList 
    dataKey="ingresos" 
    position="right" 
    formatter={(value: number) => `$${(value/1000).toFixed(0)}k`}
    className="fill-muted-foreground text-[9px]"
  />
</Bar>
```

**Impacto**: 
- Barras de altura uniforme (22px)
- Valores visibles sin interacción
- Mejor aprovechamiento del espacio vertical

---

### 3. CartesianGrid - Menor Opacidad (Línea 92)

**Problema**: El grid con `stroke-border/50` es demasiado prominente y compite visualmente con los datos.

**Solución**: Reducir opacidad y usar stroke horizontal únicamente.

```tsx
// ANTES
<CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />

// DESPUÉS
<CartesianGrid 
  strokeDasharray="3 3" 
  horizontal={true}
  vertical={false}
  stroke="hsl(var(--border))"
  opacity={0.3}
/>
```

**Impacto**: Grid sutil que guía la lectura sin distraer de los datos.

---

## Cambio de Import

Agregar `LabelList` al import de recharts:

```tsx
// Línea 6-17
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,  // NUEVO
} from 'recharts';
```

---

## Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Facturacion/components/FacturacionDashboard.tsx` | Import + Pie radios + Bar barSize/LabelList + Grid opacity |

---

## Comparación Visual Esperada

| Elemento | Antes | Después |
|----------|-------|---------|
| **Pie Chart** | ~150px fijo, 30% del contenedor | Escala a ~70% del contenedor |
| **Bar thickness** | Variable (~40px) | Fijo 22px, más barras visibles |
| **Data labels** | Solo en hover | Visibles directamente |
| **Grid** | Prominente, distrae | Sutil, guía lectura |

---

## Detalles Técnicos

### Por qué porcentajes en Pie vs píxeles

Los porcentajes (`innerRadius="40%"`) se calculan respecto al menor entre width y height del `ResponsiveContainer`. Con un contenedor `flex-1`, esto significa:
- En pantallas grandes: pie más grande
- En pantallas pequeñas: pie proporcional
- Sin desperdicio de espacio

### LabelList positioning

`position="right"` coloca los labels fuera de la barra, lo cual es ideal para `layout="vertical"`. El margen derecho de 20px en el BarChart ya contempla este espacio.

