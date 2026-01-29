
# Plan: Rediseño de Textos + Alertas en Tiempo Real para Control de Posicionamiento

## ✅ IMPLEMENTADO
1. **Cambiar la terminología** del dashboard para reflejar que es un "Control de Posicionamiento de Custodios" previo al inicio del servicio
2. **Implementar alertas visuales (toasts)** cuando hay cambios de estado o cuando un custodio confirma que está "En Sitio"

---

## Parte 1: Cambio de Terminología

### Textos Actuales vs. Propuestos

| Ubicacion | Actual | Propuesto |
|-----------|--------|-----------|
| Titulo principal | "Monitoreo de Servicios" | "Control de Posicionamiento" |
| Subtitulo | "Visualiza servicios en tiempo real del turno actual" | "Seguimiento de custodios en ruta hacia sus puntos de origen" |
| Seccion cards | "Turno Actual (±8 hrs)" | "Posicionamiento del Turno (±8 hrs)" |
| Estado "En Sitio" | "En Sitio" | "Posicionado" |
| Estado "Proximo" | "Proximo" | "En Camino" |
| Estado "Asignado" | "Asignado" | "Por Salir" |
| Estado "Sin Asignar" | "Sin Asignar" | "Pendiente Custodio" |
| Tabla lateral | "Servicios del Turno" | "Custodios en Ruta" |
| Total footer | "Total de servicios en turno" | "Total de posicionamientos programados" |

### Archivos a Modificar

1. **`src/pages/Monitoring/MonitoringPage.tsx`**: Titulo y subtitulo del header
2. **`src/hooks/useServiciosTurno.ts`**: Labels en `COLORES_ESTADO`
3. **`src/components/monitoring/ShiftSummaryCards.tsx`**: Titulo de seccion y footer
4. **`src/components/monitoring/ShiftServicesTable.tsx`**: Titulo del card

---

## Parte 2: Alertas en Tiempo Real

### Tipo de Alertas a Implementar

| Evento | Toast Tipo | Mensaje | Icono |
|--------|------------|---------|-------|
| Custodio se posiciona (hora_inicio_real cambia de NULL a valor) | success (verde) | "Custodio [nombre] posicionado en [origen]" | MapPinCheck |
| Servicio pasa a "En Camino" (<60 min) | info (azul) | "Servicio [cliente] entrando en ventana proxima" | Clock |
| Servicio sin custodio y <30 min para cita | warning (naranja) | "ALERTA: [cliente] sin custodio a [X] minutos" | AlertTriangle |

### Arquitectura Tecnica

```text
useServiciosTurnoRealtime (nuevo hook)
├── Suscripcion a postgres_changes en servicios_planificados
│   ├── event: UPDATE
│   └── filter: servicios en ventana ±8 horas
├── Detectar cambios de estado:
│   ├── hora_inicio_real: NULL → valor = "Custodio posicionado"
│   ├── custodio_asignado: NULL → valor = "Custodio asignado"
│   └── Tiempo restante cruzando umbral = "En ventana proxima"
├── Disparar toast con sonner
└── Invalidar query 'servicios-turno' para actualizar UI
```

### Componentes Nuevos/Modificados

1. **`src/hooks/useServiciosTurnoRealtime.ts`** (NUEVO): Hook que escucha cambios en tiempo real y dispara toasts
2. **`src/pages/Monitoring/MonitoringPage.tsx`**: Integrar el nuevo hook de realtime

---

## Detalle de Implementacion

### Hook useServiciosTurnoRealtime

```typescript
// Pseudocodigo del hook
function useServiciosTurnoRealtime() {
  const queryClient = useQueryClient();
  
  // Referencia a servicios previos para detectar cambios
  const previousServiciosRef = useRef<Map<string, ServicioTurno>>();
  
  useEffect(() => {
    // Suscribirse a cambios en servicios_planificados
    const channel = supabase
      .channel('monitoring-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'servicios_planificados'
      }, (payload) => {
        const oldRecord = payload.old;
        const newRecord = payload.new;
        
        // Detectar posicionamiento (hora_inicio_real cambio)
        if (!oldRecord.hora_inicio_real && newRecord.hora_inicio_real) {
          toast.success('Custodio Posicionado', {
            description: `${newRecord.custodio_asignado} llego a ${newRecord.origen}`,
            icon: <MapPinCheck className="text-emerald-500" />
          });
        }
        
        // Detectar asignacion de custodio
        if (!oldRecord.custodio_asignado && newRecord.custodio_asignado) {
          toast.info('Custodio Asignado', {
            description: `${newRecord.custodio_asignado} asignado a ${newRecord.nombre_cliente}`
          });
        }
        
        // Invalidar query para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['servicios-turno'] });
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, []);
}
```

### Logica de Alerta por Tiempo

Ademas de los eventos de base de datos, se verificara en cada refetch (30s):
- Si un servicio cruza el umbral de 60 minutos → Toast "En Camino"
- Si un servicio sin custodio tiene <30 min → Toast de advertencia

---

## Flujo Visual de Alertas

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✓ Custodio Posicionado                              ✕  │   │
│  │  Israel Lona llego a Ecatepec, Edomex                   │   │
│  │  hace 5 segundos                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🕐 Servicio en Ventana Proxima                      ✕  │   │
│  │  BIRKENSTOCK entrando en ventana de 60 min              │   │
│  │  [Ver en mapa]                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Accion | Cambios |
|---------|--------|---------|
| `src/hooks/useServiciosTurno.ts` | Modificar | Actualizar labels en COLORES_ESTADO |
| `src/hooks/useServiciosTurnoRealtime.ts` | Crear | Hook para escuchar cambios y disparar toasts |
| `src/pages/Monitoring/MonitoringPage.tsx` | Modificar | Cambiar textos del header, integrar hook realtime |
| `src/components/monitoring/ShiftSummaryCards.tsx` | Modificar | Actualizar titulo de seccion y texto del footer |
| `src/components/monitoring/ShiftServicesTable.tsx` | Modificar | Cambiar titulo del panel lateral |

---

## Beneficios

| Beneficio | Impacto |
|-----------|---------|
| **Claridad operativa** | Terminologia alineada con la actividad real de posicionamiento |
| **Alertas proactivas** | Monitorista no necesita estar mirando constantemente el mapa |
| **Confirmacion visual** | Feedback inmediato cuando un custodio llega a su punto |
| **Escalamiento** | Facil agregar mas tipos de alertas en el futuro |
