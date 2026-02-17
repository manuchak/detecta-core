
## Migrar exportación "Análisis de Clientes" a React PDF nativo

### Problema actual

El PDF generado usa `html2canvas` — una captura de pantalla del DOM de React — lo que produce:
- Texto superpuesto e ilegible (elementos de UI se renderizan encima de otros)
- Íconos SVG de Lucide que no se capturan correctamente
- Controles de UI visibles (filtros, dropdowns, badges de color) que no pertenecen al PDF
- Solo 1 página sin paginación correcta, con todo comprimido
- Sin look profesional corporativo (header/footer, fuentes, colores de marca)

### Solución: Documento React PDF nativo

Crear un documento `@react-pdf/renderer` dedicado para el análisis de clientes, usando el mismo design system que ya existe para Incidentes e Histórico.

---

### Archivos a crear

**1. `src/components/executive/pdf/ClientAnalyticsPDFDocument.tsx`**

Documento principal que recibe los datos ya calculados por los hooks existentes y los presenta con el design system PDF:

- **Página 1 – Dashboard Resumen**: KPIRow con los 4 champions (Mejor AOV, Más Servicios, Mayor GMV, Mejor Cumplimiento) + tabla Top 15 clientes con columnas: Cliente, Servicios, GMV, AOV, Cumplimiento, Crecimiento GMV, Días sin servicio
- **Página 2 (si hay cliente seleccionado) – Detalle Individual**: Secciones de Actividad Temporal, Tendencia Mensual (tabla con meses), Tipos de Servicio y Performance por Custodio

**2. `src/components/executive/pdf/ClientAnalyticsPDFExporter.ts`**

Función async `exportClientAnalyticsPDF(data, clientName?)` que:
1. Importa dinámicamente `@react-pdf/renderer`
2. Recibe `clientMetrics` + `tableData` ya calculados
3. Carga el logo con `loadImageAsBase64`
4. Genera el blob y dispara la descarga

---

### Archivo a modificar

**`src/components/executive/ClientAnalytics.tsx`**

- Cambiar `handleDownloadPDF` para llamar a la nueva función `exportClientAnalyticsPDF` en lugar de `exportClientAnalyticsToPDF`
- Pasar los datos ya disponibles en memoria (`clientMetrics`, `tableData`, `clientAnalytics`) — sin queries adicionales

---

### Estructura del PDF resultante

**Vista Dashboard (sin cliente seleccionado):**

```text
┌─────────────────────────────────────────────┐
│ DETECTA logo │ ANÁLISIS DE CLIENTES  │ MTD  │
├─────────────────────────────────────────────┤
│ KPI Champions: Mejor AOV | Más Servicios    │
│              Mayor GMV | Mejor Cumplimiento  │
├─────────────────────────────────────────────┤
│ Top 15 Clientes por GMV                     │
│ ┌──────┬─────┬────────┬─────┬──────┬──────┐│
│ │Cliente│Svc  │  GMV   │ AOV │Cumpl.│ΔGrow.││
│ │...    │     │        │     │      │      ││
│ └──────┴─────┴────────┴─────┴──────┴──────┘│
│                                             │
│ Análisis Foráneo vs Local                   │
│ [Tabla 2 filas]                             │
└─────────────────────────────────────────────┘
│ Confidencial │  Generado: 17/02/2026  Pág 1 │
```

**Vista Detalle (con cliente seleccionado):**
- Página 1: KPIs individuales + Actividad Temporal + Tipos de Servicio
- Página 2: Tendencia Mensual (12 meses) + Performance por Custodio

---

### Datos que se pasan al documento (sin nuevas queries)

| Fuente | Hook | Datos usados |
|--------|------|--------------|
| Dashboard metrics | `clientMetrics` (ya cargado) | topAOV, mostServices, highestGMV, bestCompletion, serviceTypeAnalysis |
| Tabla de clientes | `tableData` (ya cargado) | Top 15: clientName, currentGMV, currentServices, currentAOV, completionRate, gmvGrowth, daysSinceLastService |
| Detalle individual | `clientAnalytics` (ya cargado) | monthlyTrend, serviceTypes, custodianPerformance |

---

### Resultado esperado

- PDF de 1-2 páginas A4 con header/footer corporativo rojo-negro
- Tipografía Inter coherente con el resto de reportes
- Tabla de clientes con columnas bien alineadas, striped, sin superposición
- KPI cards con acento de color por categoría
- Sin elementos de UI (botones, filtros, dropdowns) visibles en el PDF
