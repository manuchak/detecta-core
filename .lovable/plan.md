

# Fishbone: Por qué OMAR FIDENCIO sigue mostrando "21d sin servicio"

```text
                         "21d sin servicio" (falso)
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
    DATOS (DB)              ENRIQUECIMIENTO           NOMBRE
         │                   (código)                     │
         │                        │                       │
  fecha_ultimo_servicio    ┌──────┴──────┐         Duplicado en DB:
  = Feb 19 (estale)        │             │         "NAVA MARTINEZ"
                     servicios_     servicios_     "NAVA  MARTINEZ"
                     custodia ✅    planificados ❌  (doble espacio)
                     Feb 19          FALLA SILENCIOSA
                                        │
                                 ┌──────┴──────┐
                                 │             │
                           "fecha_programada"  "estado" (filtro)
                            NO EXISTE          debería ser
                            en la tabla        "estado_planeacion"
                                 │
                              ★ CAUSA RAÍZ ★
```

## Causa raíz encontrada

**Líneas 419-425 de `useProximidadOperacional.ts`**: La query de enriquecimiento a `servicios_planificados` usa columnas que no existen:

- `fecha_programada` → la columna real es `fecha_hora_cita`
- `.neq('estado', 'cancelado')` → la columna real es `estado_planeacion`

Esto hace que PostgREST devuelva un error 400 silencioso. `resPlanificados.data` queda `null`, y el enriquecimiento solo usa `servicios_custodia`, que para "OMAR FIDENCIO NAVA MARTINEZ" tiene como último registro Feb 19.

El servicio de hoy (Mar 10) está en `servicios_planificados` con `custodio_asignado = "OMAR FIDENCIO NAVA MARTINEZ"` y `fecha_hora_cita = 2026-03-10 15:00`, pero nunca se lee.

## Problema secundario: nombres duplicados

Hay dos registros en `custodios_operativos`:
- "OMAR FIDENCIO NAVA MARTINEZ" (espacio simple)
- "OMAR FIDENCIO NAVA  MARTINEZ" (doble espacio)

Esto no es la causa del bug actual pero puede causar problemas futuros.

## Solución

### `src/hooks/useProximidadOperacional.ts` — 3 líneas

Corregir las columnas en la query de `servicios_planificados`:

1. `fecha_programada` → `fecha_hora_cita` (líneas 421, 424, 425)
2. `.neq('estado', ...)` → `.neq('estado_planeacion', ...)` (línea 423)
3. Actualizar el parsing en línea 444: `row.fecha_programada` → `row.fecha_hora_cita` y quitar el `+ 'T00:00:00'` ya que `fecha_hora_cita` ya es timestamp

