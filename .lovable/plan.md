
# Plan: Optimizar UX/UI del Modal de Asignacion de Custodios

## Analisis UX del Estado Actual

Evaluando el popup desde la perspectiva de un UX designer:

### Problemas Identificados

| Elemento | Problema | Impacto |
|----------|----------|---------|
| **Ancho modal** | `max-w-4xl` (~896px) desperdicia espacio en pantallas grandes | Bajo aprovechamiento del viewport |
| **QuickStats** | Grid 4x1 ocupa ~80px de altura | Espacio vertical innecesario |
| **Service Info Card** | Card completa con padding generoso | Informacion de contexto consume espacio de seleccion |
| **CustodianCard** | Diseno vertical con zonas separadas (Info/Actions) | Solo ~1.5 cards visibles en el viewport |
| **Espaciado** | `space-y-4` (16px) entre todos los elementos | Densidad de informacion baja |
| **Busqueda + Filtros** | Ocupan ~100px de altura combinados | Reduce espacio para la lista |

### Metricas Actuales vs Ideales

```text
Altura visible para lista:    ~300px (actual) vs ~450px (ideal)
Cards visibles simultaneas:   ~1.5 (actual) vs ~3-4 (ideal)  
Densidad de informacion:      Baja (actual) vs Media-Alta (ideal)
```

## Solucion Propuesta

### 1. Layout de Dos Columnas

Reorganizar el modal en un layout horizontal:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Agregar Custodio - ece1c7ff-da47-441f-ac76-8e9d34a36727        [X] │
├───────────────────────────────┬─────────────────────────────────────┤
│                               │                                     │
│  CONTEXTO DEL SERVICIO       │  SELECCION DE CUSTODIO              │
│  ┌─────────────────────────┐ │  ┌─────────────────────────────────┐│
│  │ Cliente: PENARANDA      │ │  │ 🟢94  🟡2  🟠0  ⚠️16           ││
│  │ Ruta: CASETA → PENJAMO  │ │  ├─────────────────────────────────┤│
│  │ Custodio: Sin asignar   │ │  │ 🔍 Buscar...  [Disp✓][Parc✓]  ││
│  │ Estado: --               │ │  ├─────────────────────────────────┤│
│  └─────────────────────────┘ │  │ ┌─────────────────────────────┐ ││
│                               │  │ │ Juan P.  92%  🎯Priorizar  │ ││
│  RAZON DE CAMBIO             │  │ │ 📱5512.. 🚗Nissan 3L/2F   │ ││
│  ┌─────────────────────────┐ │  │ │ [WA][Tel]         [Asignar]│ ││
│  │ Textarea compacto       │ │  │ └─────────────────────────────┘ ││
│  │                          │ │  │ ┌─────────────────────────────┐ ││
│  └─────────────────────────┘ │  │ │ Maria G.  87%  Alta carga  │ ││
│                               │  │ │ ...                         │ ││
│  [Remover asignacion]        │  │ └─────────────────────────────┘ ││
│                               │  └─────────────────────────────────┘│
├───────────────────────────────┴─────────────────────────────────────┤
│                                        [Cancelar] [Agregar Custodio]│
└─────────────────────────────────────────────────────────────────────┘
```

### 2. QuickStats Compactos

Cambiar de grid vertical a badges inline:

```tsx
// Antes: Grid de 4 columnas ocupando ~80px
<div className="grid grid-cols-4 gap-2">
  <div className="p-3 rounded-lg">🟢 94 Disponibles</div>
  ...
</div>

// Despues: Badges inline ocupando ~32px
<div className="flex items-center gap-3 text-sm">
  <span className="text-success font-medium">🟢 94</span>
  <span className="text-warning font-medium">🟡 2</span>
  <span className="text-chart-4 font-medium">🟠 0</span>
  <span className="text-destructive font-medium">⚠️ 16</span>
