

# Fix: Expandir CHECK constraint de `red_social` en `incidentes_rrss`

## Problema

La tabla `incidentes_rrss` tiene un CHECK constraint que solo permite 3 valores para `red_social`:
- `twitter`, `facebook`, `instagram`

La edge function de Firecrawl detecta fuentes como `web`, `youtube`, `noticias`, `gobierno`, `reddit`, `tiktok` -- todos rechazados por el constraint, causando 31 errores de 31 resultados encontrados.

## Solucion

### 1. Migrar el CHECK constraint (SQL)

Eliminar el constraint actual y crear uno nuevo que incluya todos los valores necesarios:

```sql
ALTER TABLE incidentes_rrss DROP CONSTRAINT incidentes_rrss_red_social_check;
ALTER TABLE incidentes_rrss ADD CONSTRAINT incidentes_rrss_red_social_check 
  CHECK (red_social IN ('twitter', 'facebook', 'instagram', 'tiktok', 'youtube', 'reddit', 'noticias', 'gobierno', 'web'));
```

### 2. Sin cambios en codigo

La edge function y el UI ya estan correctos. Solo falta permitir los nuevos valores en la base de datos.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Base de datos (migracion SQL) | Expandir CHECK constraint |

No se requieren cambios en archivos de codigo.
