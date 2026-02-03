

# Fase 3: Funcionalidad Avanzada - Dashboard Operacional

## Resumen

Esta fase implementa cuatro funcionalidades avanzadas para mejorar la eficiencia del operador:
1. Sparklines historicas de 7 dias en metricas
2. FAB (Floating Action Button) para acciones rapidas
3. Atajos de teclado (1-5) para asignacion rapida
4. Modo compacto para alta densidad de informacion

---

## 1. Sparklines Historicas

### Componente `MiniSparkline.tsx`

**Archivo**: `src/components/planeacion/MiniSparkline.tsx`

Mini grafico SVG que muestra tendencia de 7 dias:

```text
+------------------+
| [Clock]          |
| 26               |
| Servicios Hoy    |
| ↑3 vs ayer       |
| [▁▂▃▅▃▆█]       | <-- Sparkline
+------------------+
```

**Props**:
```typescript
interface MiniSparklineProps {
  data: number[];        // Array de 7 valores (ultimos 7 dias)
  color?: string;        // Color del trazo (default: currentColor)
  height?: number;       // Altura en px (default: 24)
  width?: number;        // Ancho en px (default: 80)
  showDot?: boolean;     // Mostrar punto en valor actual
}
```

**Implementacion SVG**:
- Calcular path con polyline suavizado
- Normalizar valores al rango [0, height]
- Punto final destacado con circulo
- Sin ejes ni labels (ultra minimalista)

### Hook `useMetricsHistory.ts`

**Archivo**: `src/hooks/useMetricsHistory.ts`

Obtiene datos historicos de 7 dias para:
- Total servicios por dia
- Servicios sin asignar por dia
- Custodios activos por dia

**Query**:
```sql
SELECT 
  DATE(fecha_hora_cita) as fecha,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE custodio_asignado IS NULL) as sin_asignar
FROM servicios_custodia
WHERE fecha_hora_cita >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(fecha_hora_cita)
ORDER BY fecha
```

### Aplicacion en Metricas

Agregar sparkline debajo de cada metrica secundaria:
- "Servicios Hoy": Tendencia de volumen
- "Custodios Activos": Variabilidad de asignaciones
- "Por Vencer (4h)": Patron de urgencias

---

## 2. Floating Action Button (FAB)

### Componente `QuickActionsFAB.tsx`

**Archivo**: `src/components/planeacion/QuickActionsFAB.tsx`

Boton flotante que persiste durante scroll cuando hay servicios pendientes.

**Comportamiento**:
- Visible solo si `serviciosSinCustodio.length > 0`
- Posicion fija `bottom-6 right-6`
- Click abre menu radial con 3 acciones:
  1. Asignar mas urgente
  2. Ver todos pendientes
  3. Crear servicio

**Diseño**:
```text
                    [+3] <-- Badge con count
                    +---+
                    | ⚡ | <-- Icono de accion rapida
                    +---+
                      │
          ┌───────────┼───────────┐
          │           │           │
        [👤]        [📋]        [➕]
      Asignar    Ver todos    Crear
```

**Estados**:
- Cerrado: Solo boton principal con badge
- Abierto: Menu radial animado
- Hover: Scale 1.05 con sombra

**CSS Animaciones**:
```css
@keyframes fab-pop-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.fab-menu-item {
  animation: fab-pop-in 0.2s ease-out;
}
```

---

## 3. Atajos de Teclado

### Hook `useKeyboardShortcuts.ts`

**Archivo**: `src/hooks/useKeyboardShortcuts.ts`

Maneja atajos globales para el dashboard:

| Tecla | Accion |
|-------|--------|
| `1-5` | Abrir modal de asignacion para item N de la lista |
| `Esc` | Cerrar modal activo |
| `n` | Nuevo servicio (navegar a /planeacion/nuevo-servicio) |
| `r` | Refrescar datos |

**Implementacion**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignorar si hay input/textarea activo o modal abierto
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        document.body.dataset.dialogOpen === "1") {
      return;
    }

    const key = e.key;
    
    // Numeros 1-5 para asignacion rapida
    if (/^[1-5]$/.test(key)) {
      const index = parseInt(key) - 1;
      if (accionesPrioritarias[index]) {
        onSelectService(index);
      }
    }
    
    // 'n' para nuevo servicio
    if (key === 'n') {
      navigate('/planeacion/nuevo-servicio');
    }
    
    // 'r' para refrescar
    if (key === 'r') {
      refetchServicios();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [accionesPrioritarias]);
```

### Indicadores visuales en UI

Mostrar numero de atajo en cada item de la lista:

```text
[1] Cliente ABC  [2] Cliente XYZ  [3] ...
```

**CSS**:
```css
.shortcut-badge {
  @apply w-5 h-5 rounded text-xs font-mono 
         bg-muted text-muted-foreground 
         flex items-center justify-center;
}
```

---

## 4. Modo Compacto

### Estado Global con LocalStorage

**Ubicacion**: Estado en `OperationalDashboard.tsx` persistido en localStorage

```typescript
const [compactMode, setCompactMode] = useState(() => {
  return localStorage.getItem('dashboard-compact-mode') === 'true';
});

