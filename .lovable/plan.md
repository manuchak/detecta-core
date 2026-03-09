

# Pausa Interina: Comida, Baño y Descanso

## Tres tipos de pausa

| Tipo | Duración máx | Icono | Descripción |
|------|-------------|-------|-------------|
| `comida` | 60 min | ☕ | Hora de comida |
| `bano` | 10 min | 🚻 | Necesidad fisiológica |
| `descanso` | 10 min | 👁 | Descanso visual/atención para evitar fatiga |

## Flujo

1. Monitorista hace clic en **Pausa** → dropdown con 3 opciones
2. Dialog de confirmación: muestra cuántos servicios se redistribuyen y a quiénes
3. Al confirmar: servicios se redistribuyen equitativamente al staff en turno disponible
4. Barra cambia a **countdown timer** + botón **Retomar**
5. Monitorista hace clic en **Retomar** → servicios regresan a él
6. Si el timer llega a 0: badge se pone rojo (excedido), pero NO auto-retorna — requiere acción manual

## Cambios técnicos

### 1. Migración SQL: `bitacora_pausas_monitorista`

```sql
CREATE TABLE bitacora_pausas_monitorista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitorista_id uuid NOT NULL REFERENCES auth.users(id),
  tipo_pausa text NOT NULL CHECK (tipo_pausa IN ('comida', 'bano', 'descanso')),
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada', 'expirada')),
  servicios_redistribuidos jsonb NOT NULL DEFAULT '[]',
  inicio timestamptz NOT NULL DEFAULT now(),
  fin_esperado timestamptz NOT NULL,
  fin_real timestamptz,
  created_at timestamptz DEFAULT now()
);
```

RLS: SELECT/INSERT/UPDATE para usuarios con `has_monitoring_write_role()`.

### 2. `src/hooks/useMonitoristaPause.ts` (nuevo)

- **`pausaActiva`**: query para pausa `estado = 'activa'` del usuario actual
- **`iniciarPausa(tipo)`**: calcula `fin_esperado`, obtiene asignaciones activas, redistribuye con `distributeEquitably` al resto del staff (excluyendo otros en pausa), guarda mapping en `servicios_redistribuidos` para restaurar
- **`finalizarPausa()`**: desactiva asignaciones temporales, restaura originales, marca `estado = 'finalizada'`
- **Timer**: `useEffect` con `setInterval` cada segundo, expone `segundosRestantes` y `excedido`

### 3. `src/components/monitoring/bitacora/PauseConfirmDialog.tsx` (nuevo)

Dialog simple: tipo de pausa, duración máxima, cantidad de servicios, preview de redistribución, checkbox de confirmación.

### 4. `MonitoristaAssignmentBar.tsx` (actualizar)

- Sin pausa activa: botón **Pausa** con `DropdownMenu` → 3 opciones (Comida, Baño, Descanso)
- Con pausa activa: badge con countdown (naranja normal, rojo si excedido) + botón **Retomar**
- Vista coordinador: icono de pausa en chips de monitoristas que están en break

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Crear `bitacora_pausas_monitorista` + RLS |
| `src/hooks/useMonitoristaPause.ts` | Nuevo hook completo |
| `src/components/monitoring/bitacora/PauseConfirmDialog.tsx` | Nuevo dialog de confirmación |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | Botón pausa, countdown, retomar |

