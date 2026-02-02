

# Plan de Polish UX/UI - Consistencia Visual

## Objetivo
Alinear las nuevas features (Epics 1-6) con el Design System Apple-inspired existente y maximizar la reutilización de componentes.

---

## 1. Refactorizar CustodiosZonasTab hacia Apple Design

### 1.1 Reemplazar KPIs genéricos por apple-metrics
**Archivo**: `src/pages/Planeacion/components/configuration/CustodiosZonasTab.tsx`

**Antes (inconsistente)**:
```jsx
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-orange-600">{count}</div>
  </CardContent>
</Card>
```

**Después (consistente)**:
```jsx
<div className="apple-metric apple-metric-warning">
  <div className="apple-metric-icon">
    <AlertTriangle className="h-6 w-6" />
  </div>
  <div className="apple-metric-content">
    <div className="apple-metric-value">{count}</div>
    <div className="apple-metric-label">Sin Zona</div>
  </div>
</div>
```

### 1.2 Agregar CoverageRing para % Completitud
Reutilizar el componente ya existente:
```jsx
import { CoverageRing } from '@/components/planeacion/CoverageRing';

// En la sección de KPIs
<CoverageRing 
  percentage={completitudPorcentaje} 
  size={64}
  label="Completitud"
/>
```

### 1.3 Convertir tabla a apple-list pattern
Reemplazar `<table>` tradicional por un diseño de cards iterables:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ANTES: Tabla HTML tradicional                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  | Nombre | Teléfono | Zona | Editar |                                     │
│  |--------|----------|------|--------|                                     │
│  | Juan   | 55-1234  | CDMX | [v]    |                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DESPUÉS: Apple List Pattern                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🟢 Juan Pérez                    CDMX           [Select: Nueva Zona] │ │
│  │    📞 55-1234-5678               🏠 L×3                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 María García                  [Sin asignar]  [Select: Nueva Zona] │ │
│  │    📞 55-5678-9012               -                                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estandarizar Colores Semánticos

### 2.1 Reemplazar hard-coded colors
**Archivos afectados**: 
- `CustodiosZonasTab.tsx`
- `CustodianCard.tsx` (parcialmente)

**Mapeo de tokens**:
| Actual | Reemplazar por |
|--------|----------------|
| `bg-orange-50` | `bg-warning/10` |
| `text-orange-600` | `text-warning` |
| `bg-green-50 text-green-700` | `bg-success/10 text-success` |
| `border-orange-500` | `border-warning` |

### 2.2 Agregar clases dark mode faltantes
Todas las clases con colores explícitos deben tener su contraparte dark:
```css
/* Ejemplo */
.equity-badge-priorizar {
  @apply bg-green-50 text-green-700 border-green-300;
  @apply dark:bg-green-900/30 dark:text-green-400 dark:border-green-700;
}
```

---

## 3. Micro-interacciones Faltantes

### 3.1 Transición al rechazar custodio
**Archivo**: `CustodianCard.tsx`

Agregar animación de fade-out cuando se registra un rechazo:
```typescript
// Al hacer click en "Registrar rechazo"
const handleRejectWithAnimation = async () => {
  // Agregar clase de animación
  cardRef.current?.classList.add('animate-fade-out-left');
  
  // Esperar animación antes de persistir
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Persistir y refetch
  await onReportRejection?.();
};
```

CSS necesario:
```css
@keyframes fade-out-left {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-20px); }
}
.animate-fade-out-left {
  animation: fade-out-left 0.3s ease-out forwards;
}
```

### 3.2 Skeleton loaders en listas
Agregar estados de carga más pulidos usando el patrón existente:
```jsx
{isPending ? (
  <div className="space-y-2">
    {[1,2,3].map(i => (
      <div key={i} className="apple-card p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    ))}
  </div>
) : (
  <CustodianList ... />
)}
```

---

## 4. Unificación de Iconografía

### 4.1 Reemplazar emojis por iconos Lucide
Para consistencia profesional:

| Emoji Actual | Reemplazar por | Contexto |
|--------------|----------------|----------|
| 🟢 | `<Circle className="fill-success text-success" />` | Disponible |
| 🟡 | `<Circle className="fill-warning text-warning" />` | Parcial |
| 🔴 | `<Circle className="fill-destructive text-destructive" />` | No disponible |
| 🎯 | `<Target className="text-success" />` | Priorizar |
| ⚠️ | `<AlertTriangle className="text-warning" />` | Alta carga |
| 🏠 | `<Home className="text-muted-foreground" />` | Local |
| ✈️ | `<Plane className="text-primary" />` | Foráneo |

---

## 5. Componente Reutilizable: ZoneStatusIndicator

Crear componente para estandarizar la visualización de estados:

```typescript
// src/components/planeacion/ZoneStatusIndicator.tsx
interface ZoneStatusIndicatorProps {
  status: 'assigned' | 'missing' | 'warning';
  label: string;
  count?: number;
}

export function ZoneStatusIndicator({ status, label, count }: ZoneStatusIndicatorProps) {
  const config = {
    assigned: { icon: Check, color: 'text-success', bg: 'bg-success/10' },
    missing: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
  };
  
  const { icon: Icon, color, bg } = config[status];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${bg}`}>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      {count !== undefined && (
        <span className={`text-xs font-bold ${color}`}>({count})</span>
      )}
    </div>
  );
}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Planeacion/components/configuration/CustodiosZonasTab.tsx` | Refactor a apple-metrics, apple-list, tokens semánticos |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx` | Reemplazar emojis, agregar animación fade-out |
| `src/index.css` | Agregar `.animate-fade-out-left`, clases de badges |
| `src/components/planeacion/ZoneStatusIndicator.tsx` | **Crear** - Componente reutilizable |

---

## Resultado Esperado

```text
ANTES                                    DESPUÉS
─────────────────────────────────        ─────────────────────────────────
┌─────────────────────────────┐          ┌─────────────────────────────┐
│  [Card] Sin Zona: 12        │          │  ⚠️ 12                      │
│                             │          │  Sin Zona         [●────]  │
│  [Card] Total: 45           │          │  Requiere atención 73%     │
│                             │          └─────────────────────────────┘
│  [Card] Completitud: 73%    │          
│                             │          ┌─────────────────────────────┐
│  ─────────────────────────  │          │ ● Juan Pérez    CDMX        │
│  | Nombre | Zona | Editar | │    →     │   📞 55-1234   🏠 L×3       │
│  |--------|------|--------| │          ├─────────────────────────────┤
│  | Juan   | CDMX | [v]    | │          │ ⚠ María García [Sin zona]  │
│  | María  | -    | [v]    | │          │   📞 55-5678   [Select ▾]  │
└─────────────────────────────┘          └─────────────────────────────┘

  TRADICIONAL / INCONSISTENTE              APPLE-INSPIRED / COHESIVO
```

---

## Prioridad de Implementación

| Tarea | Esfuerzo | Impacto Visual | Prioridad |
|-------|----------|----------------|-----------|
| Tokens semánticos (colores) | Bajo | Alto | P1 |
| apple-metrics en Zonas tab | Medio | Alto | P1 |
| Animación fade-out rechazo | Bajo | Medio | P2 |
| Reemplazo emojis → iconos | Bajo | Medio | P2 |
| ZoneStatusIndicator componente | Medio | Medio | P3 |
| Tabla → apple-list | Alto | Alto | P3 |

