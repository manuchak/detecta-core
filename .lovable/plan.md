
# Plan: Mejoras de Fase 1 y 2 - Dashboard Operacional

## Resumen de Cambios

### Fase 1: Jerarquía Visual y Quick Wins
1. **Prominencia de "Sin Asignar"** - Card más grande con animación de pulso si > 0
2. **Ratio de Cobertura** - Nueva métrica: "Custodios / Servicios = X%"
3. **Ordenamiento por Urgencia** - Acciones prioritarias ordenadas por tiempo restante
4. **Eliminar Redundancia** - Unificar alerta crítica con card de "Sin Asignar"

### Fase 2: Contexto y Progreso
1. **Anillo de Progreso** - Visualizar % de asignaciones completadas
2. **Comparativa Temporal** - "+2 vs ayer" en métricas clave
3. **Indicador de Tendencia** - Flecha ↑↓ en métricas

---

## Cambios Técnicos Detallados

### 1. Nuevo Hook: `useServiciosAyer.ts`
Para comparativas temporales, necesitamos datos del día anterior:

```typescript
// src/hooks/useServiciosAyer.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export const useServiciosAyer = () => {
  return useQuery({
    queryKey: ['servicios-ayer'],
    queryFn: async () => {
      const ayer = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, custodio_asignado')
        .gte('fecha_hora_cita', `${ayer}T00:00:00`)
        .lt('fecha_hora_cita', `${ayer}T23:59:59`)
        .not('estado_planeacion', 'in', '(cancelado,completado)');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const sinAsignar = data?.filter(s => !s.custodio_asignado).length || 0;
      
      return { total, sinAsignar };
    },
    staleTime: 300000, // 5 min cache - datos históricos
  });
};
```

### 2. Componente: `CoverageRing.tsx`
Anillo de progreso SVG para visualizar cobertura:

```typescript
// src/components/planeacion/CoverageRing.tsx
interface CoverageRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function CoverageRing({ percentage, size = 80, strokeWidth = 8 }: CoverageRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 80) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${getColor()} transition-all duration-500`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{percentage}%</span>
      </div>
    </div>
  );
}
```

### 3. Componente: `TrendBadge.tsx`
Badge de comparativa temporal:

```typescript
// src/components/planeacion/TrendBadge.tsx
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface TrendBadgeProps {
  current: number;
  previous: number;
  invertColors?: boolean; // true para métricas donde menos es mejor
}

