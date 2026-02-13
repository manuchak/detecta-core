

## Fix: RLS policy de `documentos_custodio` falla por formato de telefono

### Problema raiz

La politica RLS "Custodios gestionan documentos propios" compara directamente:

```
custodio_telefono = (SELECT profiles.phone FROM profiles WHERE profiles.id = auth.uid())
```

Pero el codigo normaliza el telefono antes de insertar (quita espacios y caracteres no numericos):
- `profiles.phone` almacena: `"56 5351 6083"` (con espacios)
- El codigo inserta `custodio_telefono` como: `"5653516083"` (normalizado, solo digitos)

Como `"5653516083" != "56 5351 6083"`, el RLS rechaza el INSERT.

### Solucion

Crear una funcion SQL que normalice el telefono (extraiga solo digitos, ultimos 10) y actualizar la politica RLS para usar esa funcion en ambos lados de la comparacion.

### Cambios

**1. Crear funcion SQL `normalize_phone`**

```sql
CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT right(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10)
$$;
```

**2. Reemplazar la politica RLS**

Eliminar la politica actual y crear una nueva que use `normalize_phone()` en ambos lados:

```sql
DROP POLICY "Custodios gestionan documentos propios" ON documentos_custodio;

CREATE POLICY "Custodios gestionan documentos propios"
ON documentos_custodio FOR ALL
USING (
  normalize_phone(custodio_telefono) = (
    SELECT normalize_phone(profiles.phone)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  normalize_phone(custodio_telefono) = (
    SELECT normalize_phone(profiles.phone)
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);
```

### Por que esto funciona

- `normalize_phone("56 5351 6083")` retorna `"5653516083"`
- `normalize_phone("5653516083")` retorna `"5653516083"`
- Ahora ambos lados coinciden, y el INSERT pasa el chequeo RLS

### Sin cambios en el frontend

No se necesita modificar ningun archivo TypeScript. El fix es puramente en la base de datos (SQL).

