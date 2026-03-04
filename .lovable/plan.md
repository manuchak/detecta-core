

# Fix: "Completar Capacitación" button does nothing on click

## Root Cause

The `handleMarcarManual` function (line 86) calls `marcarCapacitacionManual.mutateAsync()` without a `try...catch` block. If the storage upload or database upsert fails (e.g., missing bucket, RLS policy, or column mismatch), the promise rejects silently — no toast, no error message, nothing visible to the user.

Additionally, the mutation definition (line 206) has an `onSuccess` handler but **no `onError` handler**, so failures are completely invisible.

## Fix

### 1. `src/components/leads/evaluaciones/TrainingTab.tsx` (line 86-92)
Wrap `handleMarcarManual` in `try...catch` with a toast error message:

```typescript
const handleMarcarManual = async () => {
  if (!marcarCapacitacionManual || !archivo) return;
  try {
    await marcarCapacitacionManual.mutateAsync({ notas: manualNotas, archivo });
    setShowManualDialog(false);
    setManualNotas('');
    handleRemoveFile();
  } catch (error) {
    console.error('Error completing training:', error);
    toast({ title: 'Error', description: 'No se pudo completar la capacitación. Intenta de nuevo.', variant: 'destructive' });
  }
};
```

### 2. `src/hooks/useCapacitacion.ts` (after line 280)
Add `onError` handler to the mutation for defensive logging:

```typescript
onError: (error) => {
  console.error('Error in marcarCapacitacionManual:', error);
}
```

### 3. Import `toast` in TrainingTab
Add `import { toast } from '@/hooks/use-toast'` if not already imported (currently `toast` is only used inside the hook, not the component). Alternatively, use `sonner`'s toast.

These changes will surface any hidden errors so we can see what's actually failing (bucket permissions, column mismatch, etc.) and the user gets feedback.

