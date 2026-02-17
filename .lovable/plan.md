

## Corregir solapamiento de contenido con header en PDF de Incidentes

### Problema raiz

El `ReportHeader` usa `position: 'absolute'` dentro de un `<View fixed>`. Esto posiciona el header fuera del flujo del documento. Aunque la pagina tiene `paddingTop: 60`, al hacer wrap a paginas 2+, el contenido de la cronologia (especialmente entradas con imagenes grandes) se solapa con el header fijo porque react-pdf no siempre respeta el padding correctamente en paginas subsiguientes cuando hay elementos absolutamente posicionados combinados con `wrap={false}` en hijos grandes.

### Solucion

Cambiar el header de `position: absolute` a un layout de flujo (flow-based) que reserve espacio real en cada pagina, manteniendo el mismo aspecto visual.

---

### Archivos a modificar

**1. `src/components/pdf/ReportHeader.tsx`**

Eliminar `position: 'absolute'` del headerBar. En su lugar, usar un `<View fixed>` que ocupe espacio real en el flujo del documento con dimensiones explicitas, y posicionar los hijos internamente:

- El wrapper `fixed` mantiene un alto de 52pt (42pt barra + 2pt linea roja + 8pt espacio)
- La barra gris se posiciona con absolute DENTRO del fixed view (no del page)
- La linea roja se mantiene debajo

Esto asegura que en cada pagina, el header reserva 52pt de espacio antes de que el contenido fluya.

**2. `src/components/pdf/styles.ts`**

Actualizar `headerBar` para quitar `position: 'absolute'` y cambiar a un layout de flujo. Ajustar las propiedades para que la barra ocupe su espacio natural (height fijo, flexDirection row, alignItems center).

**3. `src/components/pdf/tokens.ts`**

Reducir `paddingTop` de 60 a un valor menor (ej: 10-14pt) ya que el header ahora reserva espacio por si mismo en el flujo. El paddingTop ya no necesita compensar un header absoluto.

**4. `src/components/monitoring/incidents/pdf/PDFTimeline.tsx`**

Agregar `minPresenceAhead={40}` al `SectionHeader` de la cronologia para evitar que el titulo de seccion quede huerfano al final de pagina sin entradas debajo.

**5. `src/components/monitoring/incidents/pdf/IncidentPDFDocument.tsx`**

Envolver las secciones Controls, Resolution y Signatures cada una en `<View wrap={false}>` para que no se partan a mitad de pagina.

---

### Resultado esperado

| Antes | Despues |
|-------|---------|
| Texto de cronologia se solapa con header en pag. 2+ | Header reserva espacio real, contenido fluye debajo |
| Imagenes de cronologia cubren la barra gris y linea roja | Separacion limpia entre header y contenido en cada pagina |
| Secciones cortas (Controles, Resolucion) pueden partirse entre paginas | Secciones cortas se mantienen agrupadas |

### Riesgo

Este cambio afecta `ReportHeader`, `styles.ts` y `tokens.ts` que son compartidos por todos los reportes PDF (Incidentes, Historico, Clientes). Dado que todos sufren el mismo patron de header absoluto, la correccion los beneficia a todos. Se verificara que el paddingTop ajustado no rompa los otros reportes ya que todos usan el mismo `ReportPage` wrapper.

