

# Blindaje: Patrón unificado "deactivate-by-service" 

## Archivo: `src/hooks/useMonitoristaAssignment.ts`

### Cambio 1 — `reassignService` (líneas 412-435)

Reemplazar `.eq('id', params.assignmentId)` por `.eq('servicio_id', params.servicioId).eq('activo', true)` y agregar manejo de `23505`:

```typescript
const reassignService = useMutation({
  mutationFn: async (params) => {
    const nowTs = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();

    // Deactivate ALL active for this service
    await supabase.from('bitacora_asignaciones_monitorista')
      .update({ activo: false, fin_turno: nowTs })
      .eq('servicio_id', params.servicioId)
      .eq('activo', true);

    const { error } = await supabase.from('bitacora_asignaciones_monitorista')
      .insert({ ... });
    if (error && error.code === '23505') return; // race condition safe
    if (error) throw error;
  },
});
```

### Cambio 2 — `handoffTurno` loop (líneas 490-506)

Reemplazar `.eq('id', a.id)` por `.eq('servicio_id', a.servicio_id).eq('activo', true)` y agregar `23505` con `continue`:

```typescript
for (const a of assignmentsToTransfer) {
  await supabase.from('bitacora_asignaciones_monitorista')
    .update({ activo: false, fin_turno: nowTs, notas_handoff: params.notas })
    .eq('servicio_id', a.servicio_id)
    .eq('activo', true);

  const { error } = await supabase.from('...').insert({...});
  if (error && error.code === '23505') { continue; }
  if (error) throw error;
}
```

### Cambio 3 — `rebalanceLoad` loop (líneas 528-549)

Reemplazar `.eq('id', r.fromAssignmentId)` por `.eq('servicio_id', r.servicioId).eq('activo', true)`:

```typescript
for (const r of params.reassignments) {
  await supabase.from('bitacora_asignaciones_monitorista')
    .update({ activo: false, fin_turno: nowTs })
    .eq('servicio_id', r.servicioId)
    .eq('activo', true);

  const { error } = await supabase.from('...').insert({...});
  if (error && error.code === '23505') { continue; }
  if (error) throw error;
}
```

## Resultado

Las 3 funciones quedan alineadas con el patrón seguro que ya usa `assignService`: desactivar **por servicio_id** (no por record id), e ignorar duplicados con `23505`. Esto elimina el riesgo de servicios huérfanos por race conditions.

