

# Plan: Integrar Acceso al Checklist desde Dashboard Custodio

## Resumen

Agregar una tarjeta de "Proximo Servicio" prominente en el dashboard movil del custodio con un boton "Iniciar Checklist" que active el flujo de 4 pasos.

---

## Flujo de Usuario Propuesto

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD CUSTODIO (Mobile)                                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐      │
│  │  📋 PROXIMO SERVICIO                                    6:00 AM    │      │
│  │                                                                    │      │
│  │  Cliente: Transportes del Norte                                    │      │
│  │  📅 Martes 5 de febrero                                           │      │
│  │                                                                    │      │
│  │  ┌──────────────────────────────────────────────────────────────┐ │      │
│  │  │ ● Toluca, Estado de México                                   │ │      │
│  │  │ │                                                            │ │      │
│  │  │ ○ Querétaro, Querétaro                                       │ │      │
│  │  └──────────────────────────────────────────────────────────────┘ │      │
│  │                                                                    │      │
│  │  ┌────────────────────────────────────────────────────────────┐   │      │
│  │  │  📝 INICIAR CHECKLIST PRE-SERVICIO                         │   │      │
│  │  │      Requerido antes de salir                              │   │      │
│  │  └────────────────────────────────────────────────────────────┘   │      │
│  │                                                                    │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│  [Stats Bar]  [Quick Actions]  [Recent Services]                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Cambios Requeridos

### 1. Modificar NextServiceCard.tsx

Agregar prop para iniciar checklist y boton prominente:

```typescript
interface NextServiceCardProps {
  service: CustodianService | null;
  onViewDetails?: () => void;
  onStartChecklist?: (serviceId: string) => void;  // NUEVO
  checklistCompleted?: boolean;                     // NUEVO
}
```

Cambios visuales:
- Agregar boton grande "Iniciar Checklist Pre-Servicio"
- Mostrar badge verde "Checklist Completado" si ya se hizo
- El boton navega a `/custodian/checklist/{serviceId}`

### 2. Crear Hook useNextService

Nuevo hook para obtener el proximo servicio con estado del checklist:

```typescript
// src/hooks/useNextService.ts

interface NextServiceWithChecklist {
  service: CustodianService | null;
  hasChecklist: boolean;
  checklistStatus: 'pendiente' | 'completo' | null;
  isLoading: boolean;
}

export function useNextService(custodianPhone: string | undefined) {
  // 1. Obtener proximo servicio de servicios_custodia
  // 2. Verificar si existe checklist_servicio para ese servicio
  // 3. Retornar datos combinados
}
```

### 3. Modificar MobileDashboardLayout.tsx

Integrar la tarjeta de proximo servicio en la seccion principal:

```typescript
// Importar hook y componente
import { useNextService } from "@/hooks/useNextService";
import NextServiceCard from "./NextServiceCard";

// Dentro del componente:
const { service: nextService, hasChecklist, checklistStatus } = useNextService(profile?.phone);

const handleStartChecklist = (serviceId: string) => {
  navigate(`/custodian/checklist/${serviceId}`);
};

// En el JSX, agregar entre las alertas y los stats:
{nextService && (
  <section className="animate-fade-in">
    <NextServiceCard 
      service={nextService}
      onStartChecklist={handleStartChecklist}
      checklistCompleted={checklistStatus === 'completo'}
    />
  </section>
)}
```

---

## Logica de Negocio

### Cuando Mostrar la Tarjeta

| Condicion | Accion |
|-----------|--------|
| Servicio programado para hoy o manana | Mostrar tarjeta prominente |
| Sin servicios proximos | Mostrar mensaje "Sin servicios pendientes" |
| Checklist ya completado | Mostrar badge verde, boton dice "Ver Checklist" |
| Checklist pendiente | Boton prominente "Iniciar Checklist" |

### Validaciones Pre-Checklist

El sistema ya valida en `ServiceChecklistPage.tsx`:
1. Usuario autenticado
2. Telefono del custodio disponible
3. ID del servicio valido

### Coordenadas para Validacion GPS

Como `servicios_custodia` no tiene coordenadas:
- El checklist obtendra la ubicacion actual del dispositivo al capturar fotos
- La validacion de distancia comparara contra la primera foto (referencia)
- El equipo de monitoreo vera las coordenadas en la auditoria

---

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/hooks/useNextService.ts` | Hook para obtener proximo servicio con estado de checklist |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/custodian/NextServiceCard.tsx` | Agregar boton de checklist y estado |
| `src/components/custodian/MobileDashboardLayout.tsx` | Integrar NextServiceCard en el layout |

---

## Detalles de Implementacion

### useNextService.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNextService(custodianPhone: string | undefined) {
  return useQuery({
    queryKey: ['next-service', custodianPhone],
    queryFn: async () => {
      if (!custodianPhone) return { service: null, checklistStatus: null };
      
      // 1. Obtener proximo servicio (hoy o futuro, estado pendiente/programado)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const { data: services } = await supabase
        .from('servicios_custodia')
        .select('*')
        .or(`telefono.eq.${custodianPhone},telefono_operador.eq.${custodianPhone}`)
        .gte('fecha_hora_cita', now.toISOString())
        .in('estado', ['pendiente', 'programado', 'Pendiente', 'Programado'])
        .order('fecha_hora_cita', { ascending: true })
        .limit(1);
      
      const nextService = services?.[0] || null;
      
      if (!nextService) {
        return { service: null, checklistStatus: null };
      }
      
      // 2. Verificar si existe checklist para este servicio
      const { data: checklist } = await supabase
        .from('checklist_servicio')
        .select('estado')
        .eq('servicio_id', nextService.id_servicio)
        .eq('custodio_telefono', custodianPhone)
        .maybeSingle();
      
      return {
        service: nextService,
        checklistStatus: checklist?.estado || null
      };
    },
    enabled: !!custodianPhone,
    staleTime: 60000, // 1 minuto
  });
}
```

### NextServiceCard.tsx (Modificaciones)

Agregar seccion de checklist al final de la tarjeta:

```typescript
{/* Seccion Checklist */}
{onStartChecklist && (
  <div className="mt-4 pt-4 border-t border-primary/20">
    {checklistCompleted ? (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Checklist completado</span>
        </div>
        <button 
          onClick={() => onStartChecklist(service.id_servicio)}
          className="text-primary text-sm font-medium"
        >
          Ver detalles
        </button>
      </div>
    ) : (
      <button 
        onClick={() => onStartChecklist(service.id_servicio)}
        className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <ClipboardCheck className="w-5 h-5" />
        Iniciar Checklist Pre-Servicio
      </button>
    )}
  </div>
)}
```

---

## Orden de Implementacion

1. **Crear hook** `useNextService.ts`
2. **Modificar** `NextServiceCard.tsx` - agregar props y UI de checklist
3. **Modificar** `MobileDashboardLayout.tsx` - integrar la tarjeta
4. **Probar** flujo completo en movil

---

## Resultado Esperado

El custodio vera:
1. Su proximo servicio de forma prominente en el dashboard
2. Boton claro para iniciar el checklist pre-servicio
3. Indicador visual cuando el checklist ya este completado
4. Transicion fluida al wizard de 4 pasos al presionar el boton

