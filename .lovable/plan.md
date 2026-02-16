

# Migrar Reporte Historico a react-pdf/renderer (excluir SIERCP)

## Resumen

Migrar las 1,268 lineas de `historicalReportPdfExporter.ts` (jsPDF con coordenadas manuales) a componentes React declarativos usando el design system de `@react-pdf/renderer` ya existente. El reporte SIERCP se mantiene sin cambios.

## Por que NO migrar SIERCP

El reporte SIERCP usa una arquitectura completamente diferente que no es compatible con react-pdf:

- **Contenido dinamico de IA**: El texto del informe lo genera una IA y se renderiza como HTML rico con componentes React (Recharts, gauges, barras de progreso con colores Tailwind)
- **Captura visual**: Usa `html2canvas` para capturar el render exacto del DOM incluyendo SVGs complejos de Recharts
- **Limitaciones de react-pdf**: No soporta SVG arbitrario, ni Tailwind, ni componentes React del DOM. Habria que reconstruir desde cero cada gauge, chart y barra de progreso
- **Sistema probado**: El sistema actual ya fue optimizado (43MB a 1-3MB) con paginacion inteligente por secciones `data-pdf-section`

Conclusion: migrar SIERCP no aporta valor y conlleva riesgo alto de regresion visual.

## Arquitectura de la migracion

Se creara un directorio `src/components/reports/pdf/` con componentes modulares que reutilizan el design system de `src/components/pdf/`.

### Estructura de archivos nuevos

```text
src/components/reports/pdf/
  HistoricalReportDocument.tsx   -- Componente raiz <Document> que orquesta todas las paginas
  HistoricalCoverPage.tsx        -- Portada usando CoverPage del design system
  HistoricalExecutiveSummary.tsx -- KPIs + highlights con KPIRow del design system
  HistoricalTableOfContents.tsx  -- Indice con numeracion
  sections/
    CPASection.tsx               -- Seccion CPA con FieldGroup + DataTable
    LTVSection.tsx               -- Seccion LTV
    RetentionSection.tsx         -- Seccion Retencion + matriz de cohortes con heatmap
    EngagementSection.tsx        -- Seccion Engagement
    SupplyGrowthSection.tsx      -- Seccion Crecimiento
    ConversionSection.tsx        -- Seccion Conversion
    CapacitySection.tsx          -- Seccion Capacidad Operativa
    OperationalSection.tsx       -- Seccion Operacional con top custodios/clientes
    ProjectionsSection.tsx       -- Seccion Proyecciones
    ClientsSection.tsx           -- Seccion Analisis de Clientes
```

### Archivo modificado

```text
src/utils/historicalReportPdfExporter.ts
  -- Se reescribe completamente
  -- Mantiene la misma firma: exportHistoricalReportToPDF(config, data)
  -- Usa import dinamico de @react-pdf/renderer
  -- Genera blob con pdf(<HistoricalReportDocument />) y descarga
```

## Mapeo de componentes jsPDF a design system

| jsPDF actual | Componente react-pdf |
|---|---|
| `renderCoverPage()` con coordenadas X/Y | `CoverPage` del design system (accent bars, metadata box) |
| `renderExecutiveSummary()` KPI cards manuales | `KPIRow` del design system |
| `addTable()` con row colors manuales | `DataTable` del design system (striped, flexible columns) |
| `addSectionTitle()` con accent bar | `SectionHeader` del design system |
| `addKeyValue()` label/value pairs | `FieldRow` y `FieldGroup` del design system |
| `addPageHeader()` / `addPageFooter()` | `ReportPage` (incluye ReportHeader + ReportFooter automaticos) |
| `checkNewPage()` calculo manual | `wrap` automatico de react-pdf |

## Detalle tecnico por componente

### 1. HistoricalReportDocument.tsx

Componente raiz que recibe `{ config, data }` y renderiza condicionalmente cada seccion segun `config.modules`. Estructura:

```text
<Document>
  <HistoricalCoverPage config={config} data={data} />
  <HistoricalExecutiveSummary data={data} />
  <HistoricalTableOfContents config={config} />
  {config.modules.map(module => <ModuleSection />)}
</Document>
```

### 2. HistoricalCoverPage.tsx

Usa el componente `CoverPage` existente del design system, pasando:
- title: "Informe Historico"
- subtitle: "Detallado"
- period: `data.periodLabel`
- metadata: fecha, modulos incluidos, granularidad, clasificacion

### 3. HistoricalExecutiveSummary.tsx

Pagina dedicada con:
- Titulo "Resumen Ejecutivo" usando `SectionHeader`
- KPIs en grid usando `KPIRow` (CPA, LTV, ratio, retencion, GMV, AOV, servicios, clientes)
- Seccion "Highlights" con indicadores de color (circulos verde/rojo + texto)

### 4. Secciones de contenido (CPASection, LTVSection, etc.)

Cada seccion sigue el mismo patron:
- Se envuelve en `ReportPage` para header/footer automaticos
- Usa `SectionHeader` para el titulo
- Usa `FieldGroup` para pares label/valor (acumulados, metricas)
- Usa `DataTable` para tablas mensuales/trimestrales

### 5. RetentionSection -- Caso especial: Matriz de cohortes

La matriz de cohortes requiere un componente custom `CohortHeatmap` que renderiza celdas con colores condicionales:
- Verde (>=80%): `PDF_COLORS.success`
- Amarillo (60-79%): `PDF_COLORS.warning`
- Rojo (<60%): `PDF_COLORS.danger`

Se implementa con `View` + `Text` usando background colors condicionales por celda.

### 6. ClientsSection -- Caso especial: Caja de concentracion

Una `View` con borde y fondo sutil que muestra metricas de concentracion HHI, porcentaje top 5% y top 10%. Similar a como lo hace actualmente pero con Flexbox.

### 7. Exportador reescrito

```text
exportHistoricalReportToPDF(config, data):
  1. import dinamico de @react-pdf/renderer y HistoricalReportDocument
  2. React.createElement(HistoricalReportDocument, { config, data })
  3. pdf(doc).toBlob()
  4. Crear URL, descargar, revocar
  5. Retornar true/false
```

## Utilidades de formato

Las funciones `formatCurrency`, `formatNumber`, `formatPercent` se mueven a un archivo compartido `src/components/reports/pdf/formatUtils.ts` para reutilizarlas en todas las secciones.

## Ventajas sobre la implementacion actual

- Elimina 1,268 lineas de coordenadas manuales X/Y
- Paginacion automatica (ya no hay `checkNewPage` manual)
- Fuente Inter con soporte completo de acentos y ene
- Texto seleccionable y copiable en el PDF
- Cada seccion es un componente React independiente, mas facil de mantener y testear
- Reutiliza 100% del design system ya creado (CoverPage, DataTable, KPIRow, etc.)

## Riesgos y mitigacion

- **Graficas**: El reporte historico actual NO tiene graficas (solo tablas y KPIs), por lo que no hay riesgo de incompatibilidad visual con react-pdf
- **Cohort heatmap**: Se implementa con Views y colores condicionales, no requiere SVG
- **Bundle size**: Import dinamico, igual que el de incidentes
- **Compatibilidad**: La firma publica `exportHistoricalReportToPDF(config, data)` no cambia

