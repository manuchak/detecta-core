
## Plan: Corregir impresion SIERCP y persistir navegacion en Evaluaciones

### Problema 1: Impresion del informe

El `handlePrint` actual usa `reportRef.current.innerHTML` para copiar el contenido del reporte a una ventana nueva. Esto tiene dos problemas:
- Los graficos SVG del `SIERCPRadarProfile` (Recharts) y `SIERCPScoreGauge` se copian como SVG inline, pero pierden los estilos computados y las transformaciones CSS (como `transform: rotate(-90deg)` del gauge)
- La recopilacion de CSS via `document.styleSheets` falla silenciosamente con hojas de estilo cross-origin (fuentes, CDNs), resultando en estilos incompletos
- El resultado es un informe impreso con graficos rotos o invisibles

**Solucion**: Usar `html2canvas` (ya instalado en el proyecto) para renderizar el reporte completo como imagen, y luego usar `jsPDF` (tambien instalado) para generar un PDF limpio. Esto captura los SVGs exactamente como se ven en pantalla.

Alternativa mas ligera: Mejorar la estrategia de ventana nueva asegurando que los SVGs se serialicen correctamente con `XMLSerializer` y que los estilos inline se preserven. Ademas, agregar un pequeno delay para que la ventana nueva renderice los estilos antes de imprimir.

Se implementara la alternativa ligera con estas mejoras:
- Serializar los SVGs con `XMLSerializer` en vez de confiar solo en `innerHTML`
- Copiar los estilos computados criticos inline en los SVGs
- Agregar un fallback con `html2canvas + jsPDF` como boton secundario "Descargar PDF"

### Problema 2: Scroll al inicio con cada cambio de pagina

El proyecto no tiene un componente `ScrollToTop` en el Router. Cada navegacion entre rutas mantiene la posicion de scroll previa o salta de forma inconsistente.

**Solucion**: Agregar un componente `ScrollToTop` dentro del `Router` en `App.tsx` que haga `window.scrollTo(0, 0)` en cada cambio de `pathname`.

### Problema 3: Tabs se reinician al navegar

La pagina de Evaluaciones usa `useState` para los tabs (tanto el tab principal Dashboard/Candidatos/SIERCP como el sub-tab dentro de SIERCP). Al navegar a otra seccion y volver, siempre se muestra "Dashboard" en vez de "SIERCP > Evaluaciones Candidatos".

**Solucion**: Migrar ambos niveles de tabs a `useSearchParams` siguiendo el patron ya establecido en el proyecto (LMS, Settings, WhatsApp Kapso). Los parametros seran `?tab=siercp&siercpTab=invitations`.

### Cambios por archivo

| Archivo | Accion | Descripcion |
|---|---|---|
| `src/components/global/ScrollToTop.tsx` | Crear | Componente que hace scroll al inicio en cada navegacion (no en POP/back) |
| `src/App.tsx` | Modificar | Agregar `ScrollToTop` dentro del Router, junto a `LastRouteRestorer` |
| `src/pages/Leads/EvaluacionesPage.tsx` | Modificar | Cambiar `useState` del tab principal por `useSearchParams` con parametro `?tab=` |
| `src/components/recruitment/siercp/SIERCPResultsPanel.tsx` | Modificar | Cambiar `useState` del sub-tab por `useSearchParams` con parametro `?siercpTab=` |
| `src/components/recruitment/psychometrics/SIERCPReportDialog.tsx` | Modificar | Mejorar `handlePrint`: serializar SVGs correctamente, copiar estilos computados, agregar fallback robusto |

### Detalle tecnico: Impresion mejorada

```text
handlePrint mejorado:
1. Clonar el nodo del reporte (cloneNode(true))
2. Para cada SVG en el clon:
   a. Copiar estilos computados como atributos inline
   b. Serializar con XMLSerializer
3. Recopilar CSS de las hojas de estilo (con try/catch por hoja)
4. Agregar estilos especificos para impresion del SIERCP
5. Escribir en ventana nueva con onload -> print()
```

### Detalle tecnico: Persistencia de tabs

```text
EvaluacionesPage:
  URL: /leads/evaluaciones?tab=siercp
  Valores: dashboard | candidates | siercp (default: dashboard)

SIERCPResultsPanel:
  URL: /leads/evaluaciones?tab=siercp&siercpTab=invitations
  Valores: invitations | calibration (default: invitations)
  
Al cambiar el tab principal, se limpia siercpTab del URL
```
