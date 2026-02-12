

## Plan: Optimizar peso y paginacion del PDF SIERCP

### Problemas identificados

**1. Tamaño excesivo (43 MB)**
- `html2canvas` con `scale: 2` genera un canvas enorme
- `canvas.toDataURL('image/png')` produce datos PNG sin compresion significativa
- Se usa el mismo canvas gigante para todas las paginas (la imagen completa se repite en cada `addImage`)

**2. Cortes de parrafos**
- El metodo actual renderiza TODO el informe como una sola imagen grande
- Luego la corta en franjas de altura fija sin respetar limites de seccion
- El resultado son parrafos, tablas y graficos cortados a mitad

### Solucion: Renderizado por secciones

En vez de capturar todo el reporte como una imagen unica y rebanarla, se capturara cada seccion logica del informe por separado. Luego se colocaran en el PDF respetando los limites de pagina: si una seccion no cabe en el espacio restante, se mueve a la siguiente pagina.

### Cambios

#### 1. SIERCPPrintableReport.tsx - Marcar secciones con data attributes

Agregar `data-pdf-section` a cada bloque logico del informe para que el exportador pueda identificarlos:
- Hero/Cover
- Radar + Resumen Ejecutivo
- Analisis por Modulo (cada tarjeta como sub-seccion)
- Factores de Riesgo
- Factores de Proteccion
- Recomendaciones
- Areas de Seguimiento
- Conclusion
- Disclaimer

#### 2. SIERCPReportDialog.tsx - Reescribir handleDownloadPDF

Nuevo algoritmo:
1. Buscar todos los elementos con `[data-pdf-section]` dentro del reporte
2. Para cada seccion, renderizar con `html2canvas` usando `scale: 1.5` (suficiente calidad, menos peso)
3. Convertir a JPEG en vez de PNG (`canvas.toDataURL('image/jpeg', 0.85)`) - reduce 5-10x el tamaño
4. Colocar cada imagen en el PDF: si no cabe en el espacio restante de la pagina actual, crear nueva pagina
5. Resultado: secciones completas sin cortes, archivo de 1-3 MB

```
Flujo por seccion:
  for each section in reportSections:
    canvas = html2canvas(section, { scale: 1.5 })
    imgData = canvas.toDataURL('image/jpeg', 0.85)
    sectionHeight = (canvas.height * usableWidth) / canvas.width
    
    if (currentY + sectionHeight > pageBottom):
      pdf.addPage()
      currentY = marginTop
    
    pdf.addImage(imgData, 'JPEG', marginLeft, currentY, usableWidth, sectionHeight)
    currentY += sectionHeight + gap
```

### Impacto esperado

| Metrica | Antes | Despues |
|---|---|---|
| Tamaño archivo | ~43 MB | ~1-3 MB |
| Cortes de parrafo | Frecuentes | Ninguno |
| Formato imagen | PNG sin comprimir | JPEG 85% |
| Escala canvas | 2x | 1.5x |
| Metodo de paginacion | Rebanado ciego | Por seccion logica |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/evaluation/SIERCPPrintableReport.tsx` | Agregar `data-pdf-section` a cada bloque logico |
| `src/components/recruitment/psychometrics/SIERCPReportDialog.tsx` | Reescribir `handleDownloadPDF` con renderizado por secciones y JPEG |

