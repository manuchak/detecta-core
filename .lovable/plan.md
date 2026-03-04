

# Fishbone: Bug "evaluaciones_psicometricas_estado_check"

## Causa Raíz Identificada

El RPC `complete_siercp_assessment` inserta `estado = 'completo'` pero el CHECK constraint solo permite tres valores:

```text
CHECK (estado IN ('en_progreso', 'completado', 'invalidado'))
```

`'completo'` ≠ `'completado'` — es un typo en el RPC.

## Fishbone

```text
                    ┌─────────────────────────┐
                    │  CHECK constraint viola- │
                    │  tion al completar       │
                    │  evaluación SIERCP       │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    RPC Function            DB Schema              Frontend
    ─────────────           ─────────              ────────
    estado='completo' ✗     allows only:           No valida
    debería ser             en_progreso            el valor
    'completado'            completado             antes de
                            invalidado             llamar RPC
```

## Fix

Un solo cambio en la función RPC — línea del INSERT que dice `'completo'` debe decir `'completado'`:

**Migración SQL:**
```sql
CREATE OR REPLACE FUNCTION complete_siercp_assessment(...)
  -- mismo body, cambiar 'completo' → 'completado'
```

No se requieren cambios en el frontend. El default de la columna ya es `'completado'`, así que el error solo ocurre a través del RPC que fuerza el valor incorrecto.

## Archivos a modificar
| Archivo | Cambio |
|---|---|
| Nueva migración SQL | `ALTER` el RPC para usar `'completado'` en vez de `'completo'` |

