

# Análisis Fishbone: Error "Tu app parece desactualizada" al liberar

```text
                        ┌─────────────────────────────────┐
                        │  Mariana no puede liberar        │
                        │  "Tu app parece desactualizada"  │
                        └──────────────┬──────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        │              │               │               │              │
   ┌────▼────┐   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐ ┌─────▼─────┐
   │ CÓDIGO  │   │ BASE DE   │  │ DEPLOY /  │  │ DATOS     │ │ FRONTEND  │
   │ CLIENTE │   │ DATOS RPC │  │ AMBIENTE  │  │ LEGADOS   │ │ MASKING   │
   └────┬────┘   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ └─────┬─────┘
        │              │               │               │              │
   Filtro de      Constraint      Migración        Registros    includes(
   error dema-    único en        solo en TEST,    con          'function')
   siado amplio   custodios_      NO publicada     pc_custodio  atrapa CUAL-
   (line 221)     operativos      a LIVE ← ★      _id = NULL   QUIER error
                  _nombre_unique  CAUSA RAÍZ                    de Postgres
```

## Causa raíz identificada: **Migración no publicada a Live**

La migración `20260306180848` que corrige el fallback lookup en `liberar_custodio_a_planeacion_v2` **solo existe en el entorno Test**. Mariana opera en **Live** (`detecta-core.lovable.app`), donde la función RPC sigue siendo la versión vieja sin fallback por nombre/teléfono.

### Causa secundaria: Error masking en el frontend

La línea 221 de `useCustodioLiberacion.ts` usa `error.message?.includes('function')` — la palabra "function" aparece en muchos errores de Postgres (e.g., `"duplicate key value violates unique constraint"` a veces incluye el nombre de función en el stack). Esto reemplaza el error real con un mensaje genérico que confunde al usuario.

## Plan de corrección (2 cambios)

### 1. Publicar la migración a Live
La migración con el fallback lookup ya está lista en Test. Necesita publicarse para que Mariana tenga acceso a la función corregida.

### 2. Fix del error masking en `useCustodioLiberacion.ts` (line 221)

Cambiar el filtro demasiado amplio para que solo atrape errores genuinos de schema cache, no cualquier error que mencione "function":

```typescript
// Antes (demasiado amplio):
if (error.message?.includes('schema cache') || error.message?.includes('function'))

// Después (preciso):
if (error.message?.includes('schema cache') || error.message?.includes('Could not find the function'))
```

Esto asegura que errores reales de negocio (unique constraint, permisos, etc.) se muestren correctamente al usuario en lugar del mensaje genérico de "app desactualizada".

### Archivos a modificar
- `src/hooks/useCustodioLiberacion.ts` — línea 221, ajustar condición del filtro de error

