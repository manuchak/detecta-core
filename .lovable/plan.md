
## Mejorar PDF de Análisis de Clientes: Gráfico de Barras, Header con Logo y Correcciones

### Problemas identificados en el PDF actual (imagen de referencia)

1. **Emojis corruptos en KPI labels** — `@react-pdf/renderer` no soporta emojis Unicode (🏆📦💰✅). Al renderizarlos aparece texto superpuesto sobre los valores, ya que el renderer los omite y desplaza el layout.
2. **Header sin logo** — la barra gris de header muestra el título pero no el logo, porque el `headerBar` tiene `paddingTop: 60` desde la página pero la posición del logo no está alineada correctamente con el texto.
3. **Gráfico de barras faltante** — se solicitó un `PDFBarChart` con Top 10 clientes por GMV que aún no está implementado.
4. **Corte de páginas** — la sección "Análisis Foráneo vs Local" aparece cortada al fondo de la página. Falta `minPresenceAhead` y agrupación con `wrap={false}`.

---

### Cambios a realizar

**Archivo: `src/components/executive/pdf/ClientAnalyticsPDFDocument.tsx`**

#### 1. Eliminar emojis de los KPI labels
Reemplazar los 4 labels con texto plano:
- `'🏆 Mayor GMV'` → `'Mayor GMV'`
- `'📦 Más Servicios'` → `'Más Servicios'`
- `'💰 Mejor AOV'` → `'Mejor AOV'`
- `'✅ Mejor Cumplimiento'` → `'Mejor Cumplimiento'`

#### 2. Agregar PDFBarChart — Top 10 Clientes por GMV
Insertar el gráfico de barras nativo **entre** los KPI Champions y la tabla Top 15, usando el componente `PDFBarChart` ya disponible en el design system:

```text
┌─────────────────────────────────────┐
│  Champions del Período (KPIRow)     │
├─────────────────────────────────────┤
│  Top 10 Clientes por GMV (BarChart) │  ← NUEVO
│  [barras horizontales con labels]   │
├─────────────────────────────────────┤
│  Top 15 Clientes por GMV (tabla)    │
├─────────────────────────────────────┤
│  Análisis Foráneo vs Local          │
└─────────────────────────────────────┘
```

El chart se construye con los primeros 10 registros de `tableData`, mapeando:
- `label`: nombre del cliente (truncado a 12 chars)
- `value`: `currentGMV`
- `color`: usando `getChartColors(10)` del design system

Se usará `PDFHorizontalBarChart` (en lugar del vertical) porque los nombres de clientes son largos — esto asegura que los labels sean legibles en el eje Y, al igual que se hace en otros reportes del sistema.

Dimensiones: `width=510, height=200` (aprovechando el ancho completo de la página A4 menos márgenes).

#### 3. Proteger corte de página en secciones pequeñas
Envolver la sección "Análisis Foráneo vs Local" en un `<View wrap={false}>` para evitar que se parta entre páginas:

```tsx
<View wrap={false}>
  <SectionHeader title="Análisis Foráneo vs Local" />
  <DataTable columns={typeColumns} data={[foraneoRow, localRow]} striped={false} />
</View>
```

Agregar también `minPresenceAhead={60}` en el header de la tabla Top 15 para evitar que el encabezado quede huérfano al final de página.

#### 4. Mejorar el header con separación visual de título/subtítulo
El header actual pone título y subtítulo en la misma línea sin suficiente separación visual. Se mejora con un separador vertical (`|`) y estilos más limpios directamente en el componente para el subtítulo del lado derecho.

---

### Resultado esperado

| Problema | Antes | Después |
|----------|-------|---------|
| Emojis en KPI labels | Texto corrupto superpuesto | Labels limpios en texto plano |
| Logo en header | Sin logo visible | Logo detecta alineado izquierda |
| Gráfico de barras | No existe | Barras horizontales Top 10 por GMV |
| Corte de páginas | Foráneo/Local cortado | Sección protegida con wrap={false} |

El PDF resultante tendrá 1 página (sin cliente seleccionado) con el diseño:
- Header: logo + "ANÁLISIS DE CLIENTES" + fecha a la derecha
- Línea roja de acento bajo el header
- KPI Champions (4 tarjetas sin emojis)
- Gráfico de barras horizontal Top 10 por GMV
- Tabla Top 15 con columnas correctas
- Análisis Foráneo vs Local (sin corte)
- Footer con número de página
