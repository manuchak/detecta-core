

# Migracion de IncidentPDFExporter a @react-pdf/renderer

## Resumen

Reemplazar la generacion manual con coordenadas X/Y de jsPDF por componentes React declarativos usando `@react-pdf/renderer`. Esto resuelve de raiz los problemas de encoding Unicode (acentos, bullets), permite tipografia profesional con fuentes Google (Inter), y simplifica drasticamente el mantenimiento del layout con Flexbox en lugar de posicionamiento absoluto.

## Dependencia nueva

- `@react-pdf/renderer` - Libreria que permite definir PDFs como componentes React con JSX y estilos CSS-like (Flexbox).

## Arquitectura

Se creara un directorio `src/components/monitoring/incidents/pdf/` con componentes React modulares que representan cada seccion del PDF. El archivo `IncidentPDFExporter.ts` se reescribira para usar la funcion `pdf()` de react-pdf que genera un Blob y lo descarga.

### Estructura de archivos nuevos

```text
src/components/monitoring/incidents/pdf/
  IncidentPDFDocument.tsx    -- Componente raiz <Document>
  PDFHeader.tsx              -- Barra roja superior con logo + titulo
  PDFExecutiveSummary.tsx    -- Caja con 5 columnas (tipo, severidad, etc)
  PDFGeneralData.tsx         -- Seccion 1: datos generales
  PDFLinkedService.tsx       -- Seccion 2: servicio vinculado
  PDFTimeline.tsx            -- Seccion 3: cronologia con imagenes
  PDFControls.tsx            -- Seccion 4: controles y atribucion
  PDFResolution.tsx          -- Seccion 5: resolucion
  PDFSignatures.tsx          -- Seccion 6: firmas digitales
  PDFFooter.tsx              -- Pie de pagina con numero y fecha
  pdfStyles.ts               -- StyleSheet compartido (colores, fuentes, espaciado)
  fontSetup.ts               -- Registro de fuente Inter desde CDN de Google Fonts
```

### Archivo modificado

```text
src/components/monitoring/incidents/IncidentPDFExporter.ts
  -- Se reescribe para usar pdf(<IncidentPDFDocument />) de @react-pdf/renderer
  -- Mantiene la misma firma: exportIncidentePDF({ incidente, cronologia, servicio })
  -- La pre-carga de imagenes como base64 se mantiene (react-pdf necesita base64 o URL)
  -- El nombre del archivo generado no cambia
```

## Detalle tecnico

### 1. Registro de fuente Inter (`fontSetup.ts`)

Se registrara la fuente Inter desde Google Fonts CDN para tener soporte completo de acentos, ene, y caracteres especiales. Esto elimina la necesidad de `sanitizeForPDF()`.

```text
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/...400.ttf' },
    { src: 'https://fonts.gstatic.com/s/inter/v18/...700.ttf', fontWeight: 700 },
  ]
})
```

### 2. Estilos compartidos (`pdfStyles.ts`)

Constantes de colores corporativos (rojo #EB0000, negro #191919, gris #646464) y un `StyleSheet.create()` con estilos base reutilizables: `page`, `sectionHeader`, `fieldRow`, `label`, `value`, etc.

### 3. Componente raiz (`IncidentPDFDocument.tsx`)

Recibe las props `{ incidente, cronologia, servicio, logoBase64, imageCache }` y compone todas las secciones en un `<Document>`. Usa `<Page size="A4" style={styles.page}>` con `wrap` habilitado para paginacion automatica. Cada seccion es un componente independiente.

### 4. Header (`PDFHeader.tsx`)

Barra roja con el logo (via `<Image src={logoBase64} />`) y el texto "REPORTE DE INCIDENTE OPERATIVO" en blanco. Se renderiza como `fixed` para que aparezca en cada pagina.

### 5. Resumen Ejecutivo (`PDFExecutiveSummary.tsx`)

Caja con fondo gris claro, 5 columnas en Flexbox (flexDirection: 'row'). Cada columna muestra label arriba y valor abajo. La severidad incluye un circulo de color usando `<View>` con `borderRadius: 50%`.

### 6. Datos Generales (`PDFGeneralData.tsx`)

Grid de 2 columnas con label en gris bold y valor en negro. Soporta acentos nativamente gracias a la fuente Inter. La descripcion se renderiza como parrafo con wrap automatico.

### 7. Cronologia (`PDFTimeline.tsx`)

Cada entrada tiene:
- Circulo rojo (`<View>` con borderRadius) + timestamp en rojo + tipo en gris
- Descripcion como parrafo
- Ubicacion en italica si existe
- Imagen de evidencia via `<Image src={base64} />` con borde gris y tamano 60x45mm equivalente en puntos

La paginacion es automatica: react-pdf parte las entradas entre paginas sin cortar elementos marcados con `wrap={false}`.

### 8. Controles (`PDFControls.tsx`)

Lista de controles activos y flag de control efectivo.

### 9. Resolucion (`PDFResolution.tsx`)

Fecha de resolucion y notas. Solo se renderiza si hay datos.

### 10. Firmas Digitales (`PDFSignatures.tsx`)

Renderiza las imagenes base64 de firma como `<Image>` con tamano fijo, acompanadas del email y timestamp. Muestra firma de creacion y de cierre si existen.

### 11. Footer (`PDFFooter.tsx`)

Se renderiza como `fixed` en la parte inferior de cada pagina. Muestra "Documento confidencial", fecha de generacion, y numero de pagina usando `render={({ pageNumber, totalPages }) => ...}`.

### 12. Exportador (`IncidentPDFExporter.ts`)

La funcion `exportIncidentePDF` se reescribe:

```text
1. Pre-cargar logo como base64 (igual que ahora)
2. Pre-cargar imagenes de cronologia como base64 (igual que ahora)
3. Llamar pdf(<IncidentPDFDocument {...props} />).toBlob()
4. Crear URL del blob y descargar con link.click()
5. Revocar URL
```

La firma publica `exportIncidentePDF({ incidente, cronologia, servicio })` no cambia, por lo que todos los call sites existentes siguen funcionando sin modificaciones.

## Ventajas de la migracion

- Soporte nativo de Unicode: acentos, ene, caracteres especiales sin sanitizacion
- Paginacion automatica: react-pdf maneja saltos de pagina sin calculos manuales
- Layout declarativo: Flexbox en lugar de coordenadas X/Y
- Tipografia profesional: fuente Inter en lugar de Helvetica limitada
- Mantenibilidad: cada seccion es un componente React independiente y testeable
- Texto seleccionable: el PDF genera texto vectorial, no imagenes

## Riesgos y mitigacion

- **Tamano del bundle**: `@react-pdf/renderer` agrega ~200KB. Mitigacion: se importa dinamicamente solo cuando se genera PDF.
- **Carga de fuentes**: la fuente Inter se descarga desde CDN la primera vez. Mitigacion: se cachea en el navegador.
- **Imagenes CORS**: se mantiene la pre-carga de imagenes como base64 (ya implementada).

