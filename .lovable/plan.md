

# Fix: Nombres en diálogo de Pausa

## Diagnóstico

El diálogo de pausa muestra IDs truncados (`4e32f256`, `884a0e4c`) en lugar de nombres. La causa es la misma que en el handoff: la política RLS `monitoring_read_monitoring_profiles` que acabamos de crear en la migración anterior debería resolver esto una vez aplicada.

Sin embargo, si la migración ya fue aplicada y aún se ven IDs, puede haber un conflicto o la función `has_monitoring_role()` no reconoce al usuario actual. Verificaremos que la política esté activa.

## Cambios

### 1. Verificar/reforzar la política RLS en `profiles`
Confirmar que la migración anterior se aplicó correctamente. Si no, incluir la política nuevamente.

### 2. `PauseConfirmDialog.tsx` — Mejorar UX informativa
El usuario no debe intervenir en la redistribución — solo se le informa. Actualmente ya es informativo (muestra badges con nombres), pero ajustaremos el texto para dejarlo más claro:
- Cambiar "se redistribuirán a:" por "se redistribuirán automáticamente a:"
- El checkbox de confirmación se mantiene como requisito de aceptación

### 3. `useMonitoristaPause.ts` — Fallback robusto para nombres
Agregar un fallback adicional: si la query a `profiles` falla por RLS, usar la función `get_monitoring_user_ids()` con un join server-side, o bien hacer un RPC que devuelva id+nombre.

| Archivo | Cambio |
|---------|--------|
| `PauseConfirmDialog.tsx` | Texto más claro: "redistribución automática" |
| `useMonitoristaPause.ts` | Fallback robusto si profiles no resuelve nombres |
| Migración SQL (si necesaria) | Verificar/re-aplicar política `monitoring_read_monitoring_profiles` |

