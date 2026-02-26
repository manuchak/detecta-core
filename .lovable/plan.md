
# Fix: Duplicacion de servicios en dashboard de planeacion

## Problema
La funcion SQL `get_real_planned_services_summary` hace un `LEFT JOIN` directo a `asignacion_armados` (linea 63-64). Cuando un servicio tiene mas de un armado activo (estado 'confirmado' o 'pendiente'), el JOIN produce multiples filas por servicio, causando duplicacion en el dashboard.

## Solucion
Reemplazar el `LEFT JOIN` directo por un `LEFT JOIN LATERAL` con `LIMIT 1`, que selecciona solo el armado mas reciente (o confirmado primero) por servicio. Esto mantiene la relacion 1:1 entre servicios y filas del resultado.

## Cambio

### Nueva migracion SQL

Recrear la funcion `get_real_planned_services_summary` con este cambio en el CTE `services_json`:

```sql
-- Antes (causa duplicacion):
LEFT JOIN public.asignacion_armados aa 
  ON sp.id_servicio = aa.servicio_custodia_id 
  AND aa.estado_asignacion IN ('confirmado', 'pendiente')

-- Despues (1 armado por servicio):
LEFT JOIN LATERAL (
  SELECT a.armado_id, a.armado_nombre_verificado
  FROM public.asignacion_armados a
  WHERE a.servicio_custodia_id = sp.id_servicio
    AND a.estado_asignacion IN ('confirmado', 'pendiente')
  ORDER BY 
    CASE a.estado_asignacion WHEN 'confirmado' THEN 0 ELSE 1 END,
    a.created_at DESC
  LIMIT 1
) aa ON true
```

La logica de prioridad:
1. Primero armados con estado 'confirmado'
2. Luego 'pendiente'
3. Dentro del mismo estado, el mas reciente (`created_at DESC`)

## Archivos
- **1 migracion SQL nueva** - Recrea la funcion con el lateral join
- **0 archivos de codigo** - El frontend ya consume el resultado correctamente, solo recibe datos duplicados

## Impacto
- Elimina la duplicacion visual inmediatamente
- No afecta el conteo de `service_stats` (ese CTE ya es correcto, no tiene el JOIN)
- Retrocompatible: los campos `armado_nombre`, `armado_id`, `armado_asignado` siguen poblados igual
