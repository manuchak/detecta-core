

# Plan: Corregir BUG-002 - RPC check_duplicate_service_ids

## Diagnóstico

**Error encontrado:**
```json
{
  "code": "42804",
  "details": "Returned type text does not match expected type timestamp with time zone in column 4.",
  "message": "structure of query does not match function result type"
}
```

**Causa raíz:**
- La columna `servicios_custodia.created_at` es de tipo **TEXT**, no `TIMESTAMP WITH TIME ZONE`
- La función `check_duplicate_service_ids()` está declarada para retornar `latest_date TIMESTAMP WITH TIME ZONE`
- Cuando ejecuta `MAX(sc.created_at)`, PostgreSQL retorna TEXT porque esa es la columna origen
- PostgREST detecta el mismatch de tipos y devuelve error 400

## Solución

Modificar la función RPC para castear explícitamente el campo `created_at` a `TIMESTAMP WITH TIME ZONE`:

```sql
MAX(sc.created_at::TIMESTAMP WITH TIME ZONE) as latest_date
```

## Cambios Técnicos

### Archivo: Nueva migración SQL

```sql
-- Corregir RPC check_duplicate_service_ids: cast TEXT → TIMESTAMPTZ
CREATE OR REPLACE FUNCTION check_duplicate_service_ids()
RETURNS TABLE(
  id_servicio TEXT,
  duplicate_count BIGINT,
  service_ids BIGINT[],
  latest_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id_servicio::TEXT,
    COUNT(*)::BIGINT as duplicate_count,
    array_agg(sc.id ORDER BY sc.created_at DESC)::BIGINT[] as service_ids,
    MAX(sc.created_at::TIMESTAMP WITH TIME ZONE) as latest_date  -- FIX: cast explícito
  FROM public.servicios_custodia sc
  WHERE sc.id_servicio IS NOT NULL
  GROUP BY sc.id_servicio
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, MAX(sc.created_at::TIMESTAMP WITH TIME ZONE) DESC;
END;
$$;

-- Refrescar caché de PostgREST
NOTIFY pgrst, 'reload schema';
```

## Impacto

| Aspecto | Antes | Después |
|---------|-------|---------|
| Estado RPC | Error 400 | Funcional |
| Dashboard Planeación | Crashea al cargar | Carga correctamente |
| Detección duplicados | Inoperativa | Operativa |

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| Nueva migración SQL | Recrear función con cast correcto |

## Riesgo

**Bajo** - Solo modifica el tipo de conversión en la función, no afecta datos existentes ni otras tablas.

