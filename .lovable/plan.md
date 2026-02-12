

## Fix: Checklist completado no se refleja al volver al dashboard

### Problema

Cuando el custodio completa el checklist y regresa al dashboard, la tarjeta de "Proximo servicio" sigue mostrando "Iniciar Checklist Pre-Servicio" en lugar de "Checklist completado". Esto ocurre porque:

1. El wizard llama `navigate('/custodian')` al completar, pero no invalida el cache de React Query
2. `useNextService` tiene `staleTime: 60000` (1 minuto), asi que usa datos en cache donde `checklistStatus` sigue siendo `null`
3. Solo despues de 1 minuto (o pull-to-refresh manual) se actualiza correctamente

### Solucion

Invalidar el cache de `next-service` inmediatamente al completar el checklist, para que al llegar al dashboard se haga un fetch fresco.

### Cambios

**1. `src/components/custodian/checklist/ChecklistWizard.tsx`**

- Importar `useQueryClient` de TanStack React Query
- En `handleSubmit`, antes de navegar, invalidar la query `['next-service']` para forzar un refetch cuando el dashboard se monte

```text
handleSubmit flow actual:
  saveChecklist -> clearDraft -> toast -> navigate('/custodian')

handleSubmit flow nuevo:
  saveChecklist -> clearDraft -> invalidateQueries(['next-service']) -> toast -> navigate('/custodian')
```

**2. `src/hooks/useNextService.ts`**

- Reducir `staleTime` de 60000ms a 10000ms (10 segundos) para que las invalidaciones surtan efecto mas rapido
- Esto es un cambio menor de seguridad; la invalidacion explicita es el fix principal

### Detalle tecnico

En ChecklistWizard.tsx, agregar:

```typescript
const queryClient = useQueryClient();

// En handleSubmit onSuccess:
onSuccess: () => {
  persistence.clearDraft(true);
  queryClient.invalidateQueries({ queryKey: ['next-service'] });
  toast.success('Checklist completado!');
  onComplete ? onComplete() : navigate('/custodian');
}
```

No se requieren cambios en NextServiceCard.tsx ni en MobileDashboardLayout.tsx. La logica de renderizado condicional (linea 106-127 de NextServiceCard) ya maneja correctamente el estado `checklistCompleted`, solo necesita recibir el dato actualizado.

