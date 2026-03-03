
# Stress Test del Checklist: Analisis de Bugs y Plan de Hardening

## Bugs Identificados

### BUG 1 (CRITICO): Custodio ve "Iniciar Checklist" despues de haberlo completado

**Caso reportado**: Jesus Manuel Molina completo su checklist (servicio ASCAAST-1499, guardado exitosamente a las 00:04 UTC) pero al volver al dashboard le aparece el boton "Iniciar Checklist Pre-Servicio" como si no lo hubiera hecho.

**Causa raiz**: El `useNextService.ts` (linea 160-165) consulta `checklist_servicio` usando `normalizedPhone`, pero la query del servicio en `servicios_planificados` puede devolver un `id_servicio` **diferente** al usado al guardar el checklist. El flujo es:

1. Custodio tiene servicio con `id` (UUID) Y `id_servicio` (string legible como "ASCAAST-1499")
2. `useNextService` normaliza el servicio y usa `p.id_servicio || p.id` (linea 118)
3. Si `id_servicio` es null en la tabla planificados, usa el UUID (`p.id`)
4. Pero al guardar el checklist, `ServiceChecklistPage` pasa `serviceId` desde la URL (que viene de `handleStartChecklist` usando `service.id_servicio`)
5. Si hay **inconsistencia** entre el ID usado para navegar y el ID usado para consultar, el checklist no se encuentra

**Segundo factor**: El query usa `staleTime: 10000` (10s). Si el custodio navega rapido de vuelta al dashboard, React Query puede servir datos stale del cache que no incluyen el checklist recien guardado. El `queryClient.invalidateQueries({ queryKey: ['next-service'] })` en `handleSubmit` deberia resolverlo, pero depende de timing.

**Tercer factor (IndexedDB draft fantasma)**: Tras completar el checklist, `deleteDraft` borra el draft de IndexedDB. Pero `useFormPersistence` con key `checklist_wizard_${servicioId}` guarda en **localStorage/sessionStorage** (nivel 'robust') el `currentStep`. Al volver a entrar, el wizard puede restaurar el paso 1 del borrador de localStorage aunque el checklist ya se guardo en Supabase, porque `existingChecklistQuery` tiene `enabled: !!isOnline` - si pierde senal momentaneamente, no consulta Supabase y carga el draft local.

### BUG 2 (ALTO): Race condition en la deteccion de checklist existente

En `useServiceChecklist.ts` (linea 80):
```typescript
enabled: !!servicioId && !!custodioTelefono && isOnline,
```

Si el custodio abre el checklist **sin conexion**, `existingChecklistQuery` nunca se ejecuta. El wizard carga datos del draft local (IndexedDB) y permite re-hacer todo el checklist. Al enviar, hace upsert - lo cual no pierde datos pero confunde al custodio.

### BUG 3 (MEDIO): Draft no se limpia en localStorage tras completar

`ChecklistWizard.handleSubmit` llama `persistence.clearDraft(true)` pero esto limpia el borrador del hook `useFormPersistence`. Sin embargo, la key `checklist_wizard_${servicioId}` persiste si `clearDraft` falla silenciosamente. Al volver a abrir, `DraftIndicator` muestra que hay un borrador guardado.

### BUG 4 (MEDIO): Doble-tap en "Confirmar Checklist" puede enviar dos veces

`StepConfirmation` deshabilita el boton con `!canSubmit` que depende de `!!firma && !isSaving`. Pero `isSaving` se setea dentro del `mutationFn` (linea 312), no antes de llamar `saveChecklist.mutate()`. Hay una ventana de ~1 frame donde el boton sigue habilitado.

### BUG 5 (BAJO): Fotos huerfanas en IndexedDB

Si el custodio toma fotos, sale del wizard y nunca completa el checklist, los blobs de fotos se quedan en IndexedDB indefinidamente. No hay mecanismo de garbage collection.

---

## Plan de Fixes

### Fix 1: Proteger contra re-entry cuando checklist ya existe

**Archivo**: `src/hooks/useNextService.ts`

- Cambiar la consulta de checklist para que NO dependa del campo `custodio_telefono` (que puede tener inconsistencias de normalizacion). En su lugar, buscar **solo por servicio_id** ya que un servicio solo tiene un checklist.
- Agregar `refetchOnMount: 'always'` para evitar datos stale al volver al dashboard.

**Archivo**: `src/components/custodian/checklist/ChecklistWizard.tsx`

- En la pantalla de "Checklist Completado" (linea 149), tambien limpiar drafts locales (localStorage + IndexedDB) para evitar fantasmas.

### Fix 2: Deshabilitar doble-submit

**Archivo**: `src/components/custodian/checklist/ChecklistWizard.tsx`

- Mover `setIsSaving(true)` fuera del `mutationFn` y ponerlo ANTES de llamar `saveChecklist()`. Usar un state local `isSubmitting` en el wizard que se active inmediatamente al hacer click.

### Fix 3: Limpiar drafts al detectar checklist existente

**Archivo**: `src/hooks/useServiceChecklist.ts`

- Cuando `existingChecklistQuery.data?.estado === 'completo'`, automaticamente borrar el draft local y fotos huerfanas de ese servicio.

### Fix 4: Consultar checklist existente incluso offline

**Archivo**: `src/hooks/useServiceChecklist.ts`

- Remover la condicion `isOnline` del `enabled` de `existingChecklistQuery`. Si falla por red, el query retorna error pero no bloquea. Agregar `retry: 1` y `retryDelay: 2000`.

### Fix 5: Garbage collection de fotos huerfanas

**Archivo**: `src/lib/offlineStorage.ts`

- Agregar funcion `cleanupOrphanedPhotos()` que elimine blobs de fotos cuyo `servicioId` no tenga draft asociado y tengan mas de 48 horas.

**Archivo**: `src/components/custodian/MobileDashboardLayout.tsx`

- Ejecutar cleanup al montar el dashboard.

### Fix 6: Forzar refetch al volver al dashboard

**Archivo**: `src/hooks/useNextService.ts`

- Cambiar `staleTime` de 10000 a 0 para que siempre refresque al montar.
- Agregar `refetchOnWindowFocus: true` para capturar cambios cuando el usuario vuelve de otra pestana.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useNextService.ts` | staleTime=0, refetchOnWindowFocus, buscar checklist solo por servicio_id |
| `src/hooks/useServiceChecklist.ts` | Remover isOnline de enabled, limpiar drafts al detectar completo |
| `src/components/custodian/checklist/ChecklistWizard.tsx` | Anti doble-submit, limpiar localStorage en pantalla completado |
| `src/lib/offlineStorage.ts` | Agregar cleanupOrphanedPhotos() |
| `src/components/custodian/MobileDashboardLayout.tsx` | Ejecutar cleanup al montar |

## Resultado esperado

- Custodio que ya completo checklist **siempre** ve "Checklist completado" al volver
- Imposible enviar doble-submit por tap rapido
- Drafts fantasma se limpian automaticamente
- Fotos huerfanas se eliminan tras 48h
- El sistema funciona correctamente con conexion intermitente
