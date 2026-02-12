

## Rediseño del Informe de Performance - Métricas Reales y Completas

### Problema actual

El informe de rendimiento tiene **errores de cálculo fundamentales** y le faltan dimensiones operativas críticas. El "Score Global de 53" de Alvaro Toriz es incorrecto: en realidad es un custodio con buen rendimiento (77% puntualidad real, 0 rechazos, 87 servicios finalizados).

### Causa raíz técnica

El hook `useProfilePerformance.ts` calcula "Puntualidad" como porcentaje de asignaciones confirmadas en `servicios_planificados`, no como puntualidad real de llegada. Además, el reporte solo tiene 2 dimensiones (Puntualidad falsa + Confiabilidad) cuando hay datos disponibles para al menos 6 dimensiones.

### Datos reales disponibles para Alvaro Toriz (BD actual)

- **Puntualidad real**: 61/79 a tiempo (77%), 6 retraso leve, 12 retraso grave (datos en `hora_presentacion` vs `fecha_hora_cita`)
- **Rechazos**: 0 (tabla `custodio_rechazos`)
- **Checklists**: 0 completados (tabla `checklist_servicio`)
- **Documentación**: 3 subidos, 0 verificados (tabla `documentos_custodio`)
- **Servicios ejecutados**: 87 finalizados
- **Diferencia promedio presentación**: -0.7 minutos (llega ligeramente antes en promedio)

### Solución: 6 dimensiones de rendimiento

Rediseñar el hook y la UI para evaluar al custodio en 6 ejes reales:

| Dimensión | Fuente de datos | Cálculo |
|---|---|---|
| Puntualidad | `servicios_custodia.hora_presentacion` vs `fecha_hora_cita` | % servicios donde llegó a tiempo o antes |
| Confiabilidad | `servicios_planificados` cancelaciones + `custodio_rechazos` | % servicios no cancelados/rechazados |
| Cumplimiento Checklist | `checklist_servicio` vs servicios totales | % servicios con checklist completado |
| Documentación | `documentos_custodio` verificados vs requeridos | % documentos verificados y vigentes |
| Volumen Operativo | `servicios_custodia` finalizados | Cantidad y frecuencia de servicios |
| Historial de Rechazos | `custodio_rechazos` count | Rechazos en últimos 90 días |

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useProfilePerformance.ts` | Refactorizar completamente. Agregar queries para: (1) puntualidad real (`hora_presentacion` vs `fecha_hora_cita`), (2) rechazos (`custodio_rechazos`), (3) checklists (`checklist_servicio`), (4) documentación (reusar RPC `get_documentos_custodio_by_phone`). Corregir cálculo de Score Global con las 6 dimensiones ponderadas. |
| `src/pages/PerfilesOperativos/components/tabs/PerformanceServiciosTab.tsx` | Rediseñar la sección "Score Global" para mostrar 6 barras de progreso en lugar de 2. Agregar sección de "Alertas de Cumplimiento" cuando hay métricas en 0 (ej: checklists faltantes). Mantener las secciones existentes de Tasas de Respuesta, Métricas de Asignación y Métricas de Ejecución. |

### Detalle técnico del nuevo hook

```typescript
// Nuevas interfaces
interface PerformanceMetrics {
  // Puntualidad real (hora_presentacion vs fecha_hora_cita)
  puntualidadATiempo: number;
  puntualidadRetrasoLeve: number;  // <= 15 min
  puntualidadRetrasoGrave: number; // > 15 min
  puntualidadTotal: number;
  scorePuntualidad: number; // % a tiempo

  // Confiabilidad (cancelaciones + rechazos)
  totalAsignaciones: number;
  cancelaciones: number;
  rechazos: number;
  scoreConfiabilidad: number;

  // Checklist compliance
  serviciosConChecklist: number;
  serviciosSinChecklist: number;
  scoreChecklist: number; // % con checklist

  // Documentación
  docsSubidos: number;
  docsVerificados: number;
  docsVigentes: number;
  scoreDocumentacion: number;

  // Volumen
  totalEjecuciones: number;
  ejecucionesCompletadas: number;
  kmTotales: number;
  ingresosTotales: number;

  // Score Global ponderado
  scoreGlobal: number;
}
```

**Ponderación del Score Global propuesta:**

| Dimensión | Peso | Justificación |
|---|---|---|
| Puntualidad real | 30% | Core del servicio: llegar a la hora indicada |
| Confiabilidad | 25% | No cancelar ni rechazar compromisos |
| Checklist | 20% | Cumplimiento regulatorio y de seguridad |
| Documentación | 15% | Vigencia y verificación de papeles |
| Volumen (normalizado) | 10% | Actividad y disponibilidad |

**Cálculo de puntualidad real:**
```typescript
// Query: servicios con hora_presentacion y fecha_hora_cita
const diffMinutes = EXTRACT(EPOCH FROM (hora_presentacion - fecha_hora_cita)) / 60;
// a_tiempo: diffMinutes <= 0
// retraso_leve: 0 < diffMinutes <= 15
// retraso_grave: diffMinutes > 15
// scorePuntualidad = (a_tiempo / total_con_dato) * 100
```

**Ejemplo con Alvaro Toriz (resultado esperado):**
- Puntualidad: 77% (61/79 a tiempo) -> 23.1 puntos (de 30)
- Confiabilidad: 97% (1 cancel, 0 rechazos de 43) -> 24.4 puntos (de 25)
- Checklist: 0% (0 de 87) -> 0 puntos (de 20) -- ALERTA
- Documentación: 0% verificados (3 subidos, 0 verificados) -> 0 puntos (de 15) -- ALERTA
- Volumen: normalizado ~80% (87 servicios es alto) -> 8 puntos (de 10)
- **Score Global: ~55** (en lugar del 53 actual, pero ahora con significado real)

### Nuevo diseño visual del Score Global

La sección principal mostrará:
1. Donut chart con el score global ponderado (igual que ahora)
2. **6 barras de progreso** con colores por dimensión en lugar de 2
3. **Badges de alerta** cuando una dimensión está en 0% (rojo) o por debajo del 50% (amarillo)
4. Tooltip explicando qué compone cada score

### Alertas de cumplimiento (nueva sección)

Cuando una dimensión esté en rojo (0%), se mostrará un banner de alerta:
- "Sin checklists completados - 87 servicios sin registro de inspección pre-servicio"
- "Documentación sin verificar - 3 documentos pendientes de revisión"

Esto le da al equipo visibilidad inmediata de qué debe corregirse.

### Impacto

- El Score Global reflejará rendimiento real, no métricas proxy
- El equipo de planeación podrá tomar decisiones de asignación con datos confiables
- Se detectarán automáticamente custodios sin checklists o documentación vencida
- No se requieren nuevas tablas ni migraciones, solo queries adicionales a datos existentes
