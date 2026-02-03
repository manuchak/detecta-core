
# Plan Fase 4: RPC Metricas 15 Dias - Implementacion Robusta

## Diagnostico del Estado Actual

### Problema Identificado
Los campos `servicios_locales_15d` y `servicios_foraneos_15d` existen en las tablas pero:
- Siempre tienen valor 0 (nunca se calculan)
- El `CustodianCard` lee estos campos con fallback a 0 (lineas 121-122)
- El RPC `verificar_disponibilidad_equitativa_custodio` no los calcula
- El RPC `get_custodios_activos_disponibles` no los incluye

### Clasificacion Local/Foraneo
Basado en datos de produccion:
- **Local**: `km_recorridos < 100`
- **Foraneo**: `km_recorridos >= 100`
- Distribucion actual (ultimos 30d): 298 locales, 374 foraneos, 41 sin datos

---

## Arquitectura de Solucion

### Opcion A: Calculo en Tiempo Real (RPC) - RECOMENDADA
- Precision: 100% (siempre datos actualizados)
- Performance: Impacto moderado (1 query adicional por custodio)
- Complejidad: Media

### Opcion B: Campos Desnormalizados + Trigger
- Precision: Alta (actualizado en cada servicio)
- Performance: Excelente (lectura directa)
- Complejidad: Alta (trigger en 2 tablas)

### Decision: Implementar AMBAS
1. RPC para calculo en tiempo real durante asignacion
2. Trigger para mantener campos actualizados para dashboards/reportes

---

## Parte A: RPC `calcular_metricas_15d_operativo`

### A.1 Especificacion de la Funcion

```sql
CREATE OR REPLACE FUNCTION calcular_metricas_15d_operativo(
  p_operativo_id UUID,
  p_operativo_tipo TEXT -- 'custodio' | 'armado'
) RETURNS JSONB
```

### A.2 Logica de Negocio Detallada

```text
1. Parametros de entrada:
   - p_operativo_id: UUID del custodio o armado
   - p_operativo_tipo: 'custodio' o 'armado'

2. Busqueda en servicios_custodia (ultimos 15 dias):
   WHERE fecha_hora_cita >= NOW() - INTERVAL '15 days'
   AND estado NOT IN ('cancelado', 'cancelled')
   AND (
     (p_operativo_tipo = 'custodio' AND (id_custodio = p_operativo_id::text OR nombre_custodio = nombre_operativo))
     OR
     (p_operativo_tipo = 'armado' AND armado_asignado = nombre_operativo)
   )

3. Clasificacion por km_recorridos:
   - local_count: COUNT WHERE km_recorridos IS NOT NULL AND km_recorridos < 100
   - foraneo_count: COUNT WHERE km_recorridos IS NOT NULL AND km_recorridos >= 100
   - sin_datos_count: COUNT WHERE km_recorridos IS NULL

4. Busqueda adicional en servicios_planificados:
   - Solo servicios finalizados o en curso
   - Misma logica de clasificacion

5. Retorno:
   {
     "servicios_locales_15d": local_count,
     "servicios_foraneos_15d": foraneo_count,
     "total_servicios_15d": total,
     "sin_clasificar_15d": sin_datos_count,
     "fecha_calculo": NOW()
   }
```

### A.3 Codigo SQL Completo