</div>
```

### 3. CustodianCard Compacto (Variante Modal)

Crear una variante horizontal mas densa para uso en modales:

```tsx
// Nueva variante: CustodianCardCompact
<div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50">
  {/* Info compacta - 60% del ancho */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="font-medium truncate">Juan Perez</span>
      <Badge variant="outline" className="text-xs">92%</Badge>
      <Badge className="text-xs bg-success/10 text-success">Priorizar</Badge>
    </div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
      <span>📱 5512345678</span>
      <span>🚗 Nissan Versa</span>
      <span>58d • 3L/2F</span>
    </div>
  </div>
  
  {/* Acciones - 40% del ancho */}
  <div className="flex items-center gap-1.5">
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MessageCircle className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Phone className="h-4 w-4" />
    </Button>
    <Button size="sm">Asignar</Button>
  </div>
</div>
```

### 4. Espaciado Optimizado

```tsx
// Reducir espaciado global
<div className="space-y-2"> // Antes: space-y-4

// Modal mas ancho
<DialogContent className="max-w-5xl"> // Antes: max-w-4xl

// Lista mas alta
<div className="max-h-[500px]"> // Antes: max-h-[400px]
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/planeacion/ReassignmentModal.tsx` | Layout 2 columnas, espaciado reducido |
| `src/pages/.../CustodianStep/components/QuickStats.tsx` | Agregar variante `compact` |
| `src/pages/.../CustodianStep/components/CustodianCard.tsx` | Agregar variante `compact` via prop |

## Detalles Tecnicos

### ReassignmentModal.tsx

**Estructura del layout de dos columnas:**

```tsx
<DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
  <DialogHeader>...</DialogHeader>
  
  {/* Two-column layout */}
  <div className="flex-1 overflow-hidden flex gap-6">
    {/* Left Column - Context */}
    <div className="w-[280px] flex-shrink-0 space-y-4">
      {/* Service Info - compact */}
      <div className="p-3 rounded-lg bg-muted/30 border text-sm space-y-2">
        <div><span className="text-muted-foreground">Cliente:</span> {service.nombre_cliente}</div>
        <div><span className="text-muted-foreground">Ruta:</span> {service.origen} → {service.destino}</div>
        <div><span className="text-muted-foreground">Custodio:</span> {currentAssignment || 'Sin asignar'}</div>
      </div>
      
      {/* Reason textarea */}
      <div className="space-y-2">
        <Label className="text-sm">Razon del cambio</Label>
        <Textarea 
          value={reason} 
          onChange={...} 
          rows={3} 
          className="resize-none"
        />
      </div>
      
      {/* Remove button (if applicable) */}
      {currentAssignment && onRemove && (
        <Button variant="ghost" className="text-destructive w-full">
          Remover asignacion actual
        </Button>
      )}
    </div>
    
    {/* Right Column - Selection */}
    <div className="flex-1 overflow-hidden flex flex-col space-y-3">
      {/* Compact stats inline */}
      <QuickStats categorized={categorized} isLoading={isLoadingCustodians} variant="compact" />
      
      {/* Search */}
      <CustodianSearch ... />
      
      {/* List with more vertical space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <CustodianList 
          custodians={filteredCustodians}
          variant="compact"
          ...
        />
      </div>
    </div>
  </div>
  
  <DialogFooter>...</DialogFooter>
</DialogContent>
```

### QuickStats.tsx - Variante Compact

```tsx
interface QuickStatsProps {
  categorized: CustodiosCategorizados | undefined;
  isLoading: boolean;
  variant?: 'default' | 'compact';
}

export function QuickStats({ categorized, isLoading, variant = 'default' }: QuickStatsProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-sm py-1">
        <span className="text-success font-medium flex items-center gap-1">
          <Circle className="h-2.5 w-2.5 fill-success" />
          {categorized?.disponibles?.length ?? 0}
        </span>
        <span className="text-warning font-medium flex items-center gap-1">
          <Circle className="h-2.5 w-2.5 fill-warning" />
          {categorized?.parcialmenteOcupados?.length ?? 0}
        </span>
        <span className="text-chart-4 font-medium flex items-center gap-1">
          <Circle className="h-2.5 w-2.5 fill-chart-4" />
          {categorized?.ocupados?.length ?? 0}
        </span>
        <span className="text-destructive font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {categorized?.noDisponibles?.length ?? 0}
        </span>
      </div>
    );
  }
  
  // ... existing grid layout for default variant
}
```

### CustodianCard.tsx - Variante Compact

```tsx
interface CustodianCardProps {
  // ... existing props
  variant?: 'default' | 'compact';
}

// Inside component, conditional rendering based on variant
if (variant === 'compact') {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Compact horizontal layout */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{custodio.nombre}</span>
          <span className="text-xs text-muted-foreground">{scorePercentage}%</span>
          {getEquidadBadge()}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {custodio.telefono}
          </span>
          {vehicleInfo && (
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {vehicleInfo}
            </span>
          )}
          <ServiceHistoryBadges ... variant="inline" />
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onContact('whatsapp')}>
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onContact('llamada')}>
          <Phone className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={onSelect}>
          Asignar
        </Button>
      </div>
    </div>
  );
}
```

## Resultado Esperado

| Metrica | Antes | Despues |
|---------|-------|---------|
| Ancho modal | 896px | 1024px |
| Cards visibles | ~1.5 | ~4-5 |
| Altura QuickStats | ~80px | ~32px |
| Altura CustodianCard | ~180px | ~60px |
| Espacio para lista | ~300px | ~450px |
| Contexto del servicio | Inline (ocupa ancho) | Columna izquierda (fija) |

## Beneficios

1. **Mayor eficiencia** - Planners ven mas opciones sin scroll
2. **Mejor contexto** - Info del servicio siempre visible a la izquierda
3. **Accion mas rapida** - Botones de contacto accesibles inline
4. **Aprovechamiento del espacio** - Layout adapta a pantallas grandes
5. **Consistencia** - Las variantes `compact` se pueden reutilizar en otros modales
