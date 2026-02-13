
## Fix: Custodio no ve sus servicios asignados

### Diagnóstico

Se identificaron **2 problemas** que causan que Cesar Palma (y probablemente todos los custodios) no vean sus servicios:

### Problema 1: RLS en `servicios_custodia` bloquea a custodios (CRÍTICO)

La política RLS para custodios en la tabla `servicios_custodia` requiere:

```
id_custodio = auth.uid()
```

Pero el campo `id_custodio` está **NULL** en todos los registros. Los servicios se identifican por teléfono (`telefono` / `telefono_operador`), no por UUID. Resultado: **0 servicios visibles** para cualquier usuario con rol `custodio`.

**Fix**: Modificar la política RLS `servicios_custodia_select_custodio_own` para que busque por teléfono del usuario en lugar de por `id_custodio`:

```sql
DROP POLICY "servicios_custodia_select_custodio_own" ON servicios_custodia;

CREATE POLICY "servicios_custodia_select_custodio_own"
ON servicios_custodia FOR SELECT
USING (
  user_has_role_direct('custodio') AND (
    telefono = replace(replace((SELECT phone FROM profiles WHERE id = auth.uid()), ' ', ''), '-', '')
    OR
    telefono_operador = replace(replace((SELECT phone FROM profiles WHERE id = auth.uid()), ' ', ''), '-', '')
  )
);
```

Esto normaliza el teléfono del perfil (quita espacios y guiones) y lo compara contra `telefono` y `telefono_operador`.

### Problema 2: `useCustodianServices` no normaliza el teléfono

**Archivo:** `src/hooks/useCustodianServices.ts`

El hook recibe `profile.phone` que es `"249 174 6505"` (con espacios) y lo pasa directo al query de Supabase. Pero la base de datos almacena `"2491746505"` (sin espacios).

**Fix**: Agregar normalización del teléfono al inicio de `fetchCustodianServices`:

```typescript
const normalizedPhone = custodianPhone.replace(/[\s-]/g, '');
```

Y usar `normalizedPhone` en el `.or()` filter en lugar de `custodianPhone`.

### Archivos a Modificar

| Archivo | Cambio |
|---|---|
| **SQL (RLS)** | Reemplazar política `servicios_custodia_select_custodio_own` para match por teléfono normalizado |
| **`src/hooks/useCustodianServices.ts`** | Normalizar teléfono antes de query (linea ~68) |

### Resultado

- Cesar Palma verá su servicio VALEC LOGISTICA de hoy (via `useNextService`, que ya normaliza)
- Verá sus 38 servicios históricos en el dashboard y en el historial
- Las stats (Servicios, Km, Ingresos) se calcularán correctamente
- Todos los custodios registrados podrán ver sus servicios
