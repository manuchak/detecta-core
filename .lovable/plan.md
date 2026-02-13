

## Cambiar cutoff de 15 dias a 7 dias en pipeline de Candidatos

### Contexto

Actualmente hay **dos lugares** donde se aplica el cutoff de 15 dias para leads:

1. **Hook frontend**: `src/hooks/useSupplyPipelineCounts.ts` (linea 17) - usado por el breadcrumb del pipeline
2. **RPC en base de datos**: funcion `get_leads_counts()` - usada por los conteos de tabs (Por Contactar, En Proceso, etc.)

Ambos deben cambiarse a 7 dias para que los numeros sean consistentes.

### Cambios

| Recurso | Cambio |
|---|---|
| `src/hooks/useSupplyPipelineCounts.ts` linea 17 | `cutoff.setDate(cutoff.getDate() - 15)` a `cutoff.setDate(cutoff.getDate() - 7)` |
| RPC `get_leads_counts()` (migracion SQL) | `interval '15 days'` a `interval '7 days'` |

### Migracion SQL

```sql
CREATE OR REPLACE FUNCTION get_leads_counts()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  cutoff timestamptz := now() - interval '7 days';
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'approved', COUNT(*) FILTER (WHERE estado = 'aprobado'),
    'pending', COUNT(*) FILTER (WHERE estado NOT IN ('aprobado', 'rechazado', 'inactivo', 'custodio_activo') OR estado IS NULL),
    'rejected', COUNT(*) FILTER (WHERE estado = 'rechazado'),
    'uncontacted', COUNT(*) FILTER (WHERE asignado_a IS NULL AND estado NOT IN ('rechazado', 'inactivo', 'custodio_activo'))
  ) INTO result
  FROM leads
  WHERE created_at >= cutoff;

  RETURN result;
END;
$$;
```

### Resultado esperado

Los conteos del breadcrumb y las tabs mostraran solo leads de los ultimos 7 dias, alineandose con la carga de trabajo operativa real (~33-40 leads en vez de 135).
