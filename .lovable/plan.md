
# Plan: Filtrar "Pendientes de Folio" por Fecha del Día

## Objetivo
Aplicar el mismo filtro temporal de `useServiciosHoy` al hook `usePendingFolioCount` para mantener consistencia visual y cognitiva en el Dashboard Operacional.

## Cambio Requerido

### Archivo: `src/hooks/usePendingFolioCount.ts`

Agregar filtro de fecha usando el patrón existente:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';  // AGREGAR

export interface PendingFolioStats {
  pendientes: number;
  total: number;
  porcentajePendiente: number;
}

export const usePendingFolioCount = () => {
  return useQuery({
    queryKey: ['pending-folio-count'],
    queryFn: async (): Promise<PendingFolioStats> => {
      // Usar format() para evitar bug de timezone
      const hoy = format(new Date(), 'yyyy-MM-dd');  // AGREGAR
      
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id_servicio')
        .gte('fecha_hora_cita', `${hoy}T00:00:00`)  // AGREGAR
        .lt('fecha_hora_cita', `${hoy}T23:59:59`)   // AGREGAR
        .not('estado_planeacion', 'in', '(cancelado,completado)');
      
      // ... resto igual
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Pendientes de Folio: **1,126** (histórico) | Pendientes de Folio: **X** (solo hoy) |

Todas las métricas del Hero Metrics ahora responderán al mismo contexto temporal: **el día actual**.
