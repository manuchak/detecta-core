

# Auditoría completa de PDFs — Logos y diseño

## Inventario de PDFs en el proyecto

| # | PDF | Método | Logo actual | Problemas |
|---|-----|--------|-------------|-----------|
| 1 | **Reporte de Incidente** | `@react-pdf/renderer` | ✅ Isotipo (corregido) | Ninguno tras fix anterior |
| 2 | **Informe Histórico** | `@react-pdf/renderer` | ✅ Isotipo headers + Logo full cover (corregido) | Ninguno tras fix anterior |
| 3 | **Client Analytics** | `@react-pdf/renderer` | ✅ Isotipo headers + Logo full cover (corregido) | Ninguno tras fix anterior |
| 4 | **Acta de Cambio de Turno** | `@react-pdf/renderer` | ⚠️ No carga logo — `ShiftHandoffDialog` no pasa `logoBase64` al `HandoffActaPDF` | Sin logo, sin `registerPDFFonts()`, error silencioso |
| 5 | **Certificado LMS** (CertificadoViewer) | `@react-pdf/renderer` | ❌ Carga `/lovable-uploads/detecta-logo.png` (ruta inexistente) | Logo roto, debería usar logo full |
| 6 | **Certificado LMS** (CertificadoPlantillaViewer) | `@react-pdf/renderer` | ❌ Carga `/lovable-uploads/detecta-logo.png` (ruta inexistente) | Logo roto, debería usar logo full |
| 7 | **Análisis de Ruta** | `@react-pdf/renderer` | ❌ No pasa `logoBase64` al `RouteAnalysisReport` | Headers sin logo |
| 8 | **SIERCP Psicométrico** | `jsPDF` + `html2canvas` | ❌ Sin logo corporativo | Captura HTML, sin diseño corporativo |
| 9 | **Estado de Cuenta** | `jsPDF` manual | ❌ Sin logo corporativo | Usa Helvetica, sin marca Detecta |

## Cambios propuestos

### Grupo A — PDFs con `@react-pdf/renderer` (corrección de logos)

**4. ShiftHandoffDialog.tsx**
- Importar `loadImageAsBase64` y `registerPDFFonts`
- Cargar isotipo como base64 antes de generar
- Pasar `logoBase64` al `HandoffActaPDF`
- Agregar `toast.error()` en el catch

**5-6. CertificadoViewer.tsx y CertificadoPlantillaViewer.tsx**
- Cambiar ruta de `/lovable-uploads/detecta-logo.png` → `/detecta-logo-full.png` (el certificado es un documento de portada, usa logo completo)

**7. RouteRiskIntelligence.tsx**
- Cargar isotipo base64 antes de generar PDF
- Pasar `logoBase64` al `<RouteAnalysisReport>`

### Grupo B — PDFs con `jsPDF` (agregar logo y marca)

**8. SIERCPReportDialog.tsx**
- Este usa `html2canvas` para capturar el reporte renderizado en pantalla — el logo depende del HTML visible, no del PDF. Sin cambios requeridos a menos que se quiera rediseñar completamente.

**9. EstadoCuentaModal.tsx**
- Cargar isotipo como imagen y agregarlo al header del `jsPDF` con `doc.addImage()`
- Agregar línea roja decorativa debajo del header (consistente con diseño corporativo)
- Usar colores corporativos (`#191919`, `#EB0000`) en lugar de grises genéricos

## Archivos a modificar

1. `src/components/monitoring/bitacora/ShiftHandoffDialog.tsx` — cargar logo + registerPDFFonts + toast.error
2. `src/components/lms/certificados/CertificadoViewer.tsx` — corregir ruta logo
3. `src/components/lms/CertificadoPlantillaViewer.tsx` — corregir ruta logo
4. `src/components/security/routes/RouteRiskIntelligence.tsx` — cargar y pasar logo
5. `src/pages/Facturacion/components/CuentasPorCobrar/EstadoCuentaModal.tsx` — agregar logo + marca corporativa

