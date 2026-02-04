
# Plan: Corregir Error de Actualización de Precios en Rutas

## Diagnóstico Realizado

### Causa Raíz del Error

El componente `QuickPriceEditModal.tsx` está intentando actualizar las columnas `margen_neto_calculado` y `porcentaje_utilidad` que son **GENERATED ALWAYS** en PostgreSQL:

```sql
-- Estas columnas se calculan automáticamente
margen_neto_calculado = (valor_bruto - precio_custodio - costo_operativo)
porcentaje_utilidad = CASE WHEN valor_bruto > 0 THEN (margen / valor_bruto) * 100 ELSE 0 END
```

PostgreSQL rechaza cualquier intento de escribir valores en columnas generadas, causando el error.

### Permisos RLS Verificados

Los permisos están correctamente configurados - `planificador` tiene acceso UPDATE:

| Rol | UPDATE | SELECT | INSERT |
|-----|--------|--------|--------|
| admin | ✅ | ✅ | ✅ |
| owner | ✅ | ✅ | ✅ |
| planificador | ✅ | ✅ | ✅ |
| supply_admin | ✅ | ✅ | ✅ |
| coordinador_operaciones | ✅ | ✅ | ✅ |

### Auditoría Faltante

Existe la tabla `matriz_precios_historial` pero **no hay trigger** que registre automáticamente los cambios.

---

## Solución

### Fix 1: Remover columnas generadas del UPDATE

Modificar `QuickPriceEditModal.tsx` para no incluir las columnas calculadas:

```typescript
// ACTUAL (líneas 63-72) - BUGGEADO
const { error } = await supabase
  .from('matriz_precios_rutas')
  .update({
    valor_bruto: valorBrutoNum,
    precio_custodio: precioCustodioNum,
    margen_neto_calculado: margenNeto,     // ❌ GENERATED ALWAYS
    porcentaje_utilidad: porcentajeMargen, // ❌ GENERATED ALWAYS
    updated_at: new Date().toISOString()
  })

// CORREGIDO
const { error } = await supabase
  .from('matriz_precios_rutas')
  .update({
    valor_bruto: valorBrutoNum,
    precio_custodio: precioCustodioNum,
    updated_at: new Date().toISOString()
  })
```

### Fix 2: Crear Trigger de Auditoría

Crear función y trigger para registrar automáticamente cambios en `matriz_precios_historial`:

```sql
CREATE OR REPLACE FUNCTION log_precio_ruta_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log cambio en valor_bruto
  IF OLD.valor_bruto IS DISTINCT FROM NEW.valor_bruto THEN
    INSERT INTO matriz_precios_historial (ruta_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (NEW.id, 'valor_bruto', OLD.valor_bruto, NEW.valor_bruto, auth.uid());
  END IF;
  
  -- Log cambio en precio_custodio
  IF OLD.precio_custodio IS DISTINCT FROM NEW.precio_custodio THEN
    INSERT INTO matriz_precios_historial (ruta_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (NEW.id, 'precio_custodio', OLD.precio_custodio, NEW.precio_custodio, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_precio_ruta_changes
AFTER UPDATE ON matriz_precios_rutas
FOR EACH ROW
EXECUTE FUNCTION log_precio_ruta_changes();
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Planeacion/components/routes/QuickPriceEditModal.tsx` | Remover `margen_neto_calculado` y `porcentaje_utilidad` del payload |
| Nueva migración SQL | Crear trigger `log_precio_ruta_changes` para auditoría automática |

---

## Resultado Esperado

1. **Planeación puede editar precios** sin errores
2. **Auditoría automática**: Cada cambio en `valor_bruto` o `precio_custodio` se registra con:
   - ID de la ruta
   - Campo modificado
   - Valor anterior y nuevo
   - Usuario que realizó el cambio
   - Timestamp

3. **Márgenes se calculan automáticamente** por la base de datos