```sql
CREATE OR REPLACE FUNCTION public.calcular_metricas_15d_operativo(
  p_operativo_id UUID,
  p_operativo_tipo TEXT DEFAULT 'custodio'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  nombre_operativo TEXT;
  servicios_locales INTEGER := 0;
  servicios_foraneos INTEGER := 0;
  servicios_sin_clasificar INTEGER := 0;
  fecha_limite TIMESTAMPTZ;
BEGIN
  -- Calcular fecha limite (15 dias atras)
  fecha_limite := NOW() - INTERVAL '15 days';

  -- Obtener nombre del operativo para busqueda por nombre
  IF p_operativo_tipo = 'custodio' THEN
    SELECT nombre INTO nombre_operativo
    FROM custodios_operativos
    WHERE id = p_operativo_id;
  ELSE
    SELECT nombre INTO nombre_operativo
    FROM armados_operativos
    WHERE id = p_operativo_id;
  END IF;

  -- Si no se encuentra el operativo, retornar valores por defecto
  IF nombre_operativo IS NULL THEN
    RETURN jsonb_build_object(
      'servicios_locales_15d', 0,
      'servicios_foraneos_15d', 0,
      'total_servicios_15d', 0,
      'sin_clasificar_15d', 0,
      'fecha_calculo', NOW(),
      'error', 'Operativo no encontrado'
    );
  END IF;

  -- Contar servicios en servicios_custodia
  IF p_operativo_tipo = 'custodio' THEN
    SELECT 
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos < 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos >= 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NULL THEN 1 ELSE 0 END), 0)
    INTO servicios_locales, servicios_foraneos, servicios_sin_clasificar
    FROM servicios_custodia
    WHERE (id_custodio = p_operativo_id::text OR nombre_custodio = nombre_operativo)
      AND fecha_hora_cita >= fecha_limite
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');
  ELSE
    -- Para armados, buscar por nombre en armado_asignado
    SELECT 
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos < 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NOT NULL AND km_recorridos >= 100 THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN km_recorridos IS NULL THEN 1 ELSE 0 END), 0)
    INTO servicios_locales, servicios_foraneos, servicios_sin_clasificar
    FROM servicios_custodia
    WHERE armado_asignado = nombre_operativo
      AND fecha_hora_cita >= fecha_limite
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');
  END IF;

  RETURN jsonb_build_object(
    'servicios_locales_15d', servicios_locales,
    'servicios_foraneos_15d', servicios_foraneos,
    'total_servicios_15d', servicios_locales + servicios_foraneos + servicios_sin_clasificar,
    'sin_clasificar_15d', servicios_sin_clasificar,
    'fecha_calculo', NOW()
  );
END;
$function$;
```

### A.4 Manejo de Edge Cases

| Caso | Comportamiento | Justificacion |
|------|----------------|---------------|
| `km_recorridos IS NULL` | Contar como "sin_clasificar" | No asumir tipo, reportar en metricas |
| Operativo no existe | Retornar zeros + error flag | No romper flujo, loguear |
| Sin servicios en 15d | Retornar zeros | Comportamiento esperado para nuevos |
| Busqueda por ID falla | Fallback a busqueda por nombre | Compatibilidad con datos legacy |

---

## Parte B: Actualizacion de RPC `verificar_disponibilidad_equitativa_custodio`

### B.1 Cambios Requeridos

Agregar llamada al nuevo RPC dentro de la funcion existente para incluir metricas 15d en la respuesta.

### B.2 Codigo de Modificacion

```sql
-- Al final de la funcion, antes del RETURN, agregar:

-- Calcular metricas de 15 dias
DECLARE
  metricas_15d JSONB;
BEGIN
  metricas_15d := calcular_metricas_15d_operativo(p_custodio_id, 'custodio');
  
  -- Agregar al resultado
  resultado := resultado || jsonb_build_object(
    'servicios_locales_15d', metricas_15d->>'servicios_locales_15d',
    'servicios_foraneos_15d', metricas_15d->>'servicios_foraneos_15d',
    'metricas_15d', metricas_15d
  );
END;
```

### B.3 Consideraciones de Performance

- El RPC ya hace multiples queries por custodio
- Agregar 1 query adicional es aceptable
- Total estimado: +50-100ms por custodio
- Para 100 custodios: +5-10s (paralelo mitiga esto)

---

## Parte C: Trigger para Actualizacion Automatica

### C.1 Proposito

Mantener los campos `servicios_locales_15d` y `servicios_foraneos_15d` actualizados en las tablas de operativos para:
- Dashboards de monitoreo
- Reportes de equidad
- Filtros rapidos sin RPC

### C.2 Funcion del Trigger

