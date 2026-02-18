
# Analisis Fishbone y Plan de Correccion

## Problema 1: Timeout al cargar armados

### Causa Raiz (Fishbone)

```text
TIMEOUT "canceling statement due to statement timeout"
|
+-- [Vista armados_disponibles_extendido]
|   |
|   +-- Subqueries correlacionadas por cada armado (109 registros)
|   |   |
|   |   +-- JOIN: asignacion_armados.servicio_custodia_id (TEXT)
|   |   |   con servicios_custodia.id (BIGINT) usando cast ::text
|   |   |   --> El cast IMPIDE uso del indice PK
|   |   |
|   |   +-- Escaneo secuencial de 33,165 filas por cada armado
|   |   |
|   |   +-- NO existe indice en asignacion_armados.armado_id
|   |
|   +-- security_invoker=on (agregado hoy)
|       --> RLS policies se evaluan DENTRO de la vista
|       --> Overhead adicional en cada subquery
```

### Solucion

1. Crear indice en `asignacion_armados.armado_id`
2. Reescribir la vista usando JOINs laterales o CTEs pre-materializados en lugar de subqueries correlacionadas por fila
3. Eliminar el cast `sc.id::text` y corregir el tipo de dato de `servicio_custodia_id` a `bigint` (o usar un indice funcional)

---

## Problema 2: Abel Cruz no aparece en lista de custodios

### Causa Raiz (Fishbone)

```text
CUSTODIO INVISIBLE "Abel Cruz no aparece"
|
+-- [Filtro de rechazos en useProximidadOperacional.ts, linea 400-416]
|   |
|   +-- Query: SELECT custodio_id FROM custodio_rechazos
|   |   WHERE vigencia_hasta > NOW()
|   |   --> Trae TODOS los rechazos vigentes sin contexto
|   |
|   +-- Filtro BLANKET: excluye el custodio de TODAS las listas
|   |   independientemente del tipo de servicio
|   |
|   +-- Abel Cruz tiene rechazo vigente hasta 2026-02-24
|       Motivo: "No quiere servicio con armado"
|       --> Deberia excluirse SOLO de servicios con armado
|       --> Pero se excluye de TODOS los servicios
```

### Solucion

Modificar el filtro de rechazos para incluir contexto del servicio. El rechazo con motivo "con armado" solo debe excluir al custodio de servicios que requieren armado, no de todos.

---

## Detalle Tecnico de Implementacion

### Paso 1: Migracion SQL - Indices y vista optimizada

- Crear `CREATE INDEX idx_asignacion_armados_armado_id ON asignacion_armados(armado_id)`
- Crear indice funcional para el join con tipo mixto: `CREATE INDEX idx_asignacion_armados_servicio_text ON asignacion_armados(servicio_custodia_id)`
- Reescribir `armados_disponibles_extendido` usando CTEs pre-agregados en lugar de subqueries correlacionadas:

```text
Vista actual (lenta):
  Para CADA armado -> subquery que escanea 33K filas

Vista optimizada:
  CTE 1: Pre-agregar actividad por armado_id (1 sola pasada)
  CTE 2: Pre-agregar conteo historico por armado_id (1 sola pasada)
  SELECT principal: JOIN con CTEs por armado_id
```

### Paso 2: Correccion del filtro de rechazos en useProximidadOperacional.ts

- Modificar la query de rechazos para traer tambien el campo `motivo` y `servicio_id`
- En el filtrado, si el motivo contiene "armado" y el servicio actual NO requiere armado, NO excluir al custodio
- Esto permite que Abel Cruz aparezca en servicios sin armado, respetando su preferencia

### Paso 3: Verificacion

- Confirmar que la vista responde en menos de 2 segundos
- Confirmar que Abel Cruz aparece en asignaciones de servicios sin armado
