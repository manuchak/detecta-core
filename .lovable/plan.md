

# Plan: Dashboard de Monitoreo de Servicios del Turno (±8 horas)

## Objetivo
Crear un mapa interactivo y panel de resumen que muestre los servicios asignados dentro de la ventana del turno (±8 horas), diferenciando visualmente cuáles custodios ya están "in situ" (han iniciado servicio) y cuáles están pendientes de llegar.

---

## Investigación Realizada

### Mejores Prácticas de Dashboards de Logística

1. **Mapa en Tiempo Real como Centro del Dashboard**
   - El mapa debe ser la pieza central donde converge toda la información operativa
   - Geofencing y marcadores interactivos permiten identificación rápida

2. **Sistema de Colores por Estado (Carbon Design System)**
   - Verde: Custodio en sitio, servicio iniciado
   - Amarillo/Ámbar: En tránsito o próximo a la hora de cita
   - Rojo: Retraso o sin confirmar cerca de la hora
   - Azul: Pendiente (aún tiene tiempo)
   - Gris: Sin custodio asignado

3. **Indicadores Visuales Múltiples**
   - Para cumplir WCAG, usar mínimo 3 elementos: forma + color + texto/icono
   - Tamaño del marcador puede indicar prioridad o tiempo restante

4. **Acciones Contextuales**
   - Click en marcador abre detalles del servicio
   - Popups con información clave: cliente, custodio, ETA, estado

### Patrones Técnicos de Mapbox
- Marcadores HTML personalizados para máximo control visual
- GeoJSON con actualizaciones cada 30 segundos
- `flyTo()` para centrar en un punto específico
- Popup interactivo con datos del servicio

---

## Arquitectura de Datos

### Consulta Principal: Servicios del Turno
```sql
SELECT id, nombre_cliente, origen, destino, custodio_asignado, 
       fecha_hora_cita, estado_planeacion, hora_inicio_real
FROM servicios_planificados 
WHERE fecha_hora_cita >= NOW() - INTERVAL '8 hours' 
  AND fecha_hora_cita <= NOW() + INTERVAL '8 hours'
  AND estado_planeacion NOT IN ('cancelado', 'completado')
```

### Estados Derivados para el Mapa

| Condición | Estado Visual | Color | Icono |
|-----------|---------------|-------|-------|
| `hora_inicio_real IS NOT NULL` | En Sitio | Verde | Checkmark en círculo |
| `custodio_asignado IS NOT NULL` AND cita en <1hr | Próximo | Ámbar | Reloj |
| `custodio_asignado IS NOT NULL` | Asignado | Azul | Persona |
| `custodio_asignado IS NULL` | Sin Asignar | Gris | Alerta |

---

## Componentes a Crear

### 1. Hook: `useServiciosTurno`
```text
src/hooks/useServiciosTurno.ts
├── Consulta servicios ±8 horas de NOW()
├── Geocodifica orígenes usando CIUDADES_PRINCIPALES
├── Calcula estado derivado (enSitio, proximo, asignado, sinAsignar)
├── Agrupa por estado para estadísticas
└── RefetchInterval: 30 segundos
```

### 2. Mapa: `ShiftServicesMap`
```text
src/components/monitoring/ShiftServicesMap.tsx
├── Mapa base Mapbox (light-v11 para contraste)
├── Marcadores HTML personalizados por estado:
│   ├── Círculo con borde de color
│   ├── Icono interior (checkmark, clock, user, alert)
│   └── Animación pulse para "En Sitio" (atención positiva)
├── Popup al hover con datos del servicio
├── Click para centrar y abrir detalle
├── Leyenda de estados
└── Contador de servicios por estado
```

### 3. Panel de Resumen: `ShiftSummaryCards`
```text
src/components/monitoring/ShiftSummaryCards.tsx
├── Card "En Sitio" (verde) - Custodios que ya iniciaron
├── Card "Próximos" (ámbar) - Servicios en <1hr
├── Card "Asignados" (azul) - Con custodio, tiempo holgado
├── Card "Sin Asignar" (gris/rojo) - Requieren atención
└── Indicador de última actualización
```

### 4. Tabla de Servicios: `ShiftServicesTable`
```text
src/components/monitoring/ShiftServicesTable.tsx
├── Lista ordenada por hora de cita
├── Columnas: Hora, Cliente, Origen, Custodio, Estado
├── Filtros rápidos por estado
├── Row click sincroniza con mapa (flyTo)
└── Badge visual por estado
```

---

