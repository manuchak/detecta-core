

# Implementaci\u00f3n del Plan de Maduraci\u00f3n del M\u00f3dulo de Seguridad

El plan ya fue presentado y aprobado. El usuario seleccion\u00f3:
- **Prioridad**: Todo secuencial (Bloque 1→2→3→4→5→6)
- **Visibilidad DRF**: Solo en M\u00f3dulo de Seguridad

Solicito aprobaci\u00f3n para iniciar la implementaci\u00f3n del **Bloque 1**: Factor de Riesgo Detecta (DRF) + Tarjeta DRF + Mejoras al Dashboard de Risk Posture.

## Bloque 1 - Archivos a crear/modificar

### Crear: `src/hooks/security/useDetectaRiskFactor.ts`
- Query paralelo a `incidentes_operativos`, `servicios_planificados`, `risk_zone_scores`, `safe_points`
- C\u00e1lculo DRF = 30% IncidentRate + 25% SeverityIndex + 20% ControlFailure + 15% Exposure - 10% Mitigation
- Tendencias DoD/WoW/MoM/QoQ/YoY comparando periodos actual vs anterior
- Retorna: `currentDRF`, `riskLevel`, `breakdown`, `trends`

### Crear: `src/components/security/dashboard/DetectaRiskFactorCard.tsx`
- Score gauge (0-100) con color por nivel de riesgo
- Selector de periodo (DoD/WoW/MoM/QoQ/YoY)
- Badge de tendencia con direcci\u00f3n (mejorando/estable/empeorando)
- Breakdown expandible con los 5 componentes del DRF

### Modificar: `src/components/security/dashboard/SecurityDashboard.tsx`
- Agregar DRF como primera tarjeta prominente (span 2 columnas)
- Agregar tarjeta "Control Effectiveness" (% de control_efectivo=true)
- Separar "Ultimos Eventos" en dos fuentes: operativos propios vs RRSS
- Subtexto en "Incidentes Cr\u00edticos": desglosar fuente (operativos/zonas H3)

### Modificar: `src/hooks/security/useSecurityDashboard.ts`
- Agregar query a `incidentes_operativos` para KPIs basados en datos propios
- Calcular `controlEffectivenessRate` desde incidentes operativos
- Separar `recentEvents` en dos arrays: operativos y security_events

