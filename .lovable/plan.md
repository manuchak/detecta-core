

## Tendencias Mensuales de Performance - Progreso mes a mes

### Objetivo

Expandir las tendencias temporales para mostrar la evolucion mensual de las 5 dimensiones de rendimiento: puntualidad (a tiempo vs retrasos), rechazos, checklists, ademas de los servicios y KM que ya existen.

### Cambios

**1. `src/pages/PerfilesOperativos/hooks/useProfileTrends.ts`**

Agregar queries mensuales para:
- **Puntualidad**: query a `servicios_custodia` con `hora_presentacion` y `fecha_hora_cita` por mes, calcular a_tiempo / retraso_leve / retraso_grave
- **Rechazos**: query a `custodio_rechazos` por `fecha_rechazo` en cada mes
- **Checklists**: query a `checklist_servicio` por mes (usando `custodio_telefono`)

Nuevos campos en `MonthlyTrendData`:
```typescript
interface MonthlyTrendData {
  // ... campos existentes ...
  puntualidadATiempo: number;
  puntualidadRetrasoLeve: number;
  puntualidadRetrasoGrave: number;
  puntualidadTotal: number;
  scorePuntualidad: number;
  rechazos: number;
  checklistsCompletados: number;
  serviciosFinalizados: number;
  scoreChecklist: number;
}
```

Se necesita recibir `telefono` como parametro adicional para la query de checklists.

**2. `src/pages/PerfilesOperativos/components/tabs/TrendCharts.tsx`**

Agregar 3 graficas nuevas:

- **Evolucion de Puntualidad** (BarChart apilado): barras verde/amarillo/rojo por mes mostrando a_tiempo, retraso_leve, retraso_grave. Linea superpuesta con % puntualidad.
- **Rechazos por Mes** (BarChart simple): barras rojas con count de rechazos. Meses en 0 se muestran como barra vacia (bueno).
- **Cumplimiento Checklist** (AreaChart): linea con % de servicios finalizados que tienen checklist completado.

Reorganizar el orden de graficas: Puntualidad primero, luego Rechazos, luego Checklists, luego Servicios (existente), luego KM e Ingresos (existentes).

**3. `src/pages/PerfilesOperativos/components/tabs/PerformanceServiciosTab.tsx`**

Pasar `telefono` (profile.telefono) al componente `TrendCharts` para que pueda hacer la query de checklists.

### Detalle tecnico

Para evitar N+1 queries por mes, la estrategia es:
1. Hacer UNA query por tabla que traiga todos los registros del custodio de los ultimos 6 meses
2. Agrupar en cliente por mes usando `date-fns`

Esto reduce de ~18 queries (6 meses x 3 tablas nuevas) a solo 3 queries adicionales:
- `servicios_custodia` con `hora_presentacion` (ya se trae, solo agregar campos)
- `custodio_rechazos` filtrado por fecha ultimos 6 meses
- `checklist_servicio` filtrado por fecha ultimos 6 meses

### Impacto visual esperado

El perfil de Alvaro Toriz mostrara:
- Puntualidad: tendencia mes a mes de como ha mejorado o empeorado su porcentaje de llegada a tiempo
- Rechazos: historial de 0 rechazos por mes (indicador positivo)
- Checklists: 0% consistente (revelando un problema sistematico, no puntual)
- Los graficos existentes de servicios, KM e ingresos se mantienen

