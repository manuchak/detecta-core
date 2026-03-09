

# Plan: Agregar Pago de Armados Internos a Generación Masiva de Cortes

## Problema
El diálogo "Generar Cortes Semana" solo consulta `servicios_custodia` para custodios. Los armados internos (que se pagan vía `asignacion_armados`) no aparecen en la previsualización ni se generan cortes para ellos.

La lógica individual (`useCreateCxPCorte`) ya soporta `tipo_operativo: 'armado_interno'` consultando `asignacion_armados` con `estado_asignacion: 'completado'`, pero el flujo masivo nunca fue conectado.

## Cambios

### `GenerarCortesMasivosDialog.tsx`

En el hook `useOperativosConServicios`:

1. **Agregar query de armados internos**: Consultar `asignacion_armados` filtrando por `tipo_asignacion = 'interno'`, `estado_asignacion = 'completado'`, y rango de fechas en `hora_encuentro`. Incluir `armado_id`, `armado_nombre_verificado`, `tarifa_acordada`, `servicio_custodia_id`.

2. **Agrupar armados**: Similar a custodios — agrupar por `armado_id`, usar `armado_nombre_verificado` como nombre, sumar `tarifa_acordada` como monto.

3. **Merge ambas listas**: Combinar custodios y armados internos en el array de `OperativoPreview`, marcando `tipo: 'armado_interno'` para los armados.

4. **Adaptar `ServicioDetalle`**: Incluir campo `tarifa_acordada` opcional para que los detalles expandibles de armados muestren la tarifa por asignación en vez de `costo_custodio`.

5. **UI de la tabla**: Mostrar badge "Armado" vs "Custodio" en la columna Tipo (ya existe la columna, solo se muestra "Custodio" hardcoded actualmente).

### Sin cambios en `useCxPCortesSemanales.ts`
La mutación `useCreateCxPCorte` ya maneja `armado_interno` correctamente (líneas 150-173). Solo necesitamos que el diálogo masivo le pase el tipo correcto.

## Resumen de archivo

| Archivo | Cambio |
|---------|--------|
| `GenerarCortesMasivosDialog.tsx` | Agregar query de `asignacion_armados`, merge con custodios, badge de tipo |

