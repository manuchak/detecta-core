

# Corregir "Días sin servicio" con datos en tiempo real

## Diagnóstico

El custodio OMAR FIDENCIO muestra "21d" sin servicio cuando en realidad tiene un servicio HOY ("En origen"). El problema tiene dos capas:

1. **Columna estale**: `custodios_operativos.fecha_ultimo_servicio` dice "Feb 19" pero `servicios_custodia` muestra servicios el 2, 4, 5 y 10 de marzo. El trigger que actualiza esta columna no está funcionando correctamente.

2. **Fallback al dato viejo**: Cuando el RPC `verificar_disponibilidad_equitativa_custodio` falla o hace timeout (fail-open), `datos_equidad` queda undefined, y `CustodianCard` usa como fallback `custodios_operativos.fecha_ultimo_servicio` — el dato estale.

3. **El RPC sí calcula bien**: Probé la query del RPC manualmente y devuelve `dias_sin_asignar = 0` para este custodio. Pero eso no ayuda si el RPC falla por timeout en dispositivos lentos, ni resuelve la fecha que se muestra como "(18 feb)".

## Solución

Agregar **una sola query bulk** en `useProximidadOperacional.ts` para obtener la fecha del último servicio real de cada custodio desde `servicios_custodia` (la fuente en tiempo real). Esto reemplaza el dato estale de `custodios_operativos.fecha_ultimo_servicio`.

### Cambios en `src/hooks/useProximidadOperacional.ts`

Después de procesar todos los custodios (línea ~392), agregar:

1. Extraer todos los nombres de custodios procesados
2. Query a `servicios_custodia` agrupando por `nombre_custodio`, obteniendo `MAX(fecha_hora_cita)` de los últimos 30 días (excluyendo cancelados)
3. Complementar con query a `servicios_planificados` por `custodio_asignado`
4. Para cada custodio, si la fecha real es más reciente que `fecha_ultimo_servicio`, sobreescribir:
   - `custodio.fecha_ultimo_servicio` → la fecha real
   - Si `datos_equidad` existe, recalcular `dias_sin_asignar` con `differenceInDays`
   - Si `datos_equidad` no existe (fail-open), crear un `datos_equidad` mínimo con el valor correcto

Esta query adicional es **una sola llamada** para los ~140 custodios, no una por tarjeta.

### Impacto
- El badge "21d" mostrará "0d" (verde) correctamente
- La fecha "(18 feb)" mostrará "(10 mar)" 
- Funciona incluso cuando el RPC hace timeout (fail-open)
- No requiere cambios en la base de datos ni triggers

