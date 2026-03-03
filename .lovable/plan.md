

# Rediseño: Tarjetas de Inteligencia para Head of Security

## Problemas encontrados

### 1. Heatmap de Incidentes — Mezclado y sin contexto
- **Problema**: Mezcla incidentes operativos (robos reales a la flota) con eventos de inteligencia externa (scraping de Twitter). Si no hubo siniestros en 4 semanas, el heatmap muestra celda grises vacías — no dice nada útil.
- **Solución**: Separar en dos capas: (a) siniestros propios (es_siniestro=true) como celdas rojas, (b) incidentes operativos no-siniestro como amarillo, (c) intel externa como un indicador sutil. Si no hay siniestros en 4 semanas, mostrar un mensaje positivo: "28 días sin siniestros — racha activa" con badge verde, no un grid vacío.

### 2. Distribución de Riesgo — Sin contexto operativo
- **Problema**: Muestra las 2,037 celdas H3 de `risk_zone_scores`. Estas son hexágonos geográficos sobre la red carretera de México — son **estructurales**, no representan rutas activas ni servicios del periodo. Para un Head of Security esto es ruido: México tiene zonas peligrosas, eso ya se sabe.
- **Solución**: Hacer la distribución relevante:
  - Titulo: "Exposición en Rutas Activas" (no "Distribución de Riesgo" genérica)
  - Filtrar las zonas que se cruzan con rutas que realmente se operaron en los últimos 30 días (cruzar con servicios)
  - Si no se puede cruzar con servicios aún, al menos mostrar el periodo y aclarar: "2,037 zonas H3 en red carretera nacional — cobertura total"
  - Intel: aclarar que son eventos de fuentes abiertas (RRSS/web), no incidentes propios

### 3. Acciones Recomendadas — Métricas mal calculadas

**Efectividad de controles al 2%**: Compara 381 checklists (que empezaron el **12 de febrero 2026**, hace 3 semanas) contra 22,523 servicios acumulados desde **enero 2024** (27 meses). Es como medir la tasa de vacunación de un país dividiendo las vacunas de esta semana entre la población total de los últimos 3 años. El cálculo correcto: 381 checklists / servicios de Feb-Mar 2026.

**"2,037 zonas en riesgo alto/extremo"**: No es accionable. Un Head of Security no puede "evaluar rutas alternativas" para 2,037 hexágonos de todo México. Debería enfocarse en las rutas que se operaron la semana pasada y tuvieron incidentes.

**Recomendaciones estáticas**: Siempre muestran lo mismo porque los umbrales no cambian (controlEffectiveness siempre < 60, servicesInRedZones siempre > 3).

## Plan de corrección

### A. `useSecurityDashboard.ts` — Corregir métricas

1. **Control Effectiveness**: Calcular usando solo el periodo donde existen checklists (desde Feb 12 2026). Dividir checklists completados / servicios del mismo periodo.
2. **Agregar periodo a KPIs**: Nuevo campo `effectivenessPeriodLabel` para que la UI muestre "Últimas 3 semanas" o "Feb-Mar 2026".
3. **servicesInRedZones**: Renombrar a `zonesHighRisk` y agregar `routesInHighRiskZones` (número de rutas/servicios que cruzaron zonas alto/extremo en los últimos 30 días, si hay datos de servicios).

### B. `IncidentHeatmap.tsx` — Hacer útil

1. Separar visualmente siniestros (borde rojo grueso) de incidentes operativos menores
2. Cuando no hay siniestros en 28 días: mostrar "🟢 28 días sin siniestros" como indicador positivo (racha), no un grid vacío
3. Agregar subtítulo: "Incidentes Operativos Propios — 4 semanas"

### C. `RiskDistributionChart.tsx` — Contextualizar

1. Cambiar título a "Cobertura de Riesgo — Red Nacional"
2. Aclarar que son zonas H3 de la red carretera, no rutas activas
3. Intel: especificar "Eventos OSINT (fuentes abiertas)"

### D. `ActionableRecommendations.tsx` — Recomendaciones inteligentes

1. Efectividad: Usar la métrica corregida con periodo explícito
2. Zonas: En vez de "2,037 zonas", decir "X servicios transitaron zonas extremas esta semana"
3. Agregar recomendación basada en la racha sin siniestros: si >30 días, "Racha positiva — mantener protocolo actual"
4. Si hay siniestros recientes: enfocarse en corredor específico, no generalizar

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `useSecurityDashboard.ts` | Corregir cálculo de control effectiveness (periodo real de checklists), agregar label de periodo |
| `IncidentHeatmap.tsx` | Separar siniestros de incidentes menores, mostrar racha positiva si 0 siniestros |
| `RiskDistributionChart.tsx` | Contextualizar título y labels (red nacional, OSINT) |
| `ActionableRecommendations.tsx` | Recomendaciones con métricas corregidas y contexto temporal explícito |

