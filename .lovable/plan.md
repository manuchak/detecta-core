

# Incorporar activos de marca Detecta y regla de uso

## Activos actuales
- `src/assets/detecta-logo.png` — logo actual (usado en landing y PDF de incidentes)
- `public/detecta-logo.png` — logo actual (usado en PDFs históricos, analytics, etc.)

## Activos nuevos a incorporar
1. **Isotipo** (`Isotipo_1.png`) — el símbolo circular gris/rojo, ideal para headers de PDF, favicons, espacios reducidos
2. **Logo completo fondo blanco** (`Detecta1_1-2.png`) — wordmark completo, para portadas de PDF, documentación

## Cambios propuestos

### 1. Copiar activos al proyecto
- `user-uploads://Isotipo_1.png` → `src/assets/detecta-isotipo.png`
- `user-uploads://Detecta1_1-2.png` → `src/assets/detecta-logo-full.png`
- También copiar a `public/` para los exportadores que usan rutas estáticas

### 2. Actualizar PDFs para usar los activos correctos
- **Portadas (`CoverPage`)**: usar el logo completo (`detecta-logo-full.png`) — más impacto visual
- **Headers de página (`ReportHeader`)**: usar el isotipo (`detecta-isotipo.png`) — compacto, no se deforma en 28px de alto
- Actualizar las referencias en los exportadores (`historicalReportPdfExporter.ts`, `ClientAnalyticsPDFExporter.ts`, `IncidentPDFExporter.ts`)

### 3. Regla de marca (documentación interna)
Crear nota en `.lovable/rules.md` con la regla:
- Isotipo: usar en espacios reducidos (headers PDF, sidebar, favicon)
- Logo completo: usar en portadas, documentación, landing
- **Nunca deformar** — solo escalar proporcionalmente (`objectFit: 'contain'`, sin width+height fijos que alteren proporción)

## Archivos a modificar
- Copiar 2 archivos de uploads → `src/assets/` y `public/`
- `src/components/pdf/ReportHeader.tsx` — sin cambios de lógica, solo documentar regla de proporción
- `src/components/pdf/CoverPage.tsx` — documentar regla de proporción
- `.lovable/rules.md` — agregar regla de marca sobre logos

