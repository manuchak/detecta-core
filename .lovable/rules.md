# Reglas del Proyecto Detecta

## Marca — Uso de Logos

### Activos disponibles
| Activo | Ruta | Uso |
|--------|------|-----|
| **Isotipo** | `src/assets/detecta-isotipo.png` / `public/detecta-isotipo.png` | Headers de PDF, sidebar, favicon, espacios reducidos |
| **Logo completo** | `src/assets/detecta-logo-full.png` / `public/detecta-logo-full.png` | Portadas de PDF, documentación, landing page |
| **Logo legacy** | `src/assets/detecta-logo.png` / `public/detecta-logo.png` | Legacy — preferir isotipo o logo completo según contexto |

### Reglas obligatorias
1. **Nunca deformar los logos** — solo escalar proporcionalmente.
   - Usar `objectFit: 'contain'` en `@react-pdf/renderer`.
   - Nunca establecer `width` y `height` fijos simultáneamente con proporciones diferentes al original.
   - Solo fijar una dimensión (height o maxWidth) y dejar la otra calcularse automáticamente.
2. **Isotipo** para espacios compactos (≤ 40px de alto): headers PDF, barras de navegación.
3. **Logo completo** para espacios amplios: portadas de reportes, documentación, hero sections.
4. En PDFs, pasar siempre el logo como `base64` usando `loadImageAsBase64()` de `@/components/pdf/utils`.

### Ejemplo correcto (react-pdf)
```tsx
// Header — isotipo compacto
<Image src={isotipoBase64} style={{ height: 28, objectFit: 'contain', marginRight: 10 }} />

// Portada — logo completo
<Image src={logoFullBase64} style={{ height: 80, maxWidth: 200, objectFit: 'contain' }} />
```
