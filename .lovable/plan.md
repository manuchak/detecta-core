

# Fix: Quiz muestra "intentos agotados" sin haber intentado

## Causa raíz

El quiz del **Módulo 4 (ISO 9001)** tiene su campo `contenido` JSON incompleto — le faltan `intentos_permitidos`, `puntuacion_minima` y `mostrar_respuestas_correctas`:

```json
// Lo que tiene:
{ "html": "", "preguntas_ids": ["550a...", ...] }

// Lo que debería tener:
{ "preguntas_ids": [...], "intentos_permitidos": 3, "puntuacion_minima": 80, ... }
```

Cuando el usuario abre el quiz:
1. `quizData.intentos_permitidos` = `undefined`
2. `puedeReintentar(0, undefined)` → `undefined === 0` es `false` (no entra en "ilimitados"), luego `0 < undefined` es `false`
3. Resultado: **botón deshabilitado + mensaje "Has agotado todos los intentos"** sin haber intentado nunca

## Dos problemas a resolver

### Problema 1: La función `puedeReintentar` no tolera `undefined`
**Archivo: `src/hooks/useLMSQuiz.ts`** (línea 189-195)

Cambiar la firma para aceptar `undefined`/`null` y tratarlo como ilimitado:
```typescript
export function puedeReintentar(
  intentosUsados: number,
  intentosPermitidos: number | undefined | null
): boolean {
  if (!intentosPermitidos || intentosPermitidos <= 0) return true;
  return intentosUsados < intentosPermitidos;
}
```

### Problema 2: El quiz de Módulo 4 tiene JSON incompleto en la DB
**Migración SQL** — Parchear los quizzes que les faltan campos:
```sql
UPDATE lms_contenidos 
SET contenido = contenido || '{"intentos_permitidos": 3, "puntuacion_minima": 80, "mostrar_respuestas_correctas": true}'::jsonb
WHERE tipo = 'quiz' 
  AND (contenido->>'intentos_permitidos' IS NULL);
```

Esto es un fix de datos para todos los quizzes creados antes de que el form incluyera esos campos.

### Problema 3 (bonus): El input de intentos en el admin tiene `min={1}` 
**Archivo: `src/components/lms/admin/LMSContenidoForm.tsx`** (línea 747)

Cambiar `min={1}` a `min={0}` para permitir "0 = ilimitados", consistente con el Slider del wizard que va de 0 a 10.

