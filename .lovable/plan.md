
# Plan: Sistema de Gestion y Alertamiento de Checklists en Monitoreo

## Resumen Ejecutivo

Crear un sistema completo de consulta, alertamiento y gestion de checklists pre-servicio dentro del modulo de Monitoreo. El sistema asegura que todo servicio tenga un checklist realizado antes de iniciar operaciones, con una UI optimizada para revision rapida de evidencia fotografica y respuestas de inspeccion.

---

## Arquitectura del Sistema

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                          SISTEMA DE GESTION DE CHECKLISTS                            │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        DASHBOARD CHECKLIST (Nueva Tab)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │  Completos   │  │  Pendientes  │  │  Sin Check   │  │   Alertas    │        │  │
│  │  │     [12]     │  │     [3]      │  │     [5]      │  │     [2]      │        │  │
│  │  │     OK       │  │   ATENCION   │  │   CRITICO    │  │    GPS/DOC   │        │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          TABLA DE SERVICIOS                                    │  │
│  │  ┌─────────┬─────────┬──────────┬──────────┬─────────┬─────────┬────────────┐  │  │
│  │  │ Cliente │ Custodio│  Hora    │ Checklist│  Fotos  │ Alertas │  Acciones  │  │  │
│  │  ├─────────┼─────────┼──────────┼──────────┼─────────┼─────────┼────────────┤  │  │
│  │  │ Samsung │ J.Ruiz  │ 08:30    │   OK     │   4/4   │    0    │ [Ver]      │  │  │
│  │  │ Ferrer  │ L.Lopez │ 09:00    │ Pendiente│   2/4   │    1    │ [Ver][!]   │  │  │
│  │  │ Loger   │ M.Perez │ 09:30    │   --     │   0/4   │    --   │ [Notif]    │  │  │
│  │  └─────────┴─────────┴──────────┴──────────┴─────────┴─────────┴────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    MODAL DETALLE CHECKLIST                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  GALERIA DE FOTOS (Lightbox con swipe)                                   │  │  │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                             │  │  │
│  │  │  │Frontal │ │Trasero │ │Lat Izq │ │Lat Der │                             │  │  │
│  │  │  │  GPS   │ │  GPS   │ │  GPS   │ │  GPS   │                             │  │  │
│  │  │  │  120m  │ │  45m   │ │  680m  │ │  52m   │                             │  │  │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘                             │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  INSPECCION VEHICULAR          │  EQUIPAMIENTO DE EMERGENCIA            │  │  │
│  │  │  [X] Llantas  [X] Luces        │  [X] Gato       [!] Extintor           │  │  │
│  │  │  [X] Frenos   [X] Espejos      │  [X] Refaccion  [X] Triangulos         │  │  │
│  │  │  Combustible: [====75%====]    │                                        │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Crear

### 1. Hook Principal: `useChecklistMonitoreo.ts`

Logica centralizada para consultar y filtrar checklists del turno.

**Funcionalidades:**
- Obtener servicios del turno con estado de checklist (JOIN servicios_planificados + checklist_servicio)
- Calcular metricas: completos, pendientes, sin checklist, con alertas
- Filtrar por estado de checklist
- Detectar alertas: GPS fuera de rango, items fallidos, fotos faltantes

**Interface de datos:**
```typescript
interface ServicioConChecklist {
  servicioId: string;
  idServicio: string;
  nombreCliente: string;
  custodioAsignado: string;
  custodioTelefono: string;
  fechaHoraCita: string;
  estadoPlaneacion: string;
  // Checklist data
  checklistId: string | null;
  checklistEstado: 'completo' | 'pendiente' | 'incompleto' | null;
  fechaChecklist: string | null;
  fotosCount: number;
  alertasGps: number;
  itemsFallidos: number;
  tieneAlerta: boolean;
}

interface ResumenChecklists {
  completos: number;
  pendientes: number;
  sinChecklist: number;
  conAlertas: number;
  total: number;
}
```

### 2. Componente Dashboard: `ChecklistDashboard.tsx`