export function TrendBadge({ current, previous, invertColors = false }: TrendBadgeProps) {
  const diff = current - previous;
  
  if (diff === 0) {
    return (
      <span className="inline-flex items-center text-xs text-muted-foreground">
        <Minus className="h-3 w-3 mr-0.5" />
        vs ayer
      </span>
    );
  }
  
  const isPositive = diff > 0;
  // Invertir colores para métricas donde menos es mejor (ej: sin asignar)
  const isGood = invertColors ? !isPositive : isPositive;
  
  return (
    <span className={`inline-flex items-center text-xs font-medium ${
      isGood ? 'text-green-600' : 'text-red-600'
    }`}>
      {isPositive ? (
        <ArrowUp className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDown className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(diff)} vs ayer
    </span>
  );
}
```

### 4. Modificar `OperationalDashboard.tsx`

#### A) Imports y Hooks
```typescript
import { useServiciosAyer } from '@/hooks/useServiciosAyer';
import { CoverageRing } from '@/components/planeacion/CoverageRing';
import { TrendBadge } from '@/components/planeacion/TrendBadge';

// En el componente
const { data: datosAyer } = useServiciosAyer();
```

#### B) Calcular métricas derivadas
```typescript
// Ratio de cobertura
const ratioCobertura = serviciosHoy.length > 0 
  ? Math.round((custodiosDisponibles.length / serviciosHoy.length) * 100)
  : 100;

// Porcentaje de asignación
const serviciosAsignados = serviciosHoy.filter(s => s.custodio_asignado).length;
const porcentajeAsignacion = serviciosHoy.length > 0
  ? Math.round((serviciosAsignados / serviciosHoy.length) * 100)
  : 0;

// Ordenar por urgencia (tiempo restante)
const accionesPrioritarias = [...serviciosSinCustodio].sort((a, b) => {
  if (!a.fecha_hora_cita) return 1;
  if (!b.fecha_hora_cita) return -1;
  return new Date(a.fecha_hora_cita).getTime() - new Date(b.fecha_hora_cita).getTime();
});
```

#### C) Nuevo Layout de Métricas
Eliminar alerta redundante y reorganizar cards:

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│  HERO METRICS (Nueva estructura)                                                   │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌──────────────────────────┐  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  🔴 SIN ASIGNAR          │  │Servicios│ │Cobertura│ │Por     │ │Pend.   │       │
│  │      3                   │  │  Hoy    │ │  67%    │ │Vencer  │ │Folio   │       │
│  │  ↑2 vs ayer              │  │   12    │ │ [Ring]  │ │   2    │ │   5    │       │
│  │  [Asignar Todos]         │  │ +2 ayer │ │ 8/12    │ │        │ │        │       │
│  └──────────────────────────┘  └────────┘ └────────┘ └────────┘ └────────┘       │
│         DESTACADO                        MÉTRICAS SECUNDARIAS                     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

#### D) Card "Sin Asignar" Destacada
```jsx
{/* Card Principal - Sin Asignar (con jerarquía visual) */}
{serviciosSinCustodio.length > 0 && (
  <div className="apple-metric-featured animate-pulse-subtle">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <span className="text-sm font-medium text-red-600">Requiere Acción</span>
        </div>
        <div className="text-5xl font-bold text-red-600 mb-2">
          {serviciosSinCustodio.length}
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          Servicios Sin Asignar
        </div>
        {datosAyer && (
          <TrendBadge 
            current={serviciosSinCustodio.length} 
            previous={datosAyer.sinAsignar}
            invertColors={true}
          />
        )}
      </div>
      <CoverageRing percentage={porcentajeAsignacion} />
    </div>
    <Button className="w-full mt-4" variant="destructive">
      Asignar Todos
    </Button>
  </div>
)}
```

#### E) Métricas Secundarias con Trends
```jsx
<div className="apple-metric apple-metric-primary">
  <div className="apple-metric-icon">
    <Clock className="h-6 w-6" />
  </div>
  <div className="apple-metric-content">
    <div className="apple-metric-value">{serviciosHoy.length}</div>
    <div className="apple-metric-label">Servicios Hoy</div>
    {datosAyer && (
      <TrendBadge current={serviciosHoy.length} previous={datosAyer.total} />
    )}
  </div>
</div>

<div className="apple-metric apple-metric-success">
  <div className="apple-metric-icon">
    <Users className="h-6 w-6" />
  </div>
  <div className="apple-metric-content">
    <div className="apple-metric-value">{ratioCobertura}%</div>
    <div className="apple-metric-label">Ratio Cobertura</div>
    <span className="text-xs text-muted-foreground">
      {custodiosDisponibles.length} / {serviciosHoy.length}
    </span>
  </div>
</div>
```

### 5. Nuevos Estilos CSS
```css
/* Card destacada con animación sutil */
.apple-metric-featured {
  @apply bg-red-50 border-2 border-red-200 rounded-xl p-6 col-span-1 md:col-span-2 
         dark:bg-red-950/30 dark:border-red-800/50;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* Grid mejorado para hero metrics */
.apple-metrics-hero {
  @apply grid grid-cols-1 md:grid-cols-6 gap-4;
}

.apple-metrics-hero > :first-child {
  @apply md:col-span-2 md:row-span-2;
}
```

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useServiciosAyer.ts` | **Crear** - Datos comparativos |
| `src/components/planeacion/CoverageRing.tsx` | **Crear** - Anillo de progreso |
| `src/components/planeacion/TrendBadge.tsx` | **Crear** - Badge de tendencia |
| `src/pages/Planeacion/components/OperationalDashboard.tsx` | **Modificar** - Integrar mejoras |
| `src/index.css` | **Modificar** - Nuevos estilos |

---

## Beneficios Esperados

| Mejora | Impacto |
|--------|---------|
| Card "Sin Asignar" destacada | Atención inmediata a lo crítico |
| Anillo de Progreso | Gamificación de asignaciones |
| Comparativa vs Ayer | Contexto para decisiones |
| Ratio de Cobertura | Visibilidad de capacidad |
| Ordenamiento por urgencia | Priorización clara |

---

## Vista Previa del Resultado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard Operacional                          Lunes, 03 Feb 2025 • 10:45  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────┐  ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│  │ ⚠️ REQUIERE ACCIÓN         │  │ Servicios │ │  Ratio    │ │ Por Vencer│ │
│  │                            │  │   Hoy     │ │ Cobertura │ │   (4h)    │ │
│  │     3           [75%]     │  │    12     │ │   67%     │ │     2     │ │
│  │  Sin Asignar    ◐         │  │  ↑2 ayer  │ │   8/12    │ │           │ │
│  │  ↑2 vs ayer               │  └───────────┘ └───────────┘ └───────────┘ │
│  │                            │  ┌───────────┐                             │
│  │  [  Asignar Todos  ]      │  │ Pend.     │                             │
│  └────────────────────────────┘  │ Folio: 5  │                             │
│                                  └───────────┘                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Acciones Prioritarias (ordenadas por urgencia)                            │
│  ┌─────────────────────────────────────────────────────────────────────────┤
│  │ 🔴 Cliente ABC • CDMX→GDL • 11:00 (25 min)        [Asignar]            │
│  │ 🟡 Cliente XYZ • MTY→QRO • 13:30 (2h 45min)       [Asignar]            │
│  │ 🟢 Cliente 123 • PUE→LEO • 16:00 (5h 15min)       [Asignar]            │
│  └─────────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────────┘
```
