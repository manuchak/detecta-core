

# Fix: Error de duplicado en aprobacion de candidatos + Mejora UX

## El Bug

El error "duplicate key value violates unique constraint 'lead_approval_process_lead_id_key'" ocurre porque el metodo `upsert` en `useSandboxAwareSupabase.ts` no especifica `onConflict: 'lead_id'`. Sin esta opcion, Supabase no sabe que columna usar para detectar conflictos y falla al intentar insertar un registro duplicado.

Esto pasa cuando un candidato ya tiene un registro en `lead_approval_process` (por ejemplo, creado al enviar a 2da entrevista o al aplicar SIERCP desde el menu de 3 puntos) y luego se intenta aprobar.

## Solucion

### 1. Fix del bug en upsert (archivo critico)

**Archivo:** `src/hooks/useSandboxAwareSupabase.ts`

Modificar el metodo `upsert` para aceptar un parametro `onConflict` y pasarlo a Supabase:

```typescript
upsert: async (table: string, data: any | any[], options?: { onConflict?: string }) => {
  const upsertOptions = options?.onConflict ? { onConflict: options.onConflict } : {};
  // ... resto de la logica existente con is_test
  return supabase.from(table).upsert(upsertData, upsertOptions);
}
```

### 2. Actualizar llamadas de upsert en useLeadApprovals

**Archivo:** `src/hooks/useLeadApprovals.ts`

En las 3 funciones que hacen upsert a `lead_approval_process` (handleApproveLead linea ~344, handleSendToSecondInterview linea ~491), agregar el parametro `onConflict`:

```typescript
await sbx.upsert('lead_approval_process', { ... }, { onConflict: 'lead_id' });
```

### 3. Mejora UX: Hacer el flujo mas intuitivo

**Archivo:** `src/components/leads/approval/ImprovedLeadCard.tsx`

Problemas UX actuales:
- El menu de 3 puntos tiene acciones que pueden crear registros de aprobacion sin que el usuario lo sepa
- No queda claro el flujo: Llamar -> Aprobar/2da Entrevista
- Los botones de accion desaparecen si ya hay un `final_decision`, impidiendo corregir errores

Mejoras propuestas:
- Si un candidato esta en stage `second_interview` y ya fue contactado exitosamente, mostrar los botones "Aprobar" y "Rechazar" para que pueda continuar el flujo
- Agregar en el menu de 3 puntos una opcion "Restablecer estado" visible solo cuando hay un `final_decision` o `current_stage` inesperado, para poder corregir errores de flujo

### 4. Datos inmediatos: Desbloquear los 4 candidatos

Ejecutar una migracion SQL que actualice los registros existentes de los 4 candidatos bloqueados, cambiando su `current_stage` a `approved` y `final_decision` a `approved` directamente en la base de datos, ya que el bug les impide avanzar por la UI.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useSandboxAwareSupabase.ts` | Agregar soporte para `onConflict` en upsert |
| `src/hooks/useLeadApprovals.ts` | Pasar `onConflict: 'lead_id'` en las 3 llamadas a upsert |
| `src/components/leads/approval/ImprovedLeadCard.tsx` | Mostrar botones de accion para candidatos en 2da entrevista; agregar opcion de restablecer |
| Migration SQL | Corregir los 4 candidatos bloqueados en la base de datos |

## Resumen del impacto

- **Bug fix**: Elimina el error de llave duplicada para siempre
- **UX**: Los candidatos en "2da Entrevista" podran ser aprobados/rechazados sin obstaculos
- **Datos**: Los 4 candidatos (Omar, Nicolas, Noe, Sergio) quedaran desbloqueados inmediatamente

