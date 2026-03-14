

# Plan: Protección RLS en useServiciosPlanificados.ts

## Auditoría de mutaciones

| Mutación | Líneas | Estado actual | Acción |
|---|---|---|---|
| `createServicioPlanificado` | 171-210 | `.select().single()` ✓ | Ya protegido |
| `updateServicioPlanificado` | 248-253 | `.select().single()` ✓ | Ya protegido |
| `updateServiceConfiguration` | 541-546 | `.select().single()` ✓ | Ya protegido |
| **`assignCustodian`** | 352-361 | Sin `.select()` | **Corregir** |
| **`assignArmedGuard`** | 415-427, 444-452 | Sin `.select()` en insert + update | **Corregir** |
| **`reassignCustodian`** | 616-625 | Sin `.select()` | **Corregir** |
| **`reassignArmedGuard`** | 711-718, 724-737, 747-755 | 3 operaciones sin verify | **Corregir** |
| **`removeAssignment`** | 828-832, 846-849 | 2 operaciones sin verify | **Corregir** |
| **`cancelService`** | 924-932 | Sin `.select()` | **Corregir** |
| **`updateOperationalStatus`** | 1018-1021 | PUENTE CRÍTICO — sin verify | **Corregir** |
| **`markFalsePositioning`** | 1085-1098 | Sin `.select()` | **Corregir** |
| **`logServiceChange`** | 972-982 | Silent catch, sin verify | **Corregir con warning** |

## Implementación

### 1. Helper `assertRowsAffected` (reutilizar patrón de useBitacoraBoard)
Agregar al inicio del hook:
```typescript
function assertRowsAffected(data: any[] | null, operation: string) {
  if (!data || data.length === 0) {
    throw new Error(`Operación "${operation}" bloqueada — los datos no se persistieron. Contacte al administrador.`);
  }
}
```

### 2. Aplicar `.select('id')` + `assertRowsAffected` a cada mutación

Patrón uniforme para **updates**:
```typescript
const { data, error } = await supabase
  .from('servicios_planificados')
  .update({ ... })
  .eq('id', serviceId)
  .select('id');
if (error) throw error;
assertRowsAffected(data, 'assignCustodian');
```

Patrón para **inserts** (asignacion_armados):
```typescript
const { data, error } = await supabase
  .from('asignacion_armados')
  .insert({ ... })
  .select('id');
if (error) throw error;
assertRowsAffected(data, 'insertAsignacionArmado');
```

### 3. `updateOperationalStatus` — protección reforzada (puente Planeación→Monitoreo)
- Agregar `.select('id')` + assert
- Post-verify: re-fetch `hora_llegada_custodio` para confirmar persistencia
- Si falla verify, lanzar error explícito que impida el handoff message y la notificación de posicionamiento

### 4. `logServiceChange` — alerta visible sin romper flujo
Cambiar el silent `catch` a `toast.warning` para que el coordinador sepa que el log no se guardó, sin bloquear la operación principal.

### Archivo único a modificar
`src/hooks/useServiciosPlanificados.ts` — 12 puntos de corrección, 1 helper nuevo.