Panel principal con tarjetas de resumen y sistema de alertas.

**Elementos UI:**
- 4 tarjetas de resumen con colores semanticos:
  - Verde: Checklists completos (sin alertas)
  - Amarillo: Checklists pendientes/incompletos
  - Rojo: Servicios sin checklist (critico)
  - Naranja: Con alertas GPS o items fallidos
- Sistema de filtrado por click en tarjetas
- Indicador de tiempo hasta cita para servicios sin checklist
- Alerta visual pulsante para servicios proximos sin checklist (<60 min)

### 3. Tabla de Servicios: `ChecklistServicesTable.tsx`

Lista detallada con columnas optimizadas para operacion.

**Columnas:**
| Campo | Descripcion |
|-------|-------------|
| Cliente | Nombre + hora cita |
| Custodio | Nombre + telefono (click-to-call) |
| Estado Checklist | Badge con color semantico |
| Fotos | Contador X/4 con indicador visual |
| Alertas | Iconos de GPS/Items/Docs |
| Acciones | Ver detalle, Notificar custodio |

**Funcionalidades:**
- Busqueda por cliente/custodio
- Ordenamiento por urgencia (sin checklist primero)
- Filtros rapidos por estado
- Row expandible para preview rapido

### 4. Modal de Detalle: `ChecklistDetailModal.tsx`

Vista completa del checklist con galeria de fotos mejorada.

**Secciones:**
1. **Header:** Info del servicio + estado general
2. **Galeria de Fotos:** Grid 2x2 con lightbox fullscreen
3. **Mapa de Validacion:** Mini-mapa mostrando ubicacion de captura vs origen
4. **Inspeccion Vehicular:** Grid de items con iconos
5. **Equipamiento:** Lista de verificacion
6. **Observaciones y Firma:** Texto + preview de firma
7. **Metadata:** Timestamps, estado de sincronizacion

### 5. Lightbox de Fotos: `PhotoLightbox.tsx`

Visor de imagenes fullscreen optimizado para revision.

**Caracteristicas:**
- Navegacion con swipe (touch) y flechas (desktop)
- Zoom con pinch/doble-tap
- Overlay con metadata GPS
- Indicador de validacion (OK/Fuera de rango/Sin GPS)
- Boton para abrir en Google Maps la ubicacion
- Transiciones suaves entre fotos

### 6. Panel de Alertas: `ChecklistAlertPanel.tsx`

Lista de alertas activas que requieren atencion.

**Tipos de alertas:**
- Servicio proximo (<60 min) sin checklist
- Foto fuera de rango GPS (>500m)
- Foto sin GPS
- Item de inspeccion fallido (frenos, llantas criticos)
- Checklist incompleto (fotos faltantes)

**Acciones:**
- Notificar custodio via WhatsApp/SMS
- Marcar como revisado
- Agregar nota de seguimiento

---

## Integracion con MonitoringPage

Agregar nueva seccion/tab al modulo de monitoreo existente.

**Opcion recomendada:** Tab system dentro de MonitoringPage

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Posicionamiento]  [Checklists]  [Alertas Ruta]                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Contenido de la tab seleccionada                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mejores Practicas de UI Implementadas

### Basadas en investigacion de sistemas de monitoreo vehicular:

1. **Codigo de colores consistente:**
   - Verde: Estado optimo/completo
   - Amarillo: Atencion requerida
   - Rojo: Critico/Bloqueante
   - Gris: Sin datos/Pendiente

2. **Jerarquia visual:**
   - Lo mas critico arriba y destacado
   - Alertas con animacion sutil (pulse)
   - Numeros grandes para metricas clave

3. **Galeria de fotos optimizada:**
   - Grid 2x2 para vista rapida de las 4 fotos
   - Lightbox fullscreen para revision detallada
   - Indicadores de validacion GPS en cada thumbnail
   - Soporte para swipe/touch en movil

4. **Accesibilidad operativa:**
   - Click-to-call en numeros de custodio
   - Botones de accion prominentes
   - Filtros de un click
   - Busqueda instantanea

