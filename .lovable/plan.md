

# Fix: Daniel Medina no ve servicios en el portal de custodio

## Causa Raiz Identificada

Se encontraron **2 bugs** que en conjunto causan que los custodios no vean sus servicios:

### Bug 1: RLS de `servicios_custodia` no normaliza telefono correctamente

La policy `servicios_custodia_select_custodio_own` compara el telefono del custodio asi:

```text
telefono = replace(replace(profiles.phone, ' ', ''), '-', '')
```

Para Daniel, `profiles.phone` = `+52 558 068 0854`. Despues de quitar espacios y guiones queda `+525580680854` (12 caracteres). Pero en `servicios_custodia`, el telefono almacenado es `5580680854` (10 digitos). **No coinciden** porque la policy no quita el codigo de pais `+52`.

Esto bloquea a cualquier custodio cuyo telefono en profiles incluya codigo de pais de ver sus servicios legacy.

### Bug 2: Query invalida en `useCustodianServices`

El hook `useCustodianServices.ts` solicita las columnas `km_recorridos` y `cobro_cliente` de la tabla `servicios_planificados`, pero **esas columnas no existen** en esa tabla (solo existen en `servicios_custodia`). Esto causa un error HTTP 400 silencioso que impide cargar servicios planificados en el dashboard.

## Datos de Daniel Garcia Medina

| Dato | Valor |
|------|-------|
| Telefono en profiles | `+52 558 068 0854` |
| Telefono en servicios | `5580680854` |
| Servicios este mes (legacy) | 4 (todos "Finalizado") |
| Servicio hoy (planificados) | YOCOYTM-274 con hora_inicio_real ya registrada |
| Rol | custodio |

## Plan de Correccion

### Fix 1: Corregir RLS policy de `servicios_custodia`

Crear una migracion SQL que actualice la policy para usar los ultimos 10 digitos del telefono (misma logica que `normalizePhone` en el frontend):

```text
Antes:  replace(replace(profiles.phone, ' ', ''), '-', '')
Despues: RIGHT(regexp_replace(profiles.phone, '[^0-9]', '', 'g'), 10)
```

Esto quita TODOS los caracteres no numericos y toma los ultimos 10 digitos, coincidiendo exactamente con el formato almacenado en `servicios_custodia`.

Archivo: Nueva migracion SQL

### Fix 2: Corregir query en `useCustodianServices.ts`

Eliminar las columnas `km_recorridos` y `cobro_cliente` del select de `servicios_planificados`, ya que no existen en esa tabla. Solo `comentarios_adicionales` existe y puede mantenerse.

Archivo: `src/hooks/useCustodianServices.ts` (lineas 103-105)

## Impacto

- Estos fixes afectan a **todos** los custodios que tengan codigo de pais en su telefono de profiles
- No requiere cambios en la logica de `useNextService` ya que ese hook consulta `servicios_planificados` (que tiene RLS abierta) correctamente
- Los stats del mes (Servicios, Km, Ingresos) empezaran a mostrar datos correctos de ambas tablas

## Secuencia

1. Aplicar migracion SQL (fix RLS)
2. Corregir hook `useCustodianServices.ts` (fix query)