```sql
CREATE OR REPLACE FUNCTION actualizar_metricas_15d_operativo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  custodio_uuid UUID;
  metricas JSONB;
BEGIN
  -- Solo procesar si hay custodio asignado
  IF NEW.id_custodio IS NOT NULL THEN
    -- Intentar convertir a UUID
    BEGIN
      custodio_uuid := NEW.id_custodio::UUID;
    EXCEPTION WHEN OTHERS THEN
      -- Si no es UUID valido, buscar por nombre
      SELECT id INTO custodio_uuid
      FROM custodios_operativos
      WHERE nombre = NEW.nombre_custodio
      LIMIT 1;
    END;

    IF custodio_uuid IS NOT NULL THEN
      -- Calcular metricas
      metricas := calcular_metricas_15d_operativo(custodio_uuid, 'custodio');
      
      -- Actualizar tabla de custodios
      UPDATE custodios_operativos
      SET 
        servicios_locales_15d = (metricas->>'servicios_locales_15d')::INT,
        servicios_foraneos_15d = (metricas->>'servicios_foraneos_15d')::INT,
        fecha_calculo_15d = NOW()
      WHERE id = custodio_uuid;
    END IF;
  END IF;

  -- Repetir para armado si aplica
  IF NEW.armado_asignado IS NOT NULL THEN
    -- Similar logica para armados...
  END IF;

  RETURN NEW;
END;
$function$;
```

### C.3 Creacion del Trigger

```sql
-- Trigger en servicios_custodia
CREATE TRIGGER trg_actualizar_metricas_15d_servicio
AFTER INSERT OR UPDATE OF estado, km_recorridos
ON servicios_custodia
FOR EACH ROW
EXECUTE FUNCTION actualizar_metricas_15d_operativo();
```

### C.4 Riesgo: Cascada de Actualizaciones

**Problema potencial**: Si muchos servicios se actualizan simultaneamente, el trigger puede causar bloqueos.

**Mitigacion**:
1. Usar `pg_advisory_lock` para serializar actualizaciones por custodio
2. Agregar debounce: solo actualizar si `fecha_calculo_15d < NOW() - INTERVAL '5 minutes'`
3. Considerar cron job nocturno en lugar de trigger

### C.5 Alternativa: Cron Job Nocturno

```sql
-- Funcion para actualizar todos los operativos
CREATE OR REPLACE FUNCTION actualizar_todas_metricas_15d()
RETURNS INTEGER
LANGUAGE plpgsql
AS $function$
DECLARE
  contador INTEGER := 0;
  rec RECORD;
  metricas JSONB;
BEGIN
  -- Actualizar custodios activos
  FOR rec IN SELECT id FROM custodios_operativos WHERE estado = 'activo' LOOP
    metricas := calcular_metricas_15d_operativo(rec.id, 'custodio');
    
    UPDATE custodios_operativos
    SET 
      servicios_locales_15d = (metricas->>'servicios_locales_15d')::INT,
      servicios_foraneos_15d = (metricas->>'servicios_foraneos_15d')::INT,
      fecha_calculo_15d = NOW()
    WHERE id = rec.id;
    
    contador := contador + 1;
  END LOOP;

  -- Similar para armados
  FOR rec IN SELECT id FROM armados_operativos WHERE estado = 'activo' LOOP
    metricas := calcular_metricas_15d_operativo(rec.id, 'armado');
    
    UPDATE armados_operativos
    SET 
      servicios_locales_15d = (metricas->>'servicios_locales_15d')::INT,
      servicios_foraneos_15d = (metricas->>'servicios_foraneos_15d')::INT,
      fecha_calculo_15d = NOW()
    WHERE id = rec.id;
    
    contador := contador + 1;
  END LOOP;

  RETURN contador;
END;
$function$;
```

---

## Parte D: Integracion en Frontend

### D.1 Actualizar `useProximidadOperacional.ts`

**Ubicacion**: Lineas 248-314 (procesamiento de datos del RPC)

**Cambios**:

