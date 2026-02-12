

## Fix: Email de custodio no se sincroniza al perfil operativo

### Diagnostico

El email de Alvaro Toriz (`toriztovaralvaro@gmail.com`) existe en `candidatos_custodios` pero es `null` en `custodios_operativos`. Esto afecta a **85 operativos** que tienen email en `candidatos_custodios` pero no en `custodios_operativos`.

**Causa raiz**: No existe un mecanismo de sincronizacion que propague el email desde las tablas fuente (`candidatos_custodios`, `profiles`, `auth.users`) hacia `custodios_operativos` despues de la creacion inicial. El registro operativo de Alvaro fue creado en septiembre 2025 (probablemente por import masivo sin email), y su candidatura con email se creo en diciembre 2025. La funcion de liberacion si incluye email, pero no se re-ejecuto para este registro.

### Solucion: 2 partes

---

### Parte 1: Backfill - Actualizar los 85 registros existentes (SQL one-time)

Migrar emails desde `candidatos_custodios` hacia `custodios_operativos` donde el telefono coincida y el email este vacio:

```sql
UPDATE custodios_operativos co
SET email = cc.email, updated_at = NOW()
FROM candidatos_custodios cc
WHERE cc.telefono = co.telefono
  AND co.email IS NULL
  AND cc.email IS NOT NULL;
```

---

### Parte 2: Trigger de sincronizacion continua

Crear un trigger en `candidatos_custodios` que propague cambios de email automaticamente a `custodios_operativos`:

```sql
CREATE OR REPLACE FUNCTION sync_candidato_email_to_operativo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND (OLD.email IS NULL OR NEW.email != OLD.email) THEN
    UPDATE custodios_operativos
    SET email = NEW.email, updated_at = NOW()
    WHERE telefono = NEW.telefono
      AND (email IS NULL OR email != NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_email_candidato_to_operativo
AFTER UPDATE OF email ON candidatos_custodios
FOR EACH ROW
EXECUTE FUNCTION sync_candidato_email_to_operativo();
```

---

### Cambios por archivo

| Archivo / Recurso | Cambio |
|---|---|
| SQL Migration | (1) Backfill de emails existentes. (2) Trigger para sincronizacion futura. |

No se requieren cambios en el frontend: el perfil operativo ya muestra `profile.email` correctamente en `PerfilHeader.tsx` y `InformacionPersonalTab.tsx`. El problema es que el dato esta `null` en la tabla fuente.

### Impacto

- 85 operativos recibiran su email inmediatamente
- Cualquier actualizacion futura de email en `candidatos_custodios` se propagara automaticamente a `custodios_operativos`
- El perfil de Alvaro Toriz mostrara `toriztovaralvaro@gmail.com` sin cambios de codigo

