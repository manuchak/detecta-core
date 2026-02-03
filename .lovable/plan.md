
# Plan: Optimizacion de Espaciado Vertical - Vista Custodios

## Analisis de UI/UX

### Problemas Detectados

| Elemento | Problema | Desperdicio |
|----------|----------|-------------|
| Contenedor principal | `space-y-6` (24px gaps) | ~48px |
| Card del mapa | CardHeader + padding | ~80px |
| Calculo altura | No compensa zoom 70% | Variable |
| Metricas grid | Padding interno excesivo | ~20px |

### Calculo Correcto con Zoom 70%

```text
Viewport real:        100vh
Con zoom 70%:         100vh / 0.7 = ~143vh efectivo
Offset necesario:     ~300px (compensado)

Formula corregida:    calc((100vh / 0.7) - 300px)
Alternativa simple:   calc(100vh - 210px) = equivalente visual
```

## Cambios Propuestos

### 1. Reducir Espaciado General

```tsx
// CustodiosZonasTab.tsx
// Antes
<div className="space-y-6">

// Despues  
<div className="space-y-4">
```

### 2. Eliminar Card Wrapper del Mapa

Convertir el mapa de un Card envuelto a un componente directo con header inline:

```tsx
// Antes: Card > CardHeader > CardContent > Mapa
// Despues: Contenedor directo con header integrado

<div className="rounded-lg border bg-card">
  <div className="flex items-center justify-between px-4 py-2 border-b">
    <div className="flex items-center gap-2 text-sm font-medium">
      <Map className="h-4 w-4 text-primary" />
      Distribucion por Zona
    </div>
    <Badge>...</Badge>
  </div>
  <div className="flex gap-3 p-3" style={{ height }}>
    {/* Mapa + Leyenda */}
  </div>
</div>
```

### 3. Ajustar Altura Dinamica

```tsx
// Compensar zoom 70% correctamente
height = "calc(100vh - 280px)"

// Con min-height de seguridad
className="min-h-[320px]"
```

### 4. Compactar Metricas (Opcional)

```tsx
// Reducir padding interno de las apple-metric cards
// De p-4 a p-3, manteniendo legibilidad
```

## Layout Final Esperado

```text
┌──────────────────────────────────────────────────────────────────┐
│ Configuracion de Planeacion                                      │
│ Configura operativos, proveedores y parametros del sistema       │
├──────────────────────────────────────────────────────────────────┤
│ [Custodios] [Armados] [Proveedores] [Esquemas] ...               │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  <- gap-4 (16px)    │
│ │ 100    │ │ 0      │ │ 9      │ │ 100%   │  <- padding reducido │
│ │ Activos│ │Sin Zona│ │ Zonas  │ │Complet.│                      │
│ └────────┘ └────────┘ └────────┘ └────────┘                      │
├──────────────────────────────────────────────────────────────────┤
│ Distribucion por Zona                          [8 zonas]         │
│ ───────────────────────────────────────────────────────────────  │
│ ┌───────────────────────────────────────────┐ ┌─────────────────┐│
│ │                                           │ │ Zonas           ││
│ │                                           │ │                 ││
│ │            MAPA MAXIMIZADO                │ │ ● CDMX      45  ││
│ │          (calc(100vh - 280px))            │ │ ● EdoMex    22  ││
│ │                                           │ │ ● Jalisco   10  ││
│ │                                           │ │ ● ...           ││
│ │                                           │ │                 ││
│ │                                           │ │ Ranking:        ││
│ │                                           │ │ Alta Media Baja ││
│ └───────────────────────────────────────────┘ └─────────────────┘│
│ ℹ Haz clic en una zona...                                        │
└──────────────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `CustodiosZonasTab.tsx` | Reducir `space-y-6` a `space-y-4` |
| `CustodianZoneBubbleMap.tsx` | Compactar Card: header inline, reducir padding, ajustar altura a `calc(100vh - 280px)` |

## Beneficios

- Aprovechamiento de pantalla: +15-20% espacio para el mapa
- Sin scroll vertical en viewports estandar
- Jerarquia visual mantenida
- Header del mapa mas ligero pero funcional
