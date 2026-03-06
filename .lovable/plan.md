

# Fix: Ghost liberacion records when RPC fails after auto-create

## Root Cause

The `handleRelease` in `CandidateEvaluationPanel.tsx` has a two-step process:
1. Auto-creates a `custodio_liberacion` record with `estado_liberacion = 'aprobado_final'`
2. Calls the RPC `liberar_custodio_a_planeacion_v2` which sets it to `'liberado'`

If step 2 fails (as happened with ANGEL DIONISIO due to unique constraint), the record stays at `'aprobado_final'`. The Liberaciones module queries `estado_liberacion NOT IN ('liberado', 'rechazado')`, so this ghost record appears as "pending".

The unique constraint bug is already fixed by the migration we just deployed. But we need resilience for any future RPC failure.

## Change: `CandidateEvaluationPanel.tsx` (lines 253-275)

Add cleanup logic: track whether we auto-created the record, and if the RPC fails, delete it to prevent ghost entries.

```typescript
const handleRelease = async () => {
  setIsLiberating(true);
  let autoCreatedId: string | null = null;
  try {
    let libId = liberacionRecord?.id;
    if (!libId) {
      const { data: newRec, error } = await supabase
        .from('custodio_liberacion')
        .insert({ candidato_id: candidatoId, estado_liberacion: 'aprobado_final' })
        .select('id')
        .single();
      if (error || !newRec) throw error || new Error('...');
      libId = newRec.id;
      autoCreatedId = libId; // track for cleanup
    }
    const result = await liberarCustodio.mutateAsync({ liberacion_id: libId, forzar: true });
    setSuccessData(result);
    queryClient.invalidateQueries({ queryKey: ['custodio-liberacion-by-candidato', candidatoId] });
    queryClient.invalidateQueries({ queryKey: ['custodian-invitation-token', candidatoId] });
  } catch (err) {
    // Cleanup: if we auto-created the record and the RPC failed, delete ghost
    if (autoCreatedId) {
      await supabase.from('custodio_liberacion').delete().eq('id', autoCreatedId);
    }
    throw err; // re-throw so toast/error handling still works
  } finally {
    setIsLiberating(false);
  }
};
```

This is a single-file, ~5-line addition. The ANGEL DIONISIO case should resolve on retry now that the RPC constraint fix is deployed.

