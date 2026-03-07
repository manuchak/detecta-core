

# Plan: Dashboard Ejecutivo Operativo Mobile-Only (Real-Time)

## Concepto

Un nuevo sub-tab "Operativo" dentro del Dashboard Ejecutivo (`/dashboard`) diseñado exclusivamente para consumo móvil. Muestra la realidad operativa en tiempo real: servicios por fase, alertas, monitoristas activos, y métricas de touchpoint — todo alimentado por los hooks existentes `useServiciosTurnoLive` y `useMonitoristaAssignment`.

## Arquitectura de Datos

Reutiliza hooks existentes sin crear queries nuevas:

- **`useServiciosTurnoLive()`** → servicios activos, pendientes, completados, alertas, fases (en_curso, en_destino, por_iniciar, evento_especial)
- **`useMonitoristaAssignment()`** → monitoristas en turno, event_count por monitorista, actividad reciente
- **Eventos de ruta** (ya cargados por radar) → cálculo de touchpoint promedio

## Nuevo Hook: `useOperationalPulse.ts`

Hook ligero que compone los dos hooks anteriores y calcula métricas derivadas:

```text
Inputs: useServiciosTurnoLive() + useMonitoristaAssignment()

Outputs:
  serviciosPorFase: { porSalir, enRuta, enDestino, enEvento, completados, enAlerta }
  monitoristas: { activos, totalEnTurno, listado[] con touchpoints/carga }
  touchpoints: { promedioGlobal (min), porMonitorista[] }
  alertas: { serviciosEnAlerta[], criticosCount, warningCount }
  ultimaActualizacion: Date
```

El cálculo de touchpoint promedio se obtiene de los eventos de ruta de servicios activos: `totalEventos / totalServiciosActivos`.

## Nuevo Componente: `MobileOperationalDashboard.tsx`

Layout vertical mobile-first (~390px), sin gráficos pesados. Estructura:

```text
┌─────────────────────────┐
│ 🟢 Pulso Operativo      │  ← Header con reloj real-time
│ Mar 7, 2026 · 14:32 CST │
├─────────────────────────┤
│ ┌──────┐ ┌──────┐       │
│ │ 12   │ │  8   │       │  ← Grid 2x2: Por Salir, En Ruta
│ │PorSal│ │EnRuta│       │
│ ├──────┤ ├──────┤       │
│ │  3   │ │  2   │       │  ← En Destino, En Evento
│ │EnDest│ │Evento│       │
│ └──────┘ └──────┘       │
├─────────────────────────┤
│ ✅ 47 Completados hoy   │  ← Banner simple
├─────────────────────────┤
│ 🚨 ALERTAS (3)          │
│ ┌─ SIEGFRIED · 52m ──┐  │  ← Lista de alertas con timer
│ │ Custodio: BALLEST. │  │
│ └────────────────────┘  │
│ ┌─ ABC LOGIS · 38m ──┐  │
│ └────────────────────┘  │
├─────────────────────────┤
│ 📊 Touchpoints          │
│ Promedio global: 18 min │
│ ┌────────────────────┐  │
│ │ Ana G.    12m  ██▓ │  │  ← Por monitorista con barra
│ │ Carlos R. 22m  █░░ │  │
│ │ Luis M.   15m  ██░ │  │
│ └────────────────────┘  │
├─────────────────────────┤
│ 👥 Monitoristas (4/6)   │
│ ┌────────────────────┐  │
│ │ ● Ana G.  · 8 svcs │  │  ← Activos con carga
│ │ ● Carlos  · 5 svcs │  │
│ │ ○ Pedro   · offline│  │
│ └────────────────────┘  │
└─────────────────────────┘
```

## Integración

Agregar una quinta tab "Operativo" al `ExecutiveDashboard.tsx` con icono `Radio`. En desktop muestra el mismo contenido centrado con max-width. En móvil ocupa el 100% del viewport.

```text
Tabs: [Proyecciones] [Plan 2026] [StarMap] [KPIs] [Operativo]
                                                      ↑ NUEVO
```

Ruta: `/dashboard/operativo` (se suma al switch existente en handleTabChange).

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/hooks/useOperationalPulse.ts` | Crear — composición de hooks existentes + métricas derivadas |
| `src/components/executive/MobileOperationalDashboard.tsx` | Crear — UI mobile-first completa |
| `src/pages/Dashboard/ExecutiveDashboard.tsx` | Editar — agregar tab "Operativo" + ruta |
| `src/App.tsx` | Editar — agregar ruta `/dashboard/operativo` |

## Datos en Tiempo Real

- Refresco automático cada 15s (heredado del radar hook)
- Suscripciones realtime a `servicios_planificados` y `servicio_eventos_ruta`
- Reloj visible con última actualización
- Sin necesidad de migración SQL ni nuevas tablas

