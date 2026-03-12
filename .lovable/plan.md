

# Análisis Fishbone: Error `cs_touchpoints_tipo_check`

## Resultado de la investigación

Revisé exhaustivamente **todos los puntos de creación de touchpoints** en el código y **todos los valores ya están corregidos**:

| Archivo | Valor `tipo` usado | Estado |
|---|---|---|
| `CSTouchpointsList.tsx` (form) | `llamada_seguimiento` | Corregido |
| `CSTouchpointsList.tsx` (default/reset) | `llamada_seguimiento` | Corregido |
| `CSCartera.tsx` (quick touchpoint modal) | `llamada_seguimiento` | Ya correcto |
| `CSQuejaDetail.tsx` (nota en queja) | `nota_interna` (default) | Ya correcto |
| `CSPlaybooks.tsx` (acciones automáticas) | `llamada_seguimiento`, `reunion`, `email` | Ya correcto |

**Constraint en DB**: `llamada_seguimiento, email, whatsapp, reunion, visita, nota_interna` — todos los valores en el código coinciden.

## Fishbone — Causa raíz probable

```text
                          Error cs_touchpoints_tipo_check
                                      |
        ┌───────────────┬─────────────┼──────────────┬──────────────┐
        │               │             │              │              │
   Código fuente    Despliegue     Caché          RLS          Otro
   (DESCARTADO)    (PROBABLE)    (PROBABLE)    (DESCARTADO)
        │               │             │              
   Todos los       ¿Se publicó    Alfredo puede  
   valores son     el fix al      tener la versión
   válidos ✓       URL público?   anterior en cache
                   detecta-core   del navegador
                   .lovable.app
```

### Causa raíz: El fix del código YA está aplicado, pero Alfredo probablemente usa una versión cacheada o el sitio no se ha republicado.

## Plan de acción

1. **Republicar la app** — El fix existe en el código fuente pero puede no estar publicado en `detecta-core.lovable.app`. Necesitas hacer click en "Publish" para que los cambios lleguen a producción.

2. **Alfredo debe hacer hard refresh** — `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac) para limpiar el cache del navegador.

3. **Validación defensiva en el hook** (cambio preventivo) — Agregar una validación en `useCreateCSTouchpoint` que verifique que el `tipo` sea un valor válido antes de enviar a Supabase, para que si algún formulario futuro envía un valor incorrecto, el error sea claro y no un constraint de DB críptico.

### Cambio técnico (solo item 3):

**`src/hooks/useCSTouchpoints.ts`** — En `useCreateCSTouchpoint`, antes del insert, validar:
```typescript
const VALID_TIPOS = ['llamada_seguimiento','email','whatsapp','reunion','visita','nota_interna'];
if (!VALID_TIPOS.includes(input.tipo)) {
  throw new Error(`Tipo de touchpoint inválido: "${input.tipo}". Valores válidos: ${VALID_TIPOS.join(', ')}`);
}
```

Esto da un mensaje de error legible al usuario en vez del constraint de DB, y previene este tipo de bug en el futuro.

