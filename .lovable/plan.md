

# Bug: Armados no aparecen en cortes — estado nunca transiciona a 'completado'

## Diagnóstico

**Datos en la base:**
- `asignacion_armados` tiene **388 registros en 'pendiente'** y **54 en 'cancelado'**
- **Cero registros con `estado_asignacion = 'completado'`** en toda la tabla

**Por qué:** Cuando un servicio de custodia se finaliza (`estado = 'Finalizado'`), no existe ningún trigger ni lógica que actualice el `estado_asignacion` de los armados vinculados en `asignacion_armados`. Los custodios aparecen porque se filtran por `servicios_custodia.estado = 'Finalizado'`, pero los armados se filtran por `asignacion_armados.estado_asignacion = 'completado'`, un estado al que nunca llegan.

**Impacto:** Afecta todos los módulos de facturación que dependen de armados completados:
- Generar Cortes Masivos (0 armados)
- Generar Corte Individual para armados
- CxP Proveedores de armados
- Estadísticas del portal móvil de armados

## Fix

### 1. Trigger automático: al finalizar servicio, completar sus armados (SQL Migration)

```sql
CREATE OR REPLACE FUNCTION sync_armado_estado_on_servicio_finalizado()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'Finalizado' AND OLD.estado IS DISTINCT FROM 'Finalizado' THEN
    UPDATE asignacion_armados
    SET estado_asignacion = 'completado',
        updated_at = NOW()
    WHERE servicio_custodia_id = NEW.id_servicio
      AND estado_asignacion IN ('pendiente', 'confirmado', 'en_curso', 'asignado', 'en_ruta')
      AND tipo_asignacion = 'interno';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_armado_estado_on_finalizado
AFTER UPDATE ON servicios_custodia
FOR EACH ROW
WHEN (NEW.estado = 'Finalizado' AND OLD.estado IS DISTINCT FROM 'Finalizado')
EXECUTE FUNCTION sync_armado_estado_on_servicio_finalizado();
```

### 2. Backfill: marcar como completados los armados de servicios ya finalizados (SQL Migration)

```sql
UPDATE asignacion_armados aa
SET estado_asignacion = 'completado', updated_at = NOW()
FROM servicios_custodia sc
WHERE aa.servicio_custodia_id = sc.id_servicio
  AND sc.estado = 'Finalizado'
  AND aa.estado_asignacion IN ('pendiente', 'confirmado', 'asignado')
  AND aa.tipo_asignacion = 'interno';
```

### 3. Fallback en query del modal masivo (código)

Como medida de resiliencia, modificar `GenerarCortesMasivosDialog.tsx` línea 68 para también aceptar armados cuyo servicio vinculado esté `Finalizado`, incluso si el estado de asignación no migró:

```typescript
.in('estado_asignacion', ['completado', 'confirmado', 'pendiente'])
```

Y luego filtrar en JS verificando que el servicio esté finalizado.

Pero con el trigger + backfill, esto es solo un safety net.

### Archivos a modificar
1. **SQL Migration**: Trigger `sync_armado_estado_on_servicio_finalizado` + backfill
2. **`GenerarCortesMasivosDialog.tsx`**: Ampliar filtro de estados como fallback

