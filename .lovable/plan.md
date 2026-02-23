

# Extraer Fecha Real de Publicacion desde Metadatos de Firecrawl

## Problema
La linea 127 de la edge function siempre asigna `new Date().toISOString()` como fecha de publicacion, por lo que todos los incidentes aparecen con la fecha del scraping, no la fecha real del articulo.

## Solucion

Modificar `supabase/functions/firecrawl-incident-search/index.ts` (lineas 109-131) para:

1. Leer los metadatos del resultado de Firecrawl (`result.metadata`) buscando campos comunes de fecha de publicacion:
   - `publishedTime`, `published_time`, `datePublished`, `date_published`
   - `article_published_time`, `ogArticlePublishedTime`
   - `modifiedTime`, `dateModified` (como fallback)

2. Intentar parsear la fecha con `new Date(rawDate)` y validar que sea una fecha razonable (anio > 2000)

3. Si no hay metadato de fecha o el parseo falla, usar la fecha actual como fallback

## Detalle Tecnico

En la seccion de preparacion de registros (lineas ~119-131), antes de crear el objeto del registro, agregar:

```typescript
const meta = result.metadata || {};
const rawDate = meta.publishedTime || meta.published_time || meta.datePublished 
  || meta.date_published || meta.article_published_time || meta.ogArticlePublishedTime
  || meta.modifiedTime || meta.dateModified || null;

let fechaPublicacion = new Date().toISOString();
if (rawDate) {
  try {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      fechaPublicacion = parsed.toISOString();
    }
  } catch { /* fallback a fecha actual */ }
}
```

Y luego usar `fechaPublicacion` en el objeto del registro en lugar de `new Date().toISOString()`.

## Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/firecrawl-incident-search/index.ts` | Extraer fecha real de metadatos antes del insert |