```typescript
// En el procesamiento de disponibilidadEquitativa
if (disponibilidadEquitativa) {
  // ... codigo existente ...
  
  // NUEVO: Extraer metricas 15d del RPC
  custodioProcessed.servicios_locales_15d = 
    disponibilidadEquitativa.servicios_locales_15d || 0;
  custodioProcessed.servicios_foraneos_15d = 
    disponibilidadEquitativa.servicios_foraneos_15d || 0;
}
```

### D.2 Actualizar tipo `CustodioConProximidad`

**Ubicacion**: Lineas 25-52

**Agregar**:

```typescript
export interface CustodioConProximidad extends CustodioConHistorial {
  // ... campos existentes ...
  
  // Metricas de actividad 15 dias
  servicios_locales_15d?: number;
  servicios_foraneos_15d?: number;
  fecha_calculo_15d?: string;
}
```

### D.3 Verificar `CustodianCard.tsx`

**Estado actual** (lineas 121-122):
```typescript
const serviciosLocales15d = (custodio as any).servicios_locales_15d || 0;
const serviciosForaneos15d = (custodio as any).servicios_foraneos_15d || 0;
```

**Cambio requerido**: Ninguno - ya maneja el caso con fallback a 0. Solo necesitamos pasar los datos desde el hook.

---

## Parte E: Migracion SQL Completa

### E.1 Archivo de Migracion

**Nombre**: `YYYYMMDD_fase4_metricas_15d_operativos.sql`

**Contenido**:

```sql
-- Fase 4: Sistema de Metricas 15 Dias para Operativos
-- Incluye: RPC de calculo, trigger de actualizacion, funcion batch

-- 1. Crear funcion RPC para calcular metricas 15d
CREATE OR REPLACE FUNCTION public.calcular_metricas_15d_operativo(
  p_operativo_id UUID,
  p_operativo_tipo TEXT DEFAULT 'custodio'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- ... codigo completo de la seccion A.3 ...
$function$;

-- 2. Actualizar RPC verificar_disponibilidad_equitativa_custodio
-- (Nuevo archivo completo con metricas 15d incluidas)

-- 3. Crear funcion para actualizacion batch
CREATE OR REPLACE FUNCTION public.actualizar_todas_metricas_15d()
RETURNS INTEGER
LANGUAGE plpgsql
AS $function$
-- ... codigo de seccion C.5 ...
$function$;

-- 4. Ejecutar actualizacion inicial de todos los operativos
SELECT actualizar_todas_metricas_15d();

-- 5. (OPCIONAL) Crear trigger para actualizacion en tiempo real
-- Descomentar si se desea actualizacion automatica por servicio
-- CREATE TRIGGER trg_actualizar_metricas_15d_servicio
-- AFTER INSERT OR UPDATE OF estado, km_recorridos
-- ON servicios_custodia
-- FOR EACH ROW
-- EXECUTE FUNCTION actualizar_metricas_15d_operativo();
```

---

## Secuencia de Implementacion

### Orden de Archivos

| # | Archivo | Tipo | Descripcion |
|---|---------|------|-------------|
| 1 | `supabase/migrations/XXXX_fase4_metricas_15d.sql` | Crear | RPC + funcion batch |
| 2 | `supabase/migrations/XXXX_fase4_rpc_equitativo_v2.sql` | Crear | RPC actualizado con metricas |
| 3 | `src/hooks/useProximidadOperacional.ts` | Modificar | Extraer metricas 15d |

### Pasos de Validacion

1. **Ejecutar migracion** y verificar que el RPC `calcular_metricas_15d_operativo` funciona
2. **Probar manualmente** con un custodio conocido:
   ```sql
   SELECT calcular_metricas_15d_operativo('uuid-del-custodio', 'custodio');
   ```
3. **Ejecutar batch inicial** para poblar campos:
   ```sql
   SELECT actualizar_todas_metricas_15d();
   ```
