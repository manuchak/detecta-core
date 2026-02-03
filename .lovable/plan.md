
# Plan: Alinear Fuentes de Datos con Perfiles Operativos

## Objetivo

Garantizar que los datos mostrados en las pestañas de configuración de Planeación (Custodios y Armados) coincidan con la fuente de verdad establecida en **Perfiles Operativos**, que representa el punto de convergencia entre Supply y Planeación.

## Discrepancias Actuales

| Aspecto | Perfiles Operativos | Config Custodios | Config Armados |
|---------|---------------------|------------------|----------------|
| Estados incluidos | `activo` + `suspendido` | Solo `activo` | Solo `activo` |
| Filtro actividad | Sin filtro (todos) | Forzado 90d | Selector (default 90d) |
| Consistencia | Fuente de verdad | Subconjunto | Subconjunto |

## Cambios Propuestos

### 1. CustodiosZonasTab.tsx

**A. Expandir query de estados**
```tsx
// ANTES
.eq('estado', 'activo')

// DESPUÉS  
.in('estado', ['activo', 'suspendido'])
```

**B. Agregar selector de filtro de actividad** (igual que Armados)
```tsx
// Nuevo estado y constantes
const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

const ACTIVITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: '60', label: 'Últimos 60 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '120', label: 'Últimos 120 días' },
  { value: '120+', label: 'Sin actividad +120 días' },
];
```

**C. Implementar lógica de filtrado por actividad**
```tsx
const custodiosPorActividad = useMemo(() => {
  if (activityFilter === 'all') return custodios;
  
  return custodios.filter(c => {
    const days = getDaysSinceLastService(c.fecha_ultimo_servicio);
    if (activityFilter === '120+') {
      return days === null || days > 120;
    }
    const maxDays = parseInt(activityFilter);
    return days !== null && days <= maxDays;
  });
}, [custodios, activityFilter]);
```

**D. Actualizar etiquetas de métricas**
```tsx
// Métrica dinámica según filtro
<div className="apple-metric-label">
  {activityFilter === 'all' 
    ? 'Total Activos' 
    : `Activos (${activityFilter === '120+' ? '+120d' : activityFilter + 'd'})`}
</div>
```

### 2. ArmadosZonasTab.tsx

**A. Cambiar default de filtro**
```tsx
// ANTES
const [activityFilter, setActivityFilter] = useState<ActivityFilter>('90');

// DESPUÉS
const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
```

**B. Incluir estado suspendido**
```tsx
// ANTES
.eq('estado', 'activo')

// DESPUÉS
.in('estado', ['activo', 'suspendido'])
```

## Resultado Esperado

Después de los cambios, las tres vistas mostrarán datos consistentes:

| Vista | Estados | Default Actividad | Selector |
|-------|---------|-------------------|----------|
| Perfiles Operativos | `activo`, `suspendido` | Todos | No aplica |
| Config Custodios | `activo`, `suspendido` | Todos | Si (nuevo) |
| Config Armados | `activo`, `suspendido` | Todos | Si |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `CustodiosZonasTab.tsx` | Expandir query, agregar selector actividad, actualizar métricas |
| `ArmadosZonasTab.tsx` | Cambiar default a 'all', expandir query a incluir suspendidos |

## Notas Técnicas

- El filtro de actividad será visual/UI, no afecta las queries a DB
- Las métricas se recalculan dinámicamente según el filtro seleccionado
- Se mantiene consistencia con el diseño existente de ArmadosZonasTab
- Los custodios/armados suspendidos se mostrarán pero podrán identificarse visualmente si se requiere
