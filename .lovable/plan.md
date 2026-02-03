
# Plan: Corregir Sincronización de Actividad de Armados

## Diagnóstico

**Problema identificado:** El campo `fecha_ultimo_servicio` en `armados_operativos` no se actualiza cuando se asignan armados en servicios planificados.

**Evidencia:**
- `armados_operativos.fecha_ultimo_servicio` más reciente: **10 sept 2025**
- `servicios_planificados` con armados asignados: **Hay servicios de hoy (3 feb 2026)**
- Resultado: El cálculo de `nivel_actividad` muestra todos como "sin_actividad" porque usa la fecha desactualizada

## Solución en 2 partes

### 1. Actualización Masiva Inmediata (SQL)

Sincronizar `fecha_ultimo_servicio` usando los datos reales de `servicios_planificados`:

```sql
UPDATE armados_operativos ao
SET fecha_ultimo_servicio = subquery.ultima_fecha
FROM (
  SELECT 
    ao2.id as armado_id,
    MAX(sp.fecha_hora_cita) as ultima_fecha
  FROM armados_operativos ao2
  INNER JOIN servicios_planificados sp 
    ON UPPER(TRIM(sp.armado_asignado)) = UPPER(TRIM(ao2.nombre))
  WHERE sp.fecha_hora_cita <= NOW()
    AND sp.estado_planeacion IN ('confirmado', 'completado', 'en_curso')
  GROUP BY ao2.id
) subquery
WHERE ao.id = subquery.armado_id
  AND (ao.fecha_ultimo_servicio IS NULL OR subquery.ultima_fecha > ao.fecha_ultimo_servicio);
```

### 2. Cambiar Filtro por Defecto (UI)

**Archivo:** `ArmadosDataTable.tsx` línea 88

Cambiar de `'activo'` a `'all'` para que no dependa de datos que pueden estar desactualizados:

```typescript
const [activityFilter, setActivityFilter] = useState<string>('all');
```

## Cambios a Realizar

| Componente | Acción |
|------------|--------|
| Base de datos | Ejecutar UPDATE para sincronizar fechas |
| `ArmadosDataTable.tsx` | Cambiar filtro default a 'all' |

## Resultado Esperado

- Los 85 armados serán visibles inmediatamente
- Los niveles de actividad reflejarán la realidad operativa
- Podrás identificar correctamente quiénes están realmente inactivos vs activos
