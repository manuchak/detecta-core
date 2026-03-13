

# Fix: Dar acceso de lectura a `servicio_eventos_ruta` para roles de facturación

## Problema

Julia (rol `finanzas_admin`) accede correctamente al módulo Facturación → Operaciones → Tiempos Ops. Sin embargo, los datos no aparecen porque la tabla `servicio_eventos_ruta` tiene una política RLS SELECT que usa `has_monitoring_role()`, y esa función solo incluye roles de monitoreo/operaciones, no de facturación.

## Solución

Agregar una **nueva política RLS SELECT** en `servicio_eventos_ruta` que permita lectura a roles de facturación usando el helper existente `has_facturacion_role()`. Esto es más limpio que modificar `has_monitoring_role()` (no contaminar dominios).

### Migración SQL

```sql
-- Allow facturación roles to read route events (for Tiempos Ops panel)
CREATE POLICY "facturacion_read_eventos_ruta"
  ON public.servicio_eventos_ruta
  FOR SELECT
  TO authenticated
  USING (has_facturacion_role());
```

Esto cubre `finanzas_admin`, `facturacion_admin`, `bi`, `coordinador_operaciones`, `admin` y `owner` — exactamente los roles que ya tienen acceso al módulo de Facturación.

**Un solo archivo de migración. Sin cambios de frontend.**

