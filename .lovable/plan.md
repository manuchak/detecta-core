
# Plan Ajustado: Mejoras UI para Pagina de Consultas de Servicios

## Principios Aplicados (de frameworks enterprise)

Basado en los patrones de Salesforce Lightning, IBM Carbon y Apple HIG que realmente aplican:

| Principio | Aplicacion Especifica |
|-----------|----------------------|
| Ley de Fitts | Botones de accion cerca del input activo |
| Recognition over Recall | Busquedas recientes siempre visibles |
| Progressive Disclosure | Campos opcionales colapsados por defecto |
| Feedback Inmediato | Contador de resultados persistente |
| Densidad Optima | Reducir scroll sin sacrificar legibilidad |

---

## Cambios Propuestos

### 1. Selector de Modo como Segmented Control

**Justificacion**: Los botones ghost actuales no comunican claramente que son mutuamente excluyentes. Un segmented control (patron Apple/Salesforce) indica visualmente "elige uno".

```
Antes:  [ID] [Cliente] [Custodio]  (botones separados)
Despues: ╭────────────────────────────────────────╮
         │ [Por ID] │ [Cliente/Fecha] │ [Custodio] │
         ╰────────────────────────────────────────╯
```

### 2. Busquedas Recientes en Header (Siempre Visibles)

**Justificacion**: Actualmente solo aparecen cuando no hay resultados. Segun el principio "Recognition over Recall", deben estar siempre accesibles.

```
╭─────────────────────────────────────────────────────────╮
│ Consultas de Servicios                                  │
│ Busca por ID, cliente o custodio    🕐 SAMS.. | abel.. │
╰─────────────────────────────────────────────────────────╯
```

### 3. Layout Compacto Input + Accion

**Justificacion**: Ley de Fitts - reducir distancia entre input y boton de accion.

```
Antes:                          Despues:
╭──────────────────────╮        ╭────────────────────────────────────╮
│ Label                │        │ [___input___________] [Buscar] [X] │
│ [input............]  │        │ ↵ Enter · Esc limpiar              │
│                      │        ╰────────────────────────────────────╯
│ [Buscar]  [Limpiar]  │
╰──────────────────────╯
```

### 4. Eliminar Footer Redundante de Cards

**Justificacion**: El texto "Doble clic para ver detalles" ocupa espacio valioso. El cursor pointer y hover state ya comunican interactividad.

**Alternativa**: Agregar icono subtle de expand (`ChevronRight`) en hover.

### 5. Contador de Resultados con Ordenamiento

**Justificacion**: Feedback inmediato + control de usuario.

```
17 resultados  ·  Ordenar: ▼ Mas recientes
```

### 6. Estado Vacio con Ejemplos Contextuales

**Justificacion**: Onboarding visual reduce curva de aprendizaje.

```
╭──────────────────────────────────────╮
│         🔍 Comienza tu busqueda      │
│                                      │
│  Ejemplos:                           │
│  • YONSYGU-131     (ID de servicio)  │
│  • SAMSUNG         (nombre cliente)  │
│  • Abel Cruz       (nombre custodio) │
╰──────────────────────────────────────╯
```

---

## Seccion Tecnica

### Archivo: `ServiceQueryTab.tsx`

**Cambio 1 - Segmented Control (lineas 133-158)**:
```tsx
// Reemplazar botones ghost por segmented control
<div className="inline-flex bg-muted/50 rounded-lg p-1 border border-border/50">
  <button
    onClick={() => setSearchMode('id')}
    className={cn(
      "px-3 py-1.5 text-sm rounded-md transition-all",
      searchMode === 'id' 
        ? "bg-background shadow-sm text-foreground font-medium" 
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Search className="h-3.5 w-3.5 mr-1.5 inline" />
    Por ID
  </button>
  {/* Similar para client y custodian */}
</div>
```

**Cambio 2 - Busquedas recientes en header (lineas 121-128)**:
```tsx
<div className="apple-section-header">
  <div className="flex-1">
    <h1>Consultas de Servicios</h1>
    <p>Busca por ID, cliente o custodio</p>
  </div>
  {recentSearches.length > 0 && (
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      {recentSearches.slice(0, 3).map((search, i) => (
        <Badge key={i} variant="secondary" className="cursor-pointer" 
               onClick={() => handleRecentSearchClick(search)}>
          {search.length > 10 ? search.slice(0,10) + '...' : search}
        </Badge>
      ))}
    </div>
  )}
</div>
```

