

# Diagnóstico: Pausa de Karla rota + Overlay invisible

## Problemas identificados

### 1. Integridad de datos rota (raíz del problema)
La mutación `iniciarPausa` ejecuta ~10 operaciones secuenciales sin transacción:
1. Desactiva asignaciones originales de Karla
2. Crea asignaciones temporales (con `notas_handoff: 'pausa_interina'`)
3. Inserta registro en `bitacora_pausas_monitorista`

Si el paso 3 falla (o el navegador pierde conexión entre pasos 2 y 3), las asignaciones quedan desactivadas pero **no existe registro de pausa**. Esto es exactamente lo que veo en los datos:
- Hay asignaciones con `notas_handoff: 'pausa_interina'` apuntando a Karla como `asignado_por`
- Pero `bitacora_pausas_monitorista?estado=eq.activa` retorna `[]`

Karla queda en limbo: sus servicios fueron redistribuidos pero no hay pausa activa que revertir.

### 2. Overlay no se muestra
`showPauseOverlay = !!pausaActiva && isMonitorista && !isAdminOrCoord` — como no hay registro de pausa activa en la DB, `pausaActiva` es `null` y el overlay nunca se renderiza. Esto es consecuencia del problema 1.

### 3. No hay mecanismo de recuperación para coordinadores
No existe acción para que un admin/coordinador fuerce la finalización de una pausa rota o restaure manualmente las asignaciones de un monitorista.

## Plan de corrección

### A. Edge function transaccional para iniciar pausa
Mover la lógica de `iniciarPausa` a una edge function que ejecute todo en una transacción SQL. Si cualquier paso falla, se revierte todo.

**Archivo nuevo:** `supabase/functions/iniciar-pausa-monitorista/index.ts`
- Recibe `{ tipo_pausa }` + auth del usuario
- Ejecuta en una sola transacción SQL:
  1. Obtener asignaciones activas del monitorista
  2. Obtener monitoristas disponibles (heartbeat + no pausados)
  3. Desactivar asignaciones originales
  4. Crear asignaciones temporales
  5. Insertar registro de pausa
- Si cualquier paso falla → ROLLBACK automático

### B. Edge function para finalizar pausa (retomar)
**Archivo nuevo:** `supabase/functions/finalizar-pausa-monitorista/index.ts`
- Recibe `{ pausa_id? }` (opcional para coordinadores) o usa el auth del usuario
- Transacción:
  1. Obtener pausa activa
  2. Desactivar asignaciones temporales
  3. Restaurar asignaciones originales
  4. Marcar pausa como finalizada

### C. Acción de coordinador para forzar fin de pausa
**Archivo modificado:** `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx`
- En la vista de coordinador, junto al badge de "En pausa" de cada monitorista, agregar botón "Forzar retorno" que llama a la edge function con el `pausa_id` del monitorista afectado

### D. Acción de emergencia: restaurar asignaciones huérfanas
**Archivo nuevo:** `supabase/functions/reparar-pausa-huerfana/index.ts`
- Para el caso actual de Karla: busca asignaciones con `notas_handoff = 'pausa_interina'` sin pausa activa correspondiente
- Desactiva las temporales y re-crea las originales
- Solo accesible por coordinadores/admins

### E. Actualizar hook para usar edge functions
**Archivo modificado:** `src/hooks/useMonitoristaPause.ts`
- `iniciarPausa`: reemplazar las ~40 líneas de operaciones secuenciales por una llamada a `supabase.functions.invoke('iniciar-pausa-monitorista')`
- `finalizarPausa`: reemplazar por llamada a `supabase.functions.invoke('finalizar-pausa-monitorista')`
- Agregar `forzarFinPausa(pausaId)` para coordinadores

### Resolución inmediata para Karla
La edge function `reparar-pausa-huerfana` permitirá restaurar sus asignaciones. Alternativamente, se puede ejecutar un query directo desde Supabase para:
1. Desactivar las asignaciones `pausa_interina` que apuntan a servicios de Karla
2. Re-crear las asignaciones originales de Karla

### Archivos afectados
- `supabase/functions/iniciar-pausa-monitorista/index.ts` (nuevo)
- `supabase/functions/finalizar-pausa-monitorista/index.ts` (nuevo)
- `supabase/functions/reparar-pausa-huerfana/index.ts` (nuevo)
- `src/hooks/useMonitoristaPause.ts` (refactor a edge functions)
- `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` (acción coordinador)