4. **Verificar datos**:
   ```sql
   SELECT nombre, servicios_locales_15d, servicios_foraneos_15d 
   FROM custodios_operativos 
   WHERE estado = 'activo' 
   ORDER BY servicios_locales_15d + servicios_foraneos_15d DESC 
   LIMIT 10;
   ```

---

## Prevencion de Bugs

### Bug 1: Division por Cero
**Riesgo**: Calculos de porcentaje con `total_servicios_15d = 0`
**Mitigacion**: Usar `NULLIF(total, 0)` o condicional en frontend

### Bug 2: Datos Stale
**Riesgo**: Campos desnormalizados desactualizados
**Mitigacion**: 
- Mostrar `fecha_calculo_15d` en tooltip
- Cron job diario para refrescar

### Bug 3: Race Condition en Trigger
**Riesgo**: Multiples servicios actualizando mismo custodio
**Mitigacion**: 
- Usar `pg_advisory_xact_lock(p_custodio_id::bigint)` en trigger
- O preferir cron job sobre trigger

### Bug 4: Performance Degradation
**Riesgo**: RPC lento con muchos custodios
**Mitigacion**:
- Ya implementado: procesamiento en batches con timeout
- Opcional: cache de metricas en Redis/memory

### Bug 5: Tipo Incorrecto de Servicio
**Riesgo**: `km_recorridos` incorrecto clasifica mal el servicio
**Mitigacion**:
- Campo `sin_clasificar_15d` para visibilidad
- Regla de negocio clara: NULL = no clasificado (no asumimos local)

---

## Testing Plan

### Tests Unitarios (Manual SQL)

```sql
-- Test 1: Custodio sin servicios
SELECT calcular_metricas_15d_operativo('uuid-nuevo-custodio', 'custodio');
-- Esperado: todos en 0

-- Test 2: Custodio con servicios mixtos
SELECT calcular_metricas_15d_operativo('uuid-custodio-activo', 'custodio');
-- Esperado: suma de locales + foraneos > 0

-- Test 3: ID invalido
SELECT calcular_metricas_15d_operativo('00000000-0000-0000-0000-000000000000', 'custodio');
-- Esperado: error flag, no crash

-- Test 4: Tipo incorrecto
SELECT calcular_metricas_15d_operativo('uuid-custodio', 'invalido');
-- Esperado: retorna 0s (armado no encontrado)
```

### Test de Integracion (Frontend)

1. Abrir flujo de asignacion de servicio
2. Verificar que `ServiceHistoryBadges` muestra datos reales (no 0/0)
3. Comparar con query manual para validar precision

---

## Archivos a Crear/Modificar

| Archivo | Accion | Prioridad |
|---------|--------|-----------|
| `supabase/migrations/XXXX_fase4_rpc_metricas_15d.sql` | **Crear** | Alta |
| `supabase/migrations/XXXX_fase4_rpc_equitativo_actualizado.sql` | **Crear** | Alta |
| `src/hooks/useProximidadOperacional.ts` | Modificar | Alta |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx` | Verificar | Media |

---

## Resumen de Entregables

1. **RPC `calcular_metricas_15d_operativo`**: Calculo en tiempo real de servicios locales/foraneos
2. **RPC `verificar_disponibilidad_equitativa_custodio` actualizado**: Incluye metricas 15d en respuesta
3. **Funcion batch `actualizar_todas_metricas_15d`**: Para ejecucion nocturna via cron
4. **Hook actualizado**: Extrae y pasa metricas al componente
5. **Datos iniciales poblados**: Ejecucion del batch en migracion

---

## Notas Tecnicas

1. **Clasificacion Local/Foraneo**: `km_recorridos < 100` = local, `>= 100` = foraneo, `NULL` = sin clasificar
2. **Ventana temporal**: 15 dias calendario hacia atras desde NOW()
3. **Fuentes de datos**: Principalmente `servicios_custodia`, opcionalmente `servicios_planificados` finalizados
4. **Performance**: RPC adicional agrega ~50-100ms por custodio, aceptable dado el procesamiento en paralelo existente
