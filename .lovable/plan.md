

# Detectar monitoristas realmente en línea (no solo con asignaciones activas)

## Problema

`en_turno` se calcula por heurística (actividad reciente + asignaciones formales). Los monitoristas del turno nocturno que no hicieron handoff formal siguen apareciendo como "en turno" porque sus asignaciones están `activo=true`.

Resultado: 6 monitoristas "activos" cuando solo 4 están logueados.

## Solución: Heartbeat de sesión

Agregar un mecanismo ligero donde cada monitorista logueado envía un "ping" periódico. Solo los que tienen heartbeat reciente (últimos 5 min) se consideran `en_turno`.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `useMonitoristaAssignment.ts` | Consultar `profiles.last_seen_at` (o tabla dedicada) para determinar `en_turno`. Solo marcar como activo si `last_seen_at` < 5 min |
| `MonitoristaAssignmentBar.tsx` | Agregar `useEffect` que ejecuta un upsert a `monitorista_heartbeat` cada 2 minutos con el `user_id` del monitorista logueado |
| Supabase | Nueva tabla `monitorista_heartbeat` con columnas `user_id (PK, FK)`, `last_ping (timestamptz)`, con RLS para que cada usuario solo actualice su propio registro |

### Lógica de `en_turno` (nueva)

```text
en_turno = heartbeat.last_ping > (now - 5 min)
```

Las asignaciones formales (`hasFormalAssignment`) ya no determinan presencia — solo el heartbeat. Un monitorista sin heartbeat reciente pero con asignaciones activas aparecerá en la sección "Servicios Abandonados" del coordinador, que ya existe.

### Heartbeat (en MonitoristaAssignmentBar)

```ts
useEffect(() => {
  if (!userId || !hasRole('monitoring')) return;
  const ping = () => supabase.from('monitorista_heartbeat')
    .upsert({ user_id: userId, last_ping: new Date().toISOString() });
  ping();
  const interval = setInterval(ping, 120_000); // cada 2 min
  return () => clearInterval(interval);
}, [userId]);
```

### Impacto

- Los 2 monitoristas nocturnos dejarán de aparecer como "en turno" inmediatamente (sin heartbeat)
- Sus servicios aparecerán automáticamente en "Servicios Abandonados" para reasignación
- El BalanceGuard funcionará correctamente porque solo contará monitoristas realmente presentes

