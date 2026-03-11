

# Bug: Preview de contratos en blanco

## Causa raíz

El `ContractPreviewDialog` solo renderiza `contrato.contenido_html` vía `dangerouslySetInnerHTML`. Sin embargo, los contratos subidos como **documento físico** (`es_documento_fisico = true`) no tienen `contenido_html` — solo tienen `pdf_url` apuntando al PDF escaneado en el bucket `contratos-escaneados`. Por lo tanto, el dialog muestra un div vacío.

Contratos generados digitalmente → `contenido_html` ✓ poblado
Contratos subidos físicamente → `contenido_html` = null, `pdf_url` ✓ poblado

## Corrección

**Archivo: `src/components/recruitment/contracts/ContractPreviewDialog.tsx`**

Agregar lógica condicional en el panel de contenido:

1. Si `contrato.contenido_html` existe → renderizar HTML como actualmente (sin cambios)
2. Si `contrato.pdf_url` existe y no hay HTML → mostrar el PDF embebido en un `<iframe>` usando Google Docs Viewer como proxy (patrón ya usado en `DocumentViewer.tsx` y `documentUtils.ts`)
3. Si ninguno existe → mostrar un fallback con mensaje informativo y botón para abrir/descargar

```text
┌─────────────────────────────────────┐
│  ¿contenido_html?                   │
│    SÍ → dangerouslySetInnerHTML     │
│    NO → ¿pdf_url?                   │
│           SÍ → iframe con viewer    │
│           NO → fallback "sin datos" │
└─────────────────────────────────────┘
```

### Cambios específicos

En la sección del `ScrollArea` (líneas 35-52), reemplazar el renderizado estático por:

- **Caso PDF:** Usar `<iframe src={getViewerUrl(pdf_url, 'pdf')}` con estados de carga/error (reutilizar patrón de `DocumentViewer.tsx`)
- **Caso HTML:** Mantener el `dangerouslySetInnerHTML` actual
- **Fallback:** Icono + texto "Este contrato no tiene contenido para previsualizar" + botón para abrir PDF externamente si existe

Se importará `getViewerUrl` de `@/utils/documentUtils` (ya existe en el proyecto) y se agregará un estado `isLoading` para el iframe del PDF.

### Impacto
- Un solo archivo modificado
- Sin cambios en base de datos
- Supply podrá ver tanto contratos digitales como físicos escaneados

