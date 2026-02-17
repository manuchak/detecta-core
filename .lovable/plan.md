

## Rediseno del Informe Historico PDF - Vision de Diseno Ejecutivo

### Diagnostico del estado actual

El informe actual tiene 14 paginas de contenido puramente textual: listas de campos y tablas sin diferenciacion visual. Los problemas principales son:

| Problema | Impacto |
|----------|---------|
| Sin graficos | Existe una libreria completa de charts SVG nativos (Bar, Line, Pie, Gauge, Stacked) que NINGUNA seccion utiliza |
| Sin logo | El header tiene espacio para logo pero nunca se pasa `logoBase64` |
| Tipografia Inter | Se registro Inter pero no Poppins (la fuente corporativa) |
| Cover page plana | Solo texto centrado con barras rojas delgadas, sin personalidad |
| Patron repetitivo | Todas las secciones son identicas: SectionHeader gris + FieldGroup + DataTable |
| Sin jerarquia visual | No hay KPI cards destacados, ni acentos de color, ni separadores |
| Header monotono | Barra gris plana sin acento de marca |

### Vision de rediseno

Transformar cada seccion para combinar datos tabulares con visualizaciones que ya existen en el design system, agregar la tipografia Poppins, incorporar el logo, y crear jerarquia visual profesional.

---

### 1. Tipografia: Migrar de Inter a Poppins

**Archivo:** `src/components/pdf/fontSetup.ts`

Registrar la fuente Poppins (Google Fonts) con pesos 400, 600 y 700 en lugar de Inter. Actualizar la referencia en `styles.ts` para que `fontFamily` sea `'Poppins'`.

---

### 2. Logo corporativo en el header

**Archivos:** `src/components/pdf/utils.ts`, `src/components/reports/pdf/HistoricalReportDocument.tsx`, `ReportPage`

- Crear una constante con el logo de Detecta como base64 (o usar `loadImageAsBase64` que ya existe en utils.ts para cargarlo desde una URL publica).
- Pasar `logoBase64` a todos los `<ReportPage>` y al `<CoverPage>`.

---

### 3. Rediseno del Cover Page

**Archivo:** `src/components/pdf/CoverPage.tsx`

Cambios:
- Barra superior roja de 8pt a 6pt con gradiente visual (dos bloques: rojo + negro)
- Logo grande centrado (120px de alto)
- Titulo con Poppins 36pt bold, subtitulo 28pt
- Periodo en rojo 24pt con linea decorativa debajo
- Caja de metadata con borde izquierdo rojo (accent bar) en lugar de borde completo
- Linea separadora sutil entre titulo y metadata

---

### 4. Header de paginas internas mejorado

**Archivo:** `src/components/pdf/ReportHeader.tsx`

- Agregar una linea roja delgada (2pt) debajo del header gris como acento de marca
- Logo siempre visible a la izquierda

---

### 5. Seccion Ejecutiva con KPIs visuales

**Archivo:** `src/components/reports/pdf/HistoricalExecutiveSummary.tsx`

Cambios:
- KPI cards con borde izquierdo de color (rojo para financieros, verde para operativos)
- Agregar un `PDFHorizontalBarChart` mini comparando los KPIs principales (CPA vs LTV como ratio visual)
- Highlights con iconos de circulo mas grandes y mejor espaciado

---

### 6. Graficos por seccion (el cambio mas impactante)

Cada seccion recibira al menos una visualizacion usando los charts nativos que ya existen:

| Seccion | Grafico a agregar | Componente |
|---------|-------------------|------------|
| **CPA** | Barras verticales con CPA mensual | `PDFBarChart` con data de `monthlyEvolution` |
| **LTV** | Barras de LTV trimestral | `PDFBarChart` con `quarterlyData` |
| **Retencion** | Linea de tasa de retencion mensual | `PDFLineChart` con `monthlyBreakdown` |
| **Engagement** | Linea de engagement mensual | `PDFLineChart` con `monthlyEvolution` |
| **Supply Growth** | Barras apiladas: nuevos vs perdidos | `PDFStackedBarChart` con `monthlyData` |
| **Conversion** | Barras de tasa de conversion mensual | `PDFBarChart` con `monthlyBreakdown` |
| **Capacidad** | Gauge de utilizacion actual | `PDFGaugeChart` con `utilizationMetrics.current` |
| **Operacional** | Pie de distribucion de servicios (completados/cancelados/pendientes) + Barras horizontales top clientes | `PDFPieChart` + `PDFHorizontalBarChart` |
| **Proyecciones** | Linea con 2 series: forecast vs real | `PDFLineChart` con series forecast y real |
| **Clientes** | Pie de concentracion de ingresos (top 5 clientes vs resto) | `PDFPieChart` con donut |

---

### 7. Mejoras al DataTable

**Archivo:** `src/components/pdf/DataTable.tsx`

- Cabecera de tabla con fondo mas oscuro (#E5E5E5 a #191919 con texto blanco) para mayor contraste
- Numeros alineados a la derecha por defecto cuando el accessor devuelve formatos monetarios o porcentuales

---

### 8. Nuevo componente: InsightBox

**Archivo nuevo:** `src/components/pdf/InsightBox.tsx`

Caja con icono de circulo de color + texto de insight, para reemplazar los textos sueltos de "INSIGHT:" que aparecen en RetentionSection y dar consistencia.

---

### 9. Table of Contents mejorado

**Archivo:** `src/components/reports/pdf/HistoricalTableOfContents.tsx`

- Agregar numeracion con linea punteada hasta el numero de pagina (estilo indice clasico)
- Cada modulo con su icono/numero en circulo rojo (ya existe) pero con mejor espaciado y linea divisora entre items

---

### Secuencia de implementacion

| Paso | Archivos | Descripcion |
|------|----------|-------------|
| 1 | `fontSetup.ts`, `styles.ts` | Registrar Poppins, actualizar fontFamily global |
| 2 | `CoverPage.tsx`, `ReportHeader.tsx` | Redisenar cover + header con logo y acento rojo |
| 3 | `InsightBox.tsx` (nuevo), `index.ts` | Crear componente de insight reutilizable |
| 4 | `DataTable.tsx` | Header oscuro, alineacion numerica |
| 5 | `HistoricalExecutiveSummary.tsx` | KPIs con accent bars + mini chart |
| 6 | `CPASection.tsx` | Agregar PDFBarChart de CPA mensual |
| 7 | `LTVSection.tsx` | Agregar PDFBarChart de LTV trimestral |
| 8 | `RetentionSection.tsx` | Agregar PDFLineChart de tasa mensual |
| 9 | `EngagementSection.tsx` | Agregar PDFLineChart de engagement |
| 10 | `SupplyGrowthSection.tsx` | Agregar PDFStackedBarChart nuevos vs perdidos |
| 11 | `ConversionSection.tsx` | Agregar PDFBarChart de tasa conversion |
| 12 | `CapacitySection.tsx` | Agregar PDFGaugeChart de utilizacion |
| 13 | `OperationalSection.tsx` | Agregar PDFPieChart servicios + PDFHorizontalBarChart top clientes |
| 14 | `ProjectionsSection.tsx` | Agregar PDFLineChart forecast vs real (2 series) |
| 15 | `ClientsSection.tsx` | Agregar PDFPieChart donut de concentracion |
| 16 | `HistoricalTableOfContents.tsx` | Mejoras visuales al indice |
| 17 | `HistoricalReportDocument.tsx` | Pasar logoBase64 a todos los componentes |

### Resultado esperado

De un documento de 14 paginas plano y textual, a un informe ejecutivo con:
- 10+ graficos nativos SVG distribuidos en las secciones
- Tipografia Poppins profesional
- Logo corporativo en cada pagina
- Jerarquia visual clara con accent bars rojos
- Tablas con cabeceras de alto contraste
- Cover page con personalidad de marca
- Insights destacados en cajas dedicadas