useEffect(() => {
  localStorage.setItem('dashboard-compact-mode', compactMode.toString());
}, [compactMode]);
```

### Toggle en Header

Agregar switch en el header del dashboard:

```text
Dashboard Operacional
Lunes, 03 febrero 2025 • 12:45:32  [●] Datos en vivo  [ ] Compacto
```

### Clases CSS Condicionales

**Cambios en modo compacto**:

| Elemento | Normal | Compacto |
|----------|--------|----------|
| Card padding | p-6 | p-3 |
| Metric value | text-5xl | text-3xl |
| List items | 5 items | 8 items |
| Section gap | gap-4 | gap-2 |
| Font size | text-base | text-sm |

**Implementacion**:
```jsx
<div className={cn(
  "apple-card",
  compactMode && "p-3"
)}>
```

**Nuevas clases CSS**:
```css
.compact-mode .apple-metric-featured {
  @apply p-4;
}

.compact-mode .apple-metric-value {
  @apply text-3xl;
}

.compact-mode .apple-list-item {
  @apply py-2;
}

.compact-mode .apple-section-description {
  @apply hidden;
}
```

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/planeacion/MiniSparkline.tsx` | Crear | Grafico SVG minimalista |
| `src/components/planeacion/QuickActionsFAB.tsx` | Crear | Boton flotante de acciones |
| `src/hooks/useMetricsHistory.ts` | Crear | Hook para datos historicos 7d |
| `src/hooks/useKeyboardShortcuts.ts` | Crear | Hook para atajos de teclado |
| `src/index.css` | Modificar | Clases para FAB y modo compacto |
| `src/pages/Planeacion/components/OperationalDashboard.tsx` | Modificar | Integrar todas las funcionalidades |
| `.lovable/plan.md` | Actualizar | Marcar Fase 3 como completada |

---

## Detalles Tecnicos

### MiniSparkline - Codigo SVG

```typescript
import { cn } from '@/lib/utils';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showDot?: boolean;
  className?: string;
}

export function MiniSparkline({
  data,
  color = 'currentColor',
  height = 24,
  width = 80,
  showDot = true,
  className
}: MiniSparklineProps) {
  if (!data.length) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  // Normalizar valores a coordenadas SVG
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4); // 4px padding
    return `${x},${y}`;
  }).join(' ');
  
  const lastPoint = data[data.length - 1];
  const lastX = width;
  const lastY = height - ((lastPoint - min) / range) * (height - 4);
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={cn('overflow-visible', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      />
      {showDot && (
        <circle
          cx={lastX}
          cy={lastY}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
}
```

### QuickActionsFAB - Estructura

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Users, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsFABProps {
  pendingCount: number;
  onAssignUrgent: () => void;
  onViewAll: () => void;
  onCreateNew: () => void;
}

export function QuickActionsFAB({
  pendingCount,
  onAssignUrgent,
  onViewAll,
  onCreateNew
}: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (pendingCount === 0) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end">
          <Button
            size="sm"
            variant="secondary"
            className="fab-menu-item shadow-lg"
            style={{ animationDelay: '0ms' }}
            onClick={() => { onAssignUrgent(); setIsOpen(false); }}
          >
            <Users className="h-4 w-4 mr-2" />
            Asignar urgente
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="fab-menu-item shadow-lg"
            style={{ animationDelay: '50ms' }}
            onClick={() => { onViewAll(); setIsOpen(false); }}
          >
            <List className="h-4 w-4 mr-2" />
            Ver todos
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="fab-menu-item shadow-lg"
            style={{ animationDelay: '100ms' }}
            onClick={() => { onCreateNew(); setIsOpen(false); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear servicio
          </Button>
        </div>
      )}
      
      {/* Main FAB */}
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg relative",
          "bg-destructive hover:bg-destructive/90",
          "transition-transform hover:scale-105"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Zap className={cn(
          "h-6 w-6 transition-transform",
          isOpen && "rotate-45"
        )} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background text-destructive text-xs font-bold flex items-center justify-center border-2 border-destructive">
            {pendingCount}
          </span>
        )}
      </Button>
    </div>
  );
}
```

### Nuevas Animaciones CSS

```css
/* FAB Animations */
@keyframes fab-pop-in {
  from { 
    transform: scale(0.8) translateY(10px); 
    opacity: 0; 
  }
  to { 
    transform: scale(1) translateY(0); 
    opacity: 1; 
  }
}

.fab-menu-item {
  animation: fab-pop-in 0.2s ease-out backwards;
}

/* Compact Mode Overrides */
.compact-mode .apple-metric-featured {
  @apply p-4;
}

.compact-mode .apple-metric-featured .text-5xl {
  @apply text-3xl;
}

.compact-mode .apple-metric .apple-metric-value {
  @apply text-2xl;
}

.compact-mode .apple-list-item {
  @apply py-2;
}

.compact-mode .apple-section-description {
  @apply hidden;
}

.compact-mode .apple-card {
  @apply p-4;
}

/* Shortcut Badge */
.shortcut-badge {
  @apply w-5 h-5 rounded text-[10px] font-mono 
         bg-muted/50 text-muted-foreground 
         flex items-center justify-center
         flex-shrink-0;
}
```

---

## Orden de Implementacion

1. **MiniSparkline + useMetricsHistory** - Visualizacion historica
2. **Modo Compacto** - Toggle y CSS
3. **QuickActionsFAB** - Boton flotante
4. **useKeyboardShortcuts** - Atajos de teclado

---

## Consideraciones

- **Accesibilidad**: FAB incluye `aria-label`, atajos no interfieren con lectores de pantalla
- **Performance**: Sparklines usan SVG nativo sin dependencias
- **Persistencia**: Modo compacto guardado en localStorage
- **Dark Mode**: Todos los componentes usan tokens semanticos
- **Zoom 70%**: FAB y sparklines escalan correctamente