## Diseño Visual

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Monitoreo de Turno                                    🔄 Actualizado 19:25 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  EN SITIO   │ │  PRÓXIMOS   │ │  ASIGNADOS  │ │ SIN ASIGNAR │       │
│  │     12      │ │      4      │ │      5      │ │      1      │       │
│  │   ● Verde   │ │   ● Ámbar   │ │   ● Azul    │ │   ● Gris    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                                                               │     │
│  │                         M A P A                               │     │
│  │                                                               │     │
│  │     ●(verde)  ●(azul)    ●(ámbar)                            │     │
│  │         CDMX        Querétaro                                │     │
│  │                                                               │     │
│  │    ●(verde)                      ●(azul)                     │     │
│  │      Toluca                       Guadalajara                │     │
│  │                                                               │     │
│  │  ─────────────────────────────────────────────────           │     │
│  │  ● En Sitio  ● Próximo  ● Asignado  ○ Sin Asignar           │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  Servicios del Turno                              [Filtros ▾] │     │
│  ├───────────────────────────────────────────────────────────────┤     │
│  │  12:00  ADMINISTRADORA DAJO   ECATEPEC    I. Lona      ● 🟢  │     │
│  │  13:00  Siegfried Rhein       QUERÉTARO   P. Márquez   ● 🔵  │     │
│  │  13:30  BIRKENSTOCK           TULTITLÁN   J. García    ● 🟢  │     │
│  │  15:00  DEVGRU                MANZANILLO  L. Torres    ● 🟠  │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Marcadores del Mapa

Diseño de marcadores siguiendo Carbon Design System:

```text
   EN SITIO           PRÓXIMO          ASIGNADO         SIN ASIGNAR
   ┌─────┐            ┌─────┐          ┌─────┐          ┌─────┐
   │ ✓  │ pulso      │ 🕐 │          │ 👤 │          │ ⚠ │
   └─────┘ verde     └─────┘ ámbar   └─────┘ azul    └─────┘ gris
   
   Borde: 3px sólido del color
   Fondo: Blanco con icono del color
   Tamaño: 36x36px base
   Hover: Scale 1.15 + popup
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/hooks/useServiciosTurno.ts` | Crear | Hook para consultar servicios del turno con geocodificación |
| `src/components/monitoring/ShiftServicesMap.tsx` | Crear | Mapa con marcadores por estado |
| `src/components/monitoring/ShiftSummaryCards.tsx` | Crear | Cards de resumen por estado |
| `src/components/monitoring/ShiftServicesTable.tsx` | Crear | Tabla de servicios del turno |
| `src/pages/Monitoring/MonitoringPage.tsx` | Modificar | Integrar nuevos componentes |
| `src/utils/geografico.ts` | Posiblemente expandir | Agregar ciudades faltantes si es necesario |

---

## Detalles Técnicos

### Hook useServiciosTurno
```typescript
interface ServicioTurno {
  id: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  custodio_asignado: string | null;
  fecha_hora_cita: string;
  estado_planeacion: string;
  hora_inicio_real: string | null;
  // Campos calculados
  lat: number | null;
  lng: number | null;
  estadoVisual: 'en_sitio' | 'proximo' | 'asignado' | 'sin_asignar';
  minutosParaCita: number;
}

interface ResumenTurno {
  enSitio: number;
  proximos: number;
  asignados: number;
  sinAsignar: number;
  total: number;
}
```

### Lógica de Estado Visual
```typescript
function calcularEstadoVisual(servicio: ServicioPlanificado): EstadoVisual {
  // Si ya inició el servicio → En Sitio
  if (servicio.hora_inicio_real) return 'en_sitio';
  
  // Sin custodio → Sin Asignar
  if (!servicio.custodio_asignado) return 'sin_asignar';
  
  // Calcular minutos hasta la cita
  const ahora = new Date();
  const cita = new Date(servicio.fecha_hora_cita);
  const minutos = (cita.getTime() - ahora.getTime()) / 60000;
  
  // Menos de 60 minutos → Próximo
  if (minutos <= 60 && minutos >= -30) return 'proximo';
  
  // Con custodio y tiempo → Asignado
  return 'asignado';
}
```

### Paleta de Colores
```typescript
const COLORES_ESTADO = {
  en_sitio: {
    primary: '#22c55e',    // green-500
    bg: '#dcfce7',         // green-100
    border: '#16a34a',     // green-600
    icon: 'CheckCircle'
  },
  proximo: {
    primary: '#f59e0b',    // amber-500
    bg: '#fef3c7',         // amber-100
    border: '#d97706',     // amber-600
    icon: 'Clock'
  },
  asignado: {
    primary: '#3b82f6',    // blue-500
    bg: '#dbeafe',         // blue-100
    border: '#2563eb',     // blue-600
    icon: 'User'
  },
  sin_asignar: {
    primary: '#6b7280',    // gray-500
    bg: '#f3f4f6',         // gray-100
    border: '#4b5563',     // gray-600
    icon: 'AlertCircle'
  }
};
```

---

## Flujo de Actualización

```text
1. useServiciosTurno ejecuta query cada 30 segundos
2. Datos se transforman con geocodificación + estado visual
3. ShiftSummaryCards muestra contadores
4. ShiftServicesMap renderiza marcadores
5. Usuario hace click en marcador → mapa centra + popup
6. Usuario puede filtrar tabla → mapa resalta subset
```

---

## Beneficios

| Beneficio | Impacto |
|-----------|---------|
| **Visibilidad instantánea** | Ver de un vistazo quién está en sitio vs pendiente |
| **Alertas visuales** | Colores indican urgencia sin leer datos |
| **Contexto geográfico** | Entender distribución de operación en el territorio |
| **Interactividad** | Click para profundizar en cualquier servicio |
| **Actualización automática** | Datos frescos cada 30 segundos |

