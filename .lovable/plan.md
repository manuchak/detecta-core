

# Plan: Optimizar Espacio Vertical en Dashboard de Facturación

## Problema Identificado

El dashboard de facturación tiene dos problemas de layout:

| Card | Problema Actual | Visual |
|------|-----------------|--------|
| **Bar Chart (izq)** | Altura dinámica `var(--vh-full)-340px` | ✓ Correcto |
| **Pie Chart (der)** | Altura fija `180px` + contenido estático | ❌ No llena espacio |

Las tarjetas no tienen alturas iguales, dejando espacio blanco significativo.

## Solución Propuesta

### Estrategia: Cards con Altura Igualada + Contenido Flex

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ANTES                                                                        │
│ ┌────────────────────────────┐  ┌───────────────────────┐                   │
│ │                            │  │  Pie Chart (180px)    │                   │
│ │    Bar Chart               │  ├───────────────────────┤                   │
│ │    (var(--vh-full)-340px)  │  │  Legend               │                   │
│ │                            │  │  Insights             │                   │
│ │                            │  └───────────────────────┘                   │
│ │                            │                            ESPACIO VACÍO     │
│ └────────────────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DESPUÉS                                                                      │
│ ┌────────────────────────────┐  ┌───────────────────────┐                   │
│ │                            │  │                       │                   │
│ │    Bar Chart               │  │   Pie Chart (flex-1)  │                   │
│ │    (var(--vh-full)-340px)  │  │   ~ 250px dinámico    │                   │
│ │                            │  ├───────────────────────┤                   │
│ │                            │  │   Legend (shrink-0)   │                   │
│ │                            │  │   Insights (shrink-0) │                   │
│ └────────────────────────────┘  └───────────────────────┘                   │
│                                 ALTURAS IGUALES - SIN ESPACIO VACÍO         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Cambios en FacturacionDashboard.tsx

### 1. Grid con Items Estirados

Agregar `items-stretch` al grid para forzar alturas iguales:

```tsx
// ANTES
<div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

// DESPUÉS  
<div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">
```

### 2. Card Derecha con Altura Dinámica

Hacer que la card de pie chart use flexbox para distribuir espacio:

```tsx
// ANTES
<Card className="lg:col-span-2 border-border/50">
  <CardHeader>...</CardHeader>
  <CardContent className="p-3 pt-0 flex flex-col">
    <div className="h-[180px]">  {/* FIJA */}
      <PieChart>...</PieChart>
    </div>
    <div className="space-y-1.5 mb-3">...</div>  {/* Legend */}
    <div className="pt-2 border-t">...</div>     {/* Insights */}
  </CardContent>
</Card>

// DESPUÉS
<Card className="lg:col-span-2 border-border/50 flex flex-col h-[calc(var(--vh-full)-340px)]">
  <CardHeader>...</CardHeader>
  <CardContent className="p-3 pt-0 flex flex-col flex-1 min-h-0">
    <div className="flex-1 min-h-[180px]">  {/* DINÁMICA */}
      <PieChart>...</PieChart>
    </div>
    <div className="space-y-1.5 mb-3 shrink-0">...</div>  {/* Legend */}
    <div className="pt-2 border-t shrink-0">...</div>     {/* Insights */}
  </CardContent>
</Card>
```

### 3. Ajustar CardContent del Bar Chart

Para consistencia, asegurar que el container también use flex:

```tsx
<Card className="lg:col-span-3 border-border/50 flex flex-col">
  <CardHeader className="py-2.5 px-4 shrink-0">...</CardHeader>
  <CardContent className="p-3 pt-0 flex-1 min-h-0">
    <div className="h-full min-h-[300px]">
      <ResponsiveContainer>...</ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

## Código Final Propuesto

```tsx
{/* Charts Row - Layout asimétrico con alturas iguales */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
  {/* Bar Chart - 3/5 del ancho */}
  <Card className="lg:col-span-3 border-border/50 flex flex-col h-[calc(var(--vh-full)-260px)] min-h-[400px]">
    <CardHeader className="py-2.5 px-4 shrink-0">
      <CardTitle className="text-sm font-medium">Top 10 Clientes por Ingresos</CardTitle>
    </CardHeader>
    <CardContent className="p-3 pt-0 flex-1 min-h-0">
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* BarChart content */}
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>

  {/* Pie Chart + Insights - 2/5 del ancho */}
  <Card className="lg:col-span-2 border-border/50 flex flex-col h-[calc(var(--vh-full)-260px)] min-h-[400px]">
    <CardHeader className="py-2.5 px-4 shrink-0">
      <CardTitle className="text-sm font-medium">Concentración de Ingresos</CardTitle>
    </CardHeader>
    <CardContent className="p-3 pt-0 flex flex-col flex-1 min-h-0">
      {/* Pie chart se expande */}
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          {/* PieChart content */}
        </ResponsiveContainer>
      </div>

      {/* Legend - altura fija */}
      <div className="space-y-1.5 my-3 shrink-0">
        {/* Legend items */}
      </div>

      {/* Insights Panel - altura fija */}
      <div className="pt-2 border-t space-y-1.5 shrink-0">
        {/* Insights content */}
      </div>
    </CardContent>
  </Card>
</div>
```

## Cálculo del Offset

| Elemento | Altura (px) |
|----------|-------------|
| TopBar | ~56 |
| Header módulo | ~56 |
| Tabs | ~44 |
| Hero KPIs | ~80 |
| Espaciado (gaps) | ~24 |
| **Total** | **~260px** |

Reducimos de 340px a **260px** para aprovechar más espacio vertical.

## Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Facturacion/components/FacturacionDashboard.tsx` | Layout flex, alturas dinámicas |

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Card izquierda | ~calc(vh-340px) | calc(vh-260px) |
| Card derecha | ~350px fija | calc(vh-260px) dinámica |
| Espacio blanco | ~200px | 0px |
| Pie chart | 180px fijo | ~250px+ dinámico |

## Beneficios

1. **Aprovechamiento total del viewport** - Sin espacio blanco desperdiciado
2. **Cards con alturas iguales** - Diseño balanceado visualmente
3. **Pie chart más grande** - Mejor legibilidad de los datos
4. **Consistencia** - Mismo patrón que otros módulos del sistema

