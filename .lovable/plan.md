
# Plan: Modal de Detalles Completos del Servicio para Monitoristas

## Problema Actual
Cuando un monitorista hace clic en un servicio, actualmente solo se resalta visualmente en la tabla/mapa pero **no se muestra información detallada**. El componente `ServiceDetailsPanel` existente tiene un modelo de datos legacy incompatible.

## Solución Propuesta: Dialog Modal con Información Completa

### Diseño UX

```text
┌────────────────────────────────────────────────────────────────────┐
│  ← Servicio GRSAGDE-71                            [Posicionado] ✕  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────┐ ┌─────────────────────────────────┐  │
│  │ 👤 CLIENTE              │ │ 🛡️ PERSONAL ASIGNADO            │  │
│  │ PEÑARANDA               │ │ Custodio: Juan Pérez López      │  │
│  │ Ref: ABC123             │ │ Armado: Carlos García           │  │
│  │ Tel: 55 1234 5678       │ │                                 │  │
│  └─────────────────────────┘ └─────────────────────────────────┘  │
│                                                                    │
│  📍 RUTA                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ● Origen:  CASETA APASEO EL GRANDE                         │  │
│  │  ○ Destino: PÉNJAMO, GUANAJUATO                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ⏰ FECHA Y HORA                                                   │
│  Cita: 31/01/2026 01:00 a.m.   │   Tipo: Custodia                 │
│  Inicio real: --               │   Requiere armado: ✓             │
│                                                                    │
│  📝 OBSERVACIONES                                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Llevar chaleco, entregar documentación al guardia...        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Principios de Diseño
1. **Jerarquía visual clara**: Información agrupada por contexto (Cliente, Personal, Ruta, Tiempo)
2. **Read-only para monitoristas**: Solo visualización, sin capacidad de edición
3. **Acceso rápido**: Click en tabla o mapa abre el modal instantáneamente
4. **Datos completos**: Fetch del servicio con todos los campos disponibles

---

## Implementación Técnica

### 1. Nuevo Componente: `ServiceDetailModal.tsx`

**Ubicación:** `src/components/monitoring/ServiceDetailModal.tsx`

**Props:**
```typescript
interface ServiceDetailModalProps {
  serviceId: string | null;      // ID del servicio seleccionado
  open: boolean;                 // Estado del modal
  onOpenChange: (open: boolean) => void;
}
```

**Estructura:**
- Utiliza `Dialog` de Radix UI (ya instalado)
- Secciones colapsables opcionales para observaciones extensas
- Badge de estado visual (colores del semáforo existente)
- Layout responsive con grid de 2 columnas en desktop

### 2. Nuevo Hook: `useServicioDetalle.ts`

**Ubicación:** `src/hooks/useServicioDetalle.ts`

Fetch del servicio completo cuando se selecciona:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['servicio-detalle', serviceId],
  queryFn: async () => {
    const { data } = await supabase
      .from('servicios_planificados')
      .select(`
        *,
        custodios:custodio_asignado_id (nombre, telefono),
        armados:armado_asignado_id (nombre)
      `)
      .eq('id', serviceId)
      .single();
    return data;
  },
  enabled: !!serviceId
});
```

### 3. Integración en `MonitoringPage.tsx`

**Cambios:**
- Importar `ServiceDetailModal`
- Agregar estado `isDetailOpen`
- Modificar `handleServiceClick` para abrir el modal
- Renderizar el modal al final del componente

```typescript
const [isDetailOpen, setIsDetailOpen] = useState(false);

const handleServiceClick = (servicio: ServicioTurno) => {
  setSelectedService(servicio.id);
  setIsDetailOpen(true);  // Abrir modal automáticamente
};
```

---

## Campos a Mostrar

| Sección | Campo | Fuente |
|---------|-------|--------|
| Header | ID Servicio, Estado | `id_servicio`, `estado_planeacion` |
| Cliente | Nombre, Referencia, Teléfono | `nombre_cliente`, `id_interno_cliente`, `telefono_cliente` |
| Personal | Custodio, Armado | `custodio_asignado`, `armado_asignado` |
| Ruta | Origen, Destino | `origen`, `destino` |
| Tiempo | Fecha cita, Inicio real | `fecha_hora_cita`, `hora_inicio_real` |
| Configuración | Tipo servicio, Requiere armado | `tipo_servicio`, `requiere_armado` |
| Notas | Observaciones | `observaciones` |

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/components/monitoring/ServiceDetailModal.tsx` | Crear |
| `src/hooks/useServicioDetalle.ts` | Crear |
| `src/pages/Monitoring/MonitoringPage.tsx` | Modificar |

---

## Beneficios

1. **Para Monitoristas**: Acceso inmediato a toda la información sin salir del dashboard
2. **UX Consistente**: Utiliza patrones de UI existentes (Dialog, Badge, Cards)
3. **Performance**: Fetch bajo demanda solo cuando se abre el modal
4. **Escalable**: Fácil agregar más campos o acciones futuras (ej: botón para llamar)