**Cambio 3 - Layout compacto (lineas 160-280)**:
```tsx
// Modo ID: Input + botones en una fila
<div className="flex items-center gap-3">
  <div className="flex-1">
    <Input placeholder="ID del servicio..." value={serviceId} ... />
  </div>
  <Button onClick={handleSearch} disabled={...}>
    <Search className="h-4 w-4 mr-2" />Buscar
  </Button>
  <Button variant="ghost" onClick={handleClear}>
    <X className="h-4 w-4" />
  </Button>
</div>
<p className="text-xs text-muted-foreground mt-2">
  ↵ Enter para buscar · Esc para limpiar
</p>
```

**Cambio 4 - Eliminar bloque de tips separado (lineas 282-291)**:
Mover tips inline con botones de accion.

**Cambio 5 - Contador con ordenamiento (lineas 387-391)**:
```tsx
<div className="flex items-center justify-between">
  <span className="text-sm text-muted-foreground">
    <strong>{results.length}</strong> resultados
  </span>
  <Select defaultValue="recent">
    <SelectTrigger className="w-[160px] h-8">
      <SelectValue placeholder="Ordenar por" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="recent">Mas recientes</SelectItem>
      <SelectItem value="oldest">Mas antiguos</SelectItem>
      <SelectItem value="client">Por cliente</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Cambio 6 - Estado vacio mejorado (lineas 375-383)**:
```tsx
<div className="apple-empty-state">
  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
  <div className="text-lg font-medium">Comienza tu busqueda</div>
  <div className="mt-4 text-sm text-muted-foreground space-y-1">
    <p className="font-medium">Ejemplos:</p>
    <p><code className="bg-muted px-1.5 py-0.5 rounded">YONSYGU-131</code> ID de servicio</p>
    <p><code className="bg-muted px-1.5 py-0.5 rounded">SAMSUNG</code> nombre de cliente</p>
    <p><code className="bg-muted px-1.5 py-0.5 rounded">Abel Cruz</code> nombre de custodio</p>
  </div>
</div>
```

### Archivo: `ServiceQueryCard.tsx`

**Cambio 7 - Eliminar footer y agregar hover icon (lineas 152-158)**:
```tsx
// Eliminar el footer completo y agregar icono en hover
<div 
  className="apple-card apple-hover-lift cursor-pointer transition-all duration-200 p-4 group relative"
  onDoubleClick={() => onDoubleClick(service)}
>
  {/* Contenido existente... */}
  
  {/* Icono de expand en hover */}
  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all" />
</div>
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `ServiceQueryTab.tsx` | Segmented control, header con recientes, layout compacto, tips inline, contador con sort, empty state mejorado |
| `ServiceQueryCard.tsx` | Eliminar footer, agregar hover icon, reducir padding |

## Resultado Visual Esperado

```
ANTES                              DESPUES
╭────────────────────────────╮     ╭─────────────────────────────────────╮
│ Consultas de Servicios     │     │ Consultas...     🕐 SAMS | abel    │
│ Subtitulo largo            │     ├─────────────────────────────────────┤
├────────────────────────────┤     │ [Por ID│Cliente/Fecha│Custodio]    │
│ [ID] [Cliente] [Custodio]  │     ├─────────────────────────────────────┤
├────────────────────────────┤     │ [_________input_______][🔍][X]     │
│ Label                      │     │ ↵ Enter · Esc limpiar              │
│ [input................]    │     ├─────────────────────────────────────┤
│                            │     │ 17 resultados  ▼ Mas recientes     │
│ [Buscar]  [Limpiar]        │     ├─────────────────────────────────────┤
├────────────────────────────┤     │ [Card][Card][Card]                 │
│ ⚠ Atajos: Enter para...    │     │ [Card][Card][Card]                 │
├────────────────────────────┤     ╰─────────────────────────────────────╯
│ Busquedas recientes        │
│ [SAMS] [abel]              │
├────────────────────────────┤
│ 17 resultados              │
├────────────────────────────┤
│ [Card con footer]          │
│ [Card con footer]          │
╰────────────────────────────╯

Reduccion estimada: ~35% menos scroll vertical
```
