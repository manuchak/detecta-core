

# Clave de No Amago — Palabra del Día en Bitácora

## Concepto
Una contraseña diaria visible en la barra de la bitácora que los monitoristas usan para verificar que un custodio no está bajo coacción. Cambia automáticamente a medianoche (CDMX). Se almacena en una tabla para tener historial y consistencia entre todos los usuarios.

## Cambios

### 1. Tabla `bitacora_clave_no_amago`

```sql
CREATE TABLE bitacora_clave_no_amago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL UNIQUE,  -- una clave por día
  palabra text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- RLS: SELECT para has_monitoring_role()
```

### 2. Batería de 200 palabras (constante en código)

Array de 200 palabras neutrales y fáciles de recordar (ej: "horizonte", "crepúsculo", "ventana", "diamante"...). Se usa como fuente para generar la palabra del día.

### 3. Lógica de selección diaria

- Hook `useClaveNoAmago()`:
  1. Query la tabla por `fecha = hoy (CDMX timezone)`
  2. Si no existe registro para hoy → selecciona palabra aleatoria (seed basado en fecha para consistencia), inserta en tabla, retorna
  3. Si existe → retorna la palabra
  4. Refresh automático a medianoche con `setTimeout`

### 4. UI en `MonitoristaAssignmentBar.tsx`

Después de "Hoja de Seguimiento", agregar un badge prominente con la clave del día:

```text
[🔴 Hoja de Seguimiento]  [🔒 NO AMAGO: HORIZONTE]  ───── [chips monitoristas] [botones]
```

- Badge con fondo amber/yellow, texto grande y bold, icono de escudo
- Siempre visible para todos los que acceden a la bitácora
- Tooltip explicando su propósito

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Crear `bitacora_clave_no_amago` + RLS |
| `src/hooks/useClaveNoAmago.ts` | Nuevo: query/insert palabra del día, auto-refresh a medianoche |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | Badge prominente con la clave después de "Hoja de Seguimiento" |

