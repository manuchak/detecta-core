
# Plan: Contador de Servicios Pendientes de Folio en Acciones Prioritarias

## Contexto del Problema

El equipo de planeación necesita visibilidad de cuántos servicios tienen **folio temporal** (generado por el sistema) vs **folio de Saphiro** (sistema de facturación externo). Esto les permite identificar rápidamente qué servicios necesitan sincronizarse con Saphiro.

### Lógica de Identificación

| Tipo de Folio | Característica | Ejemplo |
|---------------|----------------|---------|
| **Temporal (Sistema)** | UUID de 36 caracteres | `d95a5571-3be0-42d8-9e93-6a14e74e8d73` |
| **Saphiro (Facturación)** | Formato corto, alfanumérico | `257819890`, `LOERLLO-212` |

### Datos Actuales (Consulta Real)
- Servicios con folio temporal: **1,126**
- Servicios con folio Saphiro: **789**

---

## Diseño Visual Propuesto

Agregar una nueva tarjeta de métrica en la sección "Hero Metrics" del Dashboard Operacional:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD OPERACIONAL                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Servicios│ │Custodios │ │Sin       │ │Por Vencer│ │Pendientes│ ← NUEVA │
│  │   Hoy    │ │Disponibles││ Asignar  │ │  (4h)    │ │de Folio  │         │
│  │    12    │ │    8     │ │    3     │ │    2     │ │   1126   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Color de la tarjeta**: Azul (`apple-metric-info`) para indicar tarea administrativa pendiente, no crítica.

---

## Cambios Técnicos

### 1. Crear Hook `usePendingFolioCount.ts`

```typescript
// src/hooks/usePendingFolioCount.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingFolioStats {
  pendientes: number;
  total: number;
  porcentajePendiente: number;
}

export const usePendingFolioCount = () => {
  return useQuery({
    queryKey: ['pending-folio-count'],
    queryFn: async (): Promise<PendingFolioStats> => {
      // Contar servicios con folio temporal (UUID = 36 caracteres)
      // vs folio de Saphiro (cualquier otro formato)
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id_servicio')
        .not('estado_planeacion', 'in', '(cancelado,completado)');
      
      if (error) throw error;
      
      const servicios = data || [];
      const pendientes = servicios.filter(s => 
        s.id_servicio && s.id_servicio.length === 36
      ).length;
      
      return {
        pendientes,
        total: servicios.length,
        porcentajePendiente: servicios.length > 0 
          ? Math.round((pendientes / servicios.length) * 100) 
          : 0
      };
    },
    staleTime: 60000, // 1 minuto de cache
    refetchInterval: 60000, // Actualizar cada minuto
  });
};
```

### 2. Modificar `OperationalDashboard.tsx`

Agregar el import del nuevo hook y la tarjeta en el grid de métricas:

```typescript
// Import
import { usePendingFolioCount } from '@/hooks/usePendingFolioCount';
import { FileText } from 'lucide-react';

// En el componente
const { data: folioStats, isLoading: loadingFolio } = usePendingFolioCount();

// Nueva tarjeta después de "Por Vencer"
<div className="apple-metric apple-metric-info">
  <div className="apple-metric-icon">
    <FileText className="h-6 w-6" />
  </div>
  <div className="apple-metric-content">
    <div className="apple-metric-value">
      {loadingFolio ? '...' : folioStats?.pendientes || 0}
    </div>
    <div className="apple-metric-label">Pendientes de Folio</div>
  </div>
</div>
```

### 3. (Opcional) Agregar Tooltip con Detalle

```typescript
<Tooltip>
  <TooltipTrigger>
    {/* ... tarjeta ... */}
  </TooltipTrigger>
  <TooltipContent>
    <p>Servicios con folio temporal del sistema</p>
    <p className="text-xs text-muted-foreground">
      {folioStats?.porcentajePendiente}% del total requiere folio de Saphiro
    </p>
  </TooltipContent>
</Tooltip>
```

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/usePendingFolioCount.ts` | **Crear** - Hook para obtener estadísticas |
| `src/pages/Planeacion/components/OperationalDashboard.tsx` | **Modificar** - Agregar nueva métrica |

---

## Consideraciones Adicionales

### Filtros Opcionales (Futuro)
- Filtrar solo servicios de los últimos 30 días
- Filtrar por estado específico (solo `asignado` o `confirmado`)
- Agregar click en la tarjeta para navegar a lista filtrada

### Performance
- Query ligera: solo selecciona `id_servicio`
- Cache de 1 minuto para evitar consultas excesivas
- No bloquea el render inicial del dashboard

---

## Beneficios

- **Visibilidad inmediata**: El equipo ve de un vistazo cuántos servicios necesitan sincronización
- **No invasivo**: Nueva métrica se integra con el diseño existente
- **Actionable**: Permite priorizar la captura de folios de Saphiro