5. **Performance:**
   - Lazy loading de imagenes
   - Virtualizacion de lista para muchos servicios
   - Cache de datos con TanStack Query

---

## Archivos a Crear

| Archivo | Descripcion | Lineas Est. |
|---------|-------------|-------------|
| `src/hooks/useChecklistMonitoreo.ts` | Hook principal de datos | ~120 |
| `src/components/monitoring/checklist/ChecklistDashboard.tsx` | Dashboard con metricas | ~180 |
| `src/components/monitoring/checklist/ChecklistServicesTable.tsx` | Tabla de servicios | ~220 |
| `src/components/monitoring/checklist/ChecklistDetailModal.tsx` | Modal de detalle | ~280 |
| `src/components/monitoring/checklist/PhotoLightbox.tsx` | Visor de fotos fullscreen | ~150 |
| `src/components/monitoring/checklist/ChecklistAlertPanel.tsx` | Panel de alertas | ~160 |
| `src/components/monitoring/checklist/index.ts` | Barrel exports | ~10 |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Monitoring/MonitoringPage.tsx` | Agregar tabs y seccion de checklists |
| `src/types/checklist.ts` | Agregar tipos para monitoreo |

---

## Orden de Implementacion

1. **Fase 1 - Infraestructura:**
   - Crear `useChecklistMonitoreo.ts` con query JOIN
   - Agregar tipos en `checklist.ts`

2. **Fase 2 - Componentes Core:**
   - `ChecklistDashboard.tsx` con tarjetas de resumen
   - `ChecklistServicesTable.tsx` con lista filtrable

3. **Fase 3 - Visor de Detalle:**
   - `ChecklistDetailModal.tsx` con secciones expandidas
   - `PhotoLightbox.tsx` con navegacion swipe

4. **Fase 4 - Sistema de Alertas:**
   - `ChecklistAlertPanel.tsx` con acciones
   - Integracion de notificaciones

5. **Fase 5 - Integracion Final:**
   - Modificar `MonitoringPage.tsx` con tabs
   - Testing end-to-end

---

## Detalles Tecnicos

### Query de Datos (useChecklistMonitoreo)
```sql
SELECT 
  sp.id as servicio_id,
  sp.id_servicio,
  sp.nombre_cliente,
  sp.custodio_asignado,
  sp.fecha_hora_cita,
  sp.estado_planeacion,
  cs.id as checklist_id,
  cs.estado as checklist_estado,
  cs.fecha_checklist,
  cs.fotos_validadas,
  cs.items_inspeccion
FROM servicios_planificados sp
LEFT JOIN checklist_servicio cs ON sp.id::text = cs.servicio_id
WHERE sp.fecha_hora_cita >= NOW() - INTERVAL 'X hours'
  AND sp.fecha_hora_cita <= NOW() + INTERVAL 'X hours'
  AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
ORDER BY sp.fecha_hora_cita ASC;
```

### Calculo de Alertas (client-side)
```typescript
function calcularAlertas(checklist) {
  const alertas = [];
  
  // GPS fuera de rango
  const fotosProblema = checklist.fotos_validadas?.filter(
    f => f.validacion === 'fuera_rango' || f.validacion === 'sin_gps'
  );
  if (fotosProblema?.length > 0) {
    alertas.push({ tipo: 'gps', count: fotosProblema.length });
  }
  
  // Items criticos fallidos
  const itemsCriticos = ['llantas_ok', 'frenos_ok'];
  const fallidos = itemsCriticos.filter(
    k => checklist.items_inspeccion?.vehiculo?.[k] === false
  );
  if (fallidos.length > 0) {
    alertas.push({ tipo: 'inspeccion', items: fallidos });
  }
  
  return alertas;
}
```

### PhotoLightbox Navigation
```typescript
// Soporte para swipe touch
const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
const handleTouchEnd = (e) => {
  const diff = touchStart - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    diff > 0 ? nextPhoto() : prevPhoto();
  }
};
```
