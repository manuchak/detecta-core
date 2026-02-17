
## Trigger inverso: sincronizar telefono desde custodios_operativos hacia profiles

### Contexto

Actualmente existe `trg_sync_profile_phone` que propaga cambios de telefono de `profiles` a `custodios_operativos` y `servicios_planificados`. Pero cuando se edita el telefono directamente en `custodios_operativos` (por ejemplo desde el panel de admin), el cambio **no se refleja** en `profiles`, causando que el custodio no vea sus servicios al iniciar sesion.

### Solucion

Crear una funcion y trigger en `custodios_operativos` que, al detectar un cambio en la columna `telefono`, busque el perfil correspondiente via `email` y actualice `profiles.phone`.

### SQL de la migracion

```sql
CREATE OR REPLACE FUNCTION sync_operativo_phone_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_new TEXT;
  normalized_old TEXT;
BEGIN
  -- Solo actuar si el telefono cambio
  IF NEW.telefono IS NOT DISTINCT FROM OLD.telefono THEN
    RETURN NEW;
  END IF;

  normalized_new := RIGHT(regexp_replace(COALESCE(NEW.telefono, ''), '[^0-9]', '', 'g'), 10);
  normalized_old := RIGHT(regexp_replace(COALESCE(OLD.telefono, ''), '[^0-9]', '', 'g'), 10);

  IF normalized_new = normalized_old OR length(normalized_new) < 10 THEN
    RETURN NEW;
  END IF;

  -- Actualizar profiles vinculado por email
  UPDATE profiles
  SET phone = normalized_new,
      updated_at = now()
  WHERE LOWER(email) = LOWER(NEW.email);

  -- Tambien propagar a servicios_planificados pendientes
  IF normalized_old != '' AND length(normalized_old) = 10 THEN
    UPDATE servicios_planificados
    SET custodio_telefono = normalized_new
    WHERE custodio_telefono = normalized_old
      AND fecha_hora_cita >= now()
      AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_operativo_phone_to_profile ON custodios_operativos;
CREATE TRIGGER trg_sync_operativo_phone_to_profile
  AFTER UPDATE OF telefono ON custodios_operativos
  FOR EACH ROW
  EXECUTE FUNCTION sync_operativo_phone_to_profile();
```

### Detalles tecnicos

- **Vinculacion**: Se usa `LOWER(email)` para encontrar el perfil correspondiente, ya que `custodios_operativos` no tiene columna `user_id`.
- **SECURITY DEFINER**: Necesario para que el trigger pueda escribir en `profiles` sin depender de los permisos del usuario que dispara el UPDATE.
- **Proteccion contra loops**: El trigger de `profiles` (`trg_sync_profile_phone`) verifica `IF NEW.phone IS NOT DISTINCT FROM OLD.phone` antes de actuar. Como este trigger inverso escribe el valor normalizado y el trigger de profiles normaliza tambien, al comparar seran iguales y no se disparara un ciclo infinito.
- **Propagacion a servicios**: Tambien actualiza `servicios_planificados` pendientes con el telefono anterior, igual que hace el trigger directo.

### Archivos afectados

Solo se crea una migracion SQL. No se requieren cambios en codigo frontend.

### Riesgo

Bajo. La unica consideracion es el potencial loop entre triggers, que esta resuelto por las guardas `IS NOT DISTINCT FROM` en ambas funciones.
