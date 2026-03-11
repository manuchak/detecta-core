

# Guía de Reglas del Sistema — Pestaña para Coordinador

## Objetivo

Crear un componente `SystemRulesGuide.tsx` que presente las reglas de OrphanGuard, BalanceGuard y el workflow Planeación→Monitoreo en lenguaje natural con diagramas Mermaid. Se integra como una nueva pestaña "Reglas" en `MonitoringPage.tsx`, visible solo para coordinadores.

## Contenido de la guía (5 secciones)

### 1. Flujo General: Planeación → Monitoreo
Diagrama de flujo lineal con las fases: Solicitud → Cotización → Asignación Custodio → Armados/Extras → En Sitio → (HANDOFF) → Checklist → Inicio → Monitoreo → Destino → Liberación. Texto explicativo de quién es responsable en cada tramo.

### 2. Regla 1 — Auto-asignación de Pendientes
"Si un servicio tiene custodio en sitio y su cita es entre 1 hora atrás y 4 horas adelante, el sistema le asigna un monitorista automáticamente." Diagrama: servicio sin monitorista → ventana de tiempo → asignación al de menor carga.

### 3. Regla 2 — Rescate de Activos Huérfanos
"Si un servicio ya empezó pero no tiene monitorista asignado, el sistema lo asigna inmediatamente al monitorista con menos carga." Diagrama corto.

### 4. Regla 3 — Reasignación por Desconexión
"Si un monitorista se desconecta (pierde heartbeat), todos sus servicios pasan al monitorista con menos carga. Se registra en anomalías." Diagrama con offline detection.

### 5. Regla 4 — Limpieza de Futuras (con protección manual)
"Si un servicio tiene cita a más de 4 horas, las asignaciones automáticas se desactivan. Pero si un coordinador asignó manualmente, esa asignación está protegida."

### 6. Balanceo de Carga
"Cada 5 minutos, si un monitorista tiene 2+ servicios más que otro, el sistema mueve servicios 'fríos' (sin actividad) para equilibrar. No mueve servicios con eventos activos ni los recién restaurados de pausa."

### 7. Blindajes del Handoff
Lista de protecciones: gate de visibilidad (solo En Sitio), guard de inicio, supresión pernocta, permanencia sin límite temporal.

## Diseño visual

- Cards con iconos y colores por tipo de regla (Shield, Zap, Scale, AlertTriangle)
- Cada regla: título, explicación en 2-3 oraciones, diagrama Mermaid inline usando `presentation-mermaid` style rendering (pero como componente React con Mermaid library... en su lugar usaré un ASCII/visual flow con badges y arrows usando Tailwind)
- Flujo visual con steps conectados por flechas usando divs estilizados (no Mermaid en runtime)

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/rules/SystemRulesGuide.tsx` | Nuevo — componente con todas las reglas |
| `src/pages/Monitoring/MonitoringPage.tsx` | Agregar tab "Reglas" con icono `BookOpen`, solo coordinadores |

