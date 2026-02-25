

# Rediseno del Certificado: Vista en App + PDF Nativo

## Problema

El certificado actual tiene dos problemas criticos:

1. **Vista en la app**: Muestra texto plano sin formato ("Certificado de Finalizacion / admin / Certificado Estandar..."). No transmite ningun sentido de logro ni celebracion.
2. **PDF descargable**: Usa `html2canvas + jsPDF` (screenshot del HTML), lo cual genera PDFs de baja calidad. No aprovecha el sistema de diseno PDF nativo (`@react-pdf/renderer`) que ya existe en el proyecto.

## Solucion

### 1. Nuevo componente de vista en app (`CertificadoPlantillaViewer.tsx`)

Redisenar completamente la preview del certificado dentro del curso para que transmita logro:

- **Fondo con gradiente** dorado/ambar sutil que evoque "diploma"
- **Borde decorativo** doble con color dorado
- **Icono de trofeo/medalla** prominente en la parte superior con animacion de entrada
- **Nombre del alumno** en tipografia grande serif/cursiva
- **Titulo del curso** destacado con comillas tipograficas
- **Sello circular** con el logo de Detecta y borde dorado
- **Datos complementarios** (calificacion, fecha, codigo) en layout elegante
- **Mensaje de felicitacion** motivacional en la parte superior
- **Confetti o estrellas decorativas** sutiles en el fondo

### 2. Nuevo documento PDF nativo (`CertificatePDFDocument.tsx`)

Crear un componente `@react-pdf/renderer` que genere un PDF profesional:

- Reutilizar tokens del sistema de diseno (`PDF_COLORS`, `PDF_FONT_SIZES`, `registerPDFFonts`)
- Pagina unica landscape con diseno de diploma
- Barra decorativa roja superior e inferior (estilo CoverPage)
- Logo corporativo centrado en la parte superior
- Titulo "CERTIFICADO DE FINALIZACION" en tipografia display
- Nombre del alumno en tipografia hero
- Detalle del curso, calificacion y fecha
- Sello decorativo SVG nativo (circulo con borde + icono)
- Codigo de verificacion en fuente monoespaciada
- Firma institucional

### 3. Actualizar descarga PDF (`CertificadoPlantillaViewer.tsx`)

Reemplazar el flujo `html2canvas + jsPDF` por:
```
import(@react-pdf/renderer).pdf(CertificatePDFDocument).toBlob()
```
Mismo patron usado en `historicalReportPdfExporter.ts`.

### 4. Actualizar `CertificadoViewer.tsx` (dialogo de "Mis Certificados")

Actualizar el viewer del dialogo para que tambien use el nuevo diseno visual en lugar del layout basico actual. Reemplazar la impresion via `window.open` por descarga PDF nativa.

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/components/lms/pdf/CertificatePDFDocument.tsx` | **Crear** - Documento PDF nativo con react-pdf |
| `src/components/lms/CertificadoPlantillaViewer.tsx` | **Modificar** - Redisenar vista in-app + migrar descarga a react-pdf |
| `src/components/lms/certificados/CertificadoViewer.tsx` | **Modificar** - Redisenar dialogo + migrar impresion a descarga PDF nativa |

## Diseno visual detallado

### Vista in-app (CertificadoPlantillaViewer)
```text
+--------------------------------------------------+
|  *** Felicidades! ***                             |
|  Has completado exitosamente este modulo          |
|                                                   |
| +----------------------------------------------+ |
| |  =========================================   | |
| |  ||                                     ||   | |
| |  ||         [Logo Detecta]              ||   | |
| |  ||                                     ||   | |
| |  ||    CERTIFICADO DE FINALIZACION      ||   | |
| |  ||    ─────────────────────────        ||   | |
| |  ||    Se certifica que                 ||   | |
| |  ||                                     ||   | |
| |  ||      Juan Perez Garcia             ||   | |
| |  ||     (tipografia grande serif)       ||   | |
| |  ||                                     ||   | |
| |  ||  ha completado satisfactoriamente   ||   | |
| |  ||  "Seguridad Logistica Integral"     ||   | |
| |  ||                                     ||   | |
| |  ||  Calificacion: 100%  |  25/02/2026  ||   | |
| |  ||                                     ||   | |
| |  ||         [Sello circular]            ||   | |
| |  ||    Codigo: 07FA761B                 ||   | |
| |  =========================================   | |
| +----------------------------------------------+ |
|                                                   |
|  [Descargar PDF]  [Marcar como visto / Continuar] |
+--------------------------------------------------+
```

### PDF nativo (landscape A4)
- Barras decorativas roja/negra superior e inferior (estilo CoverPage existente)
- Fondo blanco con borde decorativo gris claro
- Logo corporativo centrado
- Tipografia Poppins (ya registrada en el sistema)
- Circulo decorativo SVG como sello
- Layout centrado vertical y horizontalmente

## Orden de implementacion

1. Crear `CertificatePDFDocument.tsx` (PDF nativo)
2. Redisenar `CertificadoPlantillaViewer.tsx` (vista in-app + descarga)
3. Actualizar `CertificadoViewer.tsx` (dialogo)

