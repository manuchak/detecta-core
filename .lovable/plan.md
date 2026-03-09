

# Rediseño del Workflow de Cortes Semanales

## Problemas del Workflow Actual

| Problema | Impacto |
|----------|---------|
| **Generación 1-por-1** | Con 100+ custodios activos, generar cortes requiere abrir el diálogo 100+ veces por semana |
| **Sin vista de "faltantes"** | No hay forma de ver qué custodios YA tienen corte y cuáles NO para la semana activa |
| **Transiciones individuales** | Aprobar/dispersar/pagar es click-por-click, sin batch |
| **Sin protección de duplicados** | Nada impide generar 2 cortes para el mismo custodio en la misma semana |
| **Sin resumen ejecutivo** | No hay totales de nómina semanal antes de dispersar |

## Propuesta: 3 Mejoras Clave

### 1. Generación Masiva de Cortes (Bulk Generate)

Nuevo botón **"Generar Cortes Semana"** que:
- Consulta TODOS los custodios/armados con servicios finalizados en la semana visible
- Excluye los que ya tienen corte generado (protección de duplicados)
- Muestra una tabla-preview con checkboxes: nombre, servicios, monto estimado
- Un click genera todos los cortes seleccionados en batch
- Feedback: "23 cortes generados, 4 custodios sin servicios"

```text
┌─────────────────────────────────────────────────────┐
│  Generar Cortes — Semana Lun 02/Mar – Dom 08/Mar    │
│─────────────────────────────────────────────────────│
│  ☑ Seleccionar todos (87)                           │
│                                                     │
│  ☑ Juan Pérez       │ 12 svcs │ $8,400  │ Base+Cas │
│  ☑ María López      │  8 svcs │ $5,200  │ Base     │
│  ☑ Carlos Ruiz      │  3 svcs │ $2,100  │ Base+Est │
│  ☐ Ana Torres       │  0 svcs │ $0      │ Sin svcs │
│  — Pedro García     │  ✓ Ya tiene corte            │
│                                                     │
│  Total: 87 operativos │ $342,500 estimado           │
│                                                     │
│  [Cancelar]                    [Generar 85 Cortes]  │
└─────────────────────────────────────────────────────┘
```

### 2. Acciones en Batch (Aprobar/Dispersar/Pagar)

- Agregar checkboxes a la tabla de cortes existente
- Barra de acciones flotante cuando hay selección: "Aprobar (12)" / "Dispersar (12)" / "Marcar Pagado (12)"
- Validación: solo permite transición si todos los seleccionados están en el mismo estado

### 3. Dashboard de Cobertura Semanal

Reemplazar los KPIs actuales con métricas más accionables:
- **Operativos con corte** vs **Operativos sin corte** (progreso de generación)
- **Nómina semanal total** (suma de todos los cortes)
- **Pipeline**: cuántos en borrador → revisión → aprobados → dispersados → pagados

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `CxPOperativoTab.tsx` | Agregar botón "Generar Cortes Semana", checkboxes en tabla, barra de batch actions, KPIs de cobertura |
| Nuevo: `GenerarCortesMasivosDialog.tsx` | Diálogo de generación masiva con preview, checkboxes, protección duplicados |
| `useCxPCortesSemanales.ts` | Agregar `useCreateCxPCortesBatch` (inserta N cortes), `useOperativosConServicios` (preview masivo), protección de duplicados |
| `GenerarCorteDialog.tsx` | Agregar validación: rechazar si ya existe corte para ese operativo+semana |

### Detalle técnico de la generación masiva

1. Query `servicios_custodia` agrupado por `id_custodio` para la semana → lista de operativos con servicios
2. Query `cxp_cortes_semanales` para la misma semana → set de operativos que YA tienen corte
3. Diff = operativos pendientes de generar
4. Al confirmar: loop de inserts (reutilizando la lógica existente de `useCreateCxPCorte`) con toast de progreso
5. Cada insert incluye header + detalle (misma lógica actual)

