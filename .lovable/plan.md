

# Análisis Causa Raíz: Error "Could not choose the best candidate function"

## Problema
Al intentar liberar un custodio (tanto desde el panel de Evaluación como desde el Checklist de Liberación), PostgREST retorna:

> Could not choose the best candidate function between:
> `public.liberar_custodio_a_planeacion_v2(p_custodio_liberacion_id => uuid, p_aprobado_por => uuid, p_forzar_liberacion => boolean)`
> `public.liberar_custodio_a_planeacion_v2(p_custodio_liberacion_id => uuid, p_aprobado_por => uuid, p_forzar_liberacion => boolean, p_notas => text)`

## Causa Raíz
Existen **dos overloads** de la función `liberar_custodio_a_planeacion_v2` en la base de datos:

1. **Versión original**: 3 parámetros (`p_custodio_liberacion_id`, `p_aprobado_por`, `p_forzar_liberacion`)
2. **Versión nueva**: 4 parámetros (los mismos + `p_notas DEFAULT NULL`)

Cuando el frontend invoca la función con 3 argumentos, PostgREST no puede decidir cuál usar porque ambas son candidatas válidas (la versión de 4 params tiene `p_notas` con DEFAULT). Este es un problema conocido de PostgreSQL/PostgREST con overloads que solo difieren en parámetros opcionales.

## Solución

### 1. Eliminar el overload redundante (SQL)
Dropear la versión de 3 parámetros y conservar únicamente la de 4 parámetros (que ya tiene `p_notas DEFAULT NULL`, por lo que funciona igual cuando no se pasan notas):

```sql
DROP FUNCTION public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean);
```

Esto deja solo la versión `(uuid, uuid, boolean, text)` que acepta las mismas llamadas gracias al DEFAULT.

### 2. Actualizar el frontend para pasar `p_notas` explícitamente
En `src/hooks/useCustodioLiberacion.ts`, agregar `p_notas: ''` (o el valor que corresponda) a la llamada RPC para mayor claridad y compatibilidad futura.

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| SQL (migración) | `DROP FUNCTION` del overload de 3 params |
| `src/hooks/useCustodioLiberacion.ts` | Agregar `p_notas` al call RPC |

## Impacto
- Desbloquea **ambos flujos** de liberación (Evaluación y Checklist)
- No afecta la lógica de negocio — la función de 4 params ya contiene toda la lógica
- Solución de 2 minutos, cero riesgo

