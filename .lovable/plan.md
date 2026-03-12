

# Fishbone: Pool de Reserva — Candidato no sale al reactivar

## Diagnóstico — 3 bugs encadenados

### Bug 1: El pool muestra TODOS los leads asignados (no solo los del pool)
- `fetchPoolCandidates()` usa el RPC `get_analyst_assigned_leads` que tiene `WHERE fecha_entrada_pool IS NULL` — **excluye** candidatos del pool
- El RPC tampoco retorna la columna `fecha_entrada_pool` en su SELECT
- El filtro client-side `lead.fecha_entrada_pool !== null` evalúa `undefined !== null` = `true`, así que **todos** los leads pasan
- **Por eso Jennifer ve 882 candidatos** cuando solo hay 293 reales en pool

### Bug 2: La reactivación no hace nada (silently fails)
- El RPC `reactivate_lead_from_pool` hace `UPDATE ... WHERE estado = 'aprobado_en_espera'`
- Pero los 293 candidatos reales del pool tienen `estado = 'aprobado'` (no `'aprobado_en_espera'`)
- Resultado: UPDATE matcha 0 rows, pero retorna `true` → toast de éxito sin cambio real

### Bug 3: Dos versiones conflictivas del RPC `move_to_pool`
- Versión 1: Pone `estado = 'aprobado'` + `fecha_entrada_pool = NOW()`
- Versión 2: Pone `estado = 'aprobado_en_espera'` + `fecha_entrada_pool = NOW()`
- Los 293 registros tienen `estado = 'aprobado'`, confirmando que se usó la versión 1

```text
                    Candidato no sale del pool al reactivar
                                    |
        ┌───────────────┬───────────┴──────────┬──────────────────┐
        │               │                      │                  │
   Query Pool       Reactivación          move_to_pool       UI Filter
   (ROTO)           (SILENTLY FAILS)      (INCONSISTENTE)    (ROTO)
        │               │                      │                  │
   Usa RPC que      WHERE estado=          2 versiones:      undefined!==null
   EXCLUYE pool     'aprobado_en_espera'   una pone          siempre es true
   candidates       pero dato real es      'aprobado',       → muestra todo
                    'aprobado'             otra 'aprobado_
                                           en_espera'
```

## Plan de corrección

### 1. DB: Corregir el RPC `reactivate_lead_from_pool`
Cambiar el WHERE de `estado = 'aprobado_en_espera'` a `fecha_entrada_pool IS NOT NULL` para que funcione independientemente del estado.

### 2. DB: Unificar `move_to_pool` 
Eliminar la versión que deja `estado = 'aprobado'` y estandarizar a `estado = 'aprobado_en_espera'` + `fecha_entrada_pool`.

### 3. DB: Data fix — corregir los 293 registros existentes
```sql
UPDATE leads SET estado = 'aprobado_en_espera' 
WHERE fecha_entrada_pool IS NOT NULL AND estado = 'aprobado';
```

### 4. Code: Reescribir `fetchPoolCandidates` en `usePoolReserva.ts`
Reemplazar la llamada al RPC `get_analyst_assigned_leads` con una query directa:
```typescript
supabase.from('leads')
  .select('id, nombre, email, telefono, estado, fecha_creacion, 
           fecha_entrada_pool, motivo_pool, zona_preferida_id, 
           candidato_custodio_id, asignado_a, notas,
           zonas_operacion_nacional(nombre)')
  .not('fecha_entrada_pool', 'is', null)
  .order('fecha_entrada_pool', { ascending: true })
```
Mapear los campos al formato `AssignedLead` que espera la UI (lead_id, lead_nombre, etc.).

### 5. Code: Refresh inmediato post-reactivación
Agregar optimistic removal — al reactivar, eliminar la tarjeta del state local inmediatamente antes de esperar el refresh del servidor.

