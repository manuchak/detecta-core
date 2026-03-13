

# Rediseño Profesional del PDF "Reporte de Tiempos de Servicio"

## Problema Actual

El PDF actual es un documento de una sola página, texto plano, sin mapa, sin fotos, sin gráficos, y con formato básico. Julia (y los clientes) necesitan un informe profesional, visual y fácil de interpretar.

## Diseño Propuesto

Inspirado en reportes de empresas de logística y custody tracking (como Securitas, Brinks, TMS reports), el PDF tendrá un diseño de **4-5 páginas** con jerarquía visual clara.

### Estructura de Páginas

```text
┌─────────────────────────────────┐
│  PÁGINA 1: PORTADA              │
│  ─ Logo Detecta (full)          │
│  ─ "Informe de Servicio"        │
│  ─ Folio, Cliente, Ruta         │
│  ─ Fecha, Custodio              │
│  ─ Barras de acento rojo/negro  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  PÁGINA 2: RESUMEN EJECUTIVO    │
│  ─ Header con isotipo           │
│  ─ 4 KPI cards: ΔOrigen,       │
│    ΔDestino, ΔTotal, Eventos    │
│  ─ Tabla "Hitos del Servicio"   │
│    (Cita → Inicio → Llegada    │
│     → Liberación con timestamps)│
│  ─ Gráfico horizontal bars:    │
│    duración por tipo de parada  │
│  ─ Insight box con alertas      │
│    (si ΔTotal > 60 min, etc.)   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  PÁGINA 3: MAPA DE RUTA         │
│  ─ Mapbox Static API image      │
│    (ruta completa con markers)  │
│  ─ Leyenda de marcadores        │
│  ─ Datos de distancia/duración  │
│    (si traza disponible)        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  PÁGINAS 4+: CRONOLOGÍA         │
│  ─ Timeline vertical estilizada │
│  ─ Cada evento con wrap={false} │
│    para evitar cortes           │
│  ─ Fotos embebidas inline      │
│    (cargadas como base64)       │
│  ─ Coordenadas y ubicación     │
│  ─ Duración de paradas         │
└─────────────────────────────────┘
```

### Detalle de Implementación

**1. Portada** — Reusar `CoverPage` existente con metadata del servicio (Folio, Cliente, Custodio, Origen → Destino, Fecha).

**2. Resumen Ejecutivo** — Reusar `ReportPage`, `KPIRow`, `DataTable`, `PDFHorizontalBarChart`, `InsightBox`. KPIs con colores semánticos (verde si ΔOrigen < 15min, rojo si > 30min).

**3. Mapa Estático** — Usar Mapbox Static Images API (`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/...`) con los puntos de los eventos como markers y un path con las coordenadas. Se carga como base64 antes de renderizar. Página completa dedicada al mapa.

**4. Cronología** — Rediseño visual: barra lateral de color por tipo de evento, foto embebida (max 2 por fila), `wrap={false}` por evento para evitar cortes entre páginas. Fotos cargadas como base64 previo al render.

### Cambios Técnicos

**Archivo modificado:** `src/components/monitoring/tiempos/ServiceDetailPDF.tsx`

- Reescritura completa del componente `ServiceTimePDF` como `ServiceTimeReportDocument` (multi-página)
- Actualización de `ServiceDetailPDFButton` para:
  - Cargar logos (isotipo + full) como base64
  - Cargar todas las fotos de eventos como base64
  - Generar imagen de mapa estático via Mapbox Static API
  - Obtener token de Mapbox desde la misma fuente que el mapa interactivo (`initializeMapboxToken`)

**No se crean archivos nuevos** — todo se mantiene en el archivo existente, usando los componentes del design system (`@/components/pdf`).

### Manejo de Saltos de Página

- Cada evento en cronología usa `wrap={false}` (ya implementado)
- Fotos agrupadas con su evento padre (no se separan)
- Secciones con `break` entre páginas lógicas (Resumen → Mapa → Cronología)
- El mapa va en su propia página para garantizar tamaño completo

