
## Plan: Corregir visualizacion del Informe SIERCP en pantalla e impresion

### Problema raiz

El CSS global en `index.css` tiene esta regla:

```css
@media screen {
  .print-content {
    display: none !important;
  }
}
```

El componente `SIERCPPrintableReport` usa la clase `print-content` en su div raiz. Esto hace que **todo el informe sea invisible en pantalla**. El dialog se abre pero el contenido no se ve.

Para impresion, el CSS busca `.print-content` como hijo directo de `body`, pero el reporte esta dentro de un portal de Radix Dialog (anidado profundamente en el DOM), por lo que tampoco se muestra al imprimir.

### Solucion

#### 1. SIERCPPrintableReport.tsx - Quitar la clase `print-content`

Reemplazar la clase `print-content` por una clase propia `siercp-report` que no tenga el `display: none` en pantalla. El informe debe ser visible dentro del dialog normalmente.

#### 2. SIERCPReportDialog.tsx - Mejorar la logica de impresion

En vez de usar `window.print()` directamente (que imprime toda la pagina incluyendo el overlay del dialog), implementar una estrategia que:
- Cree un iframe temporal o una ventana nueva solo con el contenido del reporte
- O bien, use CSS con `@media print` especifico para el dialog que oculte el overlay y muestre solo el contenido

La solucion mas limpia es abrir una ventana nueva con el HTML del reporte para imprimir, asi se evitan conflictos con el dialog y el layout de la app.

#### 3. index.css - Agregar estilos de impresion especificos para SIERCP

Agregar reglas `@media print` para la clase `.siercp-report` que aseguren renderizado correcto en la ventana de impresion.

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/components/evaluation/SIERCPPrintableReport.tsx` | Cambiar clase `print-content` por `siercp-report` en el div raiz |
| `src/components/recruitment/psychometrics/SIERCPReportDialog.tsx` | Refactorizar `handlePrint` para abrir una ventana nueva con el HTML del reporte y disparar impresion ahi. Agregar `ref` al contenedor del reporte |
| `src/index.css` | Agregar estilos `.siercp-report` para pantalla (visible) e impresion (optimizado para A4) |

### Flujo corregido desde la perspectiva del analista de planeacion

```
1. Analista navega a Pipeline > Evaluaciones > Invitaciones Candidatos
2. Ve la tabla con candidatos completados (score visible)
3. Hace click en el icono de "Ver resultado" (ExternalLink) en una fila completada
4. Se abre el dialog "Informe Profesional SIERCP"
5. Ve el loading "Generando informe profesional con IA..." (10-15 seg)
6. El informe aparece completo: score gauge, radar, modulos, factores, recomendaciones
7. Hace click en "Imprimir / PDF"
8. Se abre la ventana de impresion del navegador con el informe formateado en A4
9. Puede guardar como PDF o imprimir directamente
```

### Detalle tecnico de la impresion

La funcion `handlePrint` se refactorizara para:

```text
1. Obtener el innerHTML del contenedor del reporte via ref
2. Crear una ventana nueva (window.open)
3. Escribir un documento HTML completo con:
   - Los estilos necesarios (Tailwind base + estilos del reporte)
   - El HTML del reporte
4. Disparar window.print() en la ventana nueva
5. Cerrar la ventana despues de imprimir
```

Esto es mas robusto que intentar imprimir desde dentro del dialog de Radix, que inyecta overlays, transforms y z-index que interfieren con la impresion.
