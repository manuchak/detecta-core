

# Homologar Editor de Texto Enriquecido en LMSContenidoForm

## Problema
El dialogo "Editar Contenido" (`LMSContenidoForm.tsx`) usa un `<Textarea>` plano con fuente monoespaciada para editar contenido de tipo `texto_enriquecido`. Esto obliga al usuario a escribir HTML crudo, mientras que otros editores del LMS (como `ContenidoExpandedEditor` y `ContentEditor` del wizard) ya usan el componente `RichTextEditor` basado en TipTap con toolbar WYSIWYG completo.

## Solucion
Reemplazar el `<Textarea>` por el componente `RichTextEditor` que ya existe en el proyecto, conectado con la misma funcionalidad de "Generar con IA" que ya tiene el formulario.

## Cambios

### Archivo: `src/components/lms/admin/LMSContenidoForm.tsx`

1. **Importar** `RichTextEditor` (ya existe en `@/components/lms/admin/RichTextEditor`).
2. **Reemplazar** el bloque de `texto_enriquecido` (lineas ~447-475) que contiene:
   - Un boton "Generar con IA" separado
   - Un `<Textarea>` plano con `font-mono`
3. **Sustituir por**: el componente `<RichTextEditor>` con sus props `value`, `onChange`, `onGenerateAI` y `aiLoading`, exactamente como ya se usa en `ContenidoExpandedEditor.tsx`.
4. **Ampliar el ancho del dialogo** para `texto_enriquecido` (igual que ya se hace para `quiz`), ya que el editor WYSIWYG necesita mas espacio horizontal.

### Resultado visual
- El usuario vera una barra de herramientas con negrita, cursiva, subrayado, encabezados, listas, alineacion, colores, enlaces, imagenes y tablas.
- El boton "Generar con IA" quedara integrado en la barra del editor.
- El contenido se editara visualmente en lugar de como HTML crudo.

### Detalle tecnico

```tsx
// Antes (Textarea plano):
<Textarea value={textoHtml} onChange={(e) => setTextoHtml(e.target.value)} />

// Despues (RichTextEditor WYSIWYG):
<RichTextEditor
  value={textoHtml}
  onChange={setTextoHtml}
  onGenerateAI={handleGenerateRichText}
  aiLoading={aiLoading}
/>
```

El ancho del dialogo se ampliara condicionalmente:
```tsx
// Antes:
isQuizMode ? "max-w-4xl" : "max-w-2xl"

// Despues:
(isQuizMode || tipo === 'texto_enriquecido') ? "max-w-4xl" : "max-w-2xl"
```

No se requieren cambios en base de datos ni en otros componentes. El `RichTextEditor` ya produce HTML limpio compatible con `TextoEnriquecidoViewer`.
