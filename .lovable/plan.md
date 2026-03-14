

# Plan: Blindaje RLS del Workflow de Rutas y Precios (Upstream de Planeación)

## Diagnóstico

El módulo de **rutas y precios** (`matriz_precios_rutas`, `pc_clientes`) alimenta todo el flujo de creación de servicios. Si una escritura aquí falla silenciosamente por RLS, el coordinador cree que la ruta/precio existe pero en realidad no se guardó — propagando datos incorrectos a servicios planificados.

### Mutaciones sin protección identificadas

| Archivo | Operación | Riesgo |
|---|---|---|
| `ConfirmationStep/index.tsx:97-99` | Insert `asignacion_armados` en onSuccess | **ALTO** — armados no se persisten, servicio queda sin armado asignado |
| `useRouteCreation.ts:67-75` | Insert `pc_clientes` (nuevo cliente) | MEDIO — cliente no se crea, ruta falla después |
| `RouteManagementForm.tsx:193-196` | Update `matriz_precios_rutas` | MEDIO — edición de ruta silenciosamente ignorada |
| `RouteManagementForm.tsx:203-205` | Insert `matriz_precios_rutas` | MEDIO — ruta nueva no se crea |
| `QuickPriceEditModal.tsx:69-77` | Update precios de ruta | MEDIO — precio editado no se guarda |
| `DeleteRouteDialog.tsx:59-65` | Soft-delete rutas (bulk `.in()`) | MEDIO — rutas no se desactivan |
| `BulkPriceAdjustModal.tsx:93-96` | Update masivo de precios | MEDIO — ajuste parcial silencioso |
| `ExcelImportWizard.tsx:202-207` | Upsert batch de precios | BAJO — error ya capturado con throw |
| `PriceMatrixImportWizard.tsx:201-204` | Upsert batch similar | BAJO — mismo patrón |

**Nota**: `CreateRouteModal.tsx:373-380` y `useRouteCreation.ts:144-159` ya usan `.select().single()` — están protegidos.

## Correcciones — 7 archivos

### Patrón a aplicar

```typescript
// Updates individuales
const { data, error } = await supabase
  .from('tabla')
  .update({ ... })
  .eq('id', id)
  .select('id');
if (error) throw error;
if (!data || data.length === 0) {
  throw new Error('Operación bloqueada — cambios no guardados');
}

// Bulk updates (soft-delete, ajuste masivo)
const { data, error } = await supabase
  .from('tabla')
  .update({ ... })
  .in('id', ids)
  .select('id');
if (error) throw error;
if (!data || data.length !== ids.length) {
  toast.warning(`Solo ${data?.length || 0} de ${ids.length} registros actualizados`);
}
```

### Detalle por archivo

1. **`ConfirmationStep/index.tsx`** — Insert `asignacion_armados`: agregar `.select('id')` y verificar. Cambiar el `console.error` a `toast.error` porque un servicio sin armados asignados es un error operativo visible.

2. **`useRouteCreation.ts`** — Insert `pc_clientes`: agregar `.select('id')` y verificar que se creó (ya retorna `false` en error, pero RLS block no genera `error`).

3. **`RouteManagementForm.tsx`** — Update y Insert de rutas: agregar `.select('id')` + verificación a ambas operaciones.

4. **`QuickPriceEditModal.tsx`** — Update de precios: agregar `.select('id')` + verificación.

5. **`DeleteRouteDialog.tsx`** — Soft-delete bulk: agregar `.select('id')` + verificación parcial (warning si count no coincide).

6. **`BulkPriceAdjustModal.tsx`** — Update masivo: agregar `.select('id')` a cada update individual dentro del `Promise.all` + conteo de éxitos/fallos.

7. **`ExcelImportWizard.tsx`** y **`PriceMatrixImportWizard.tsx`** — Upsert batch: agregar `.select('id')` para verificar que el batch se guardó completo. Warning si count difiere.

## Archivos a modificar

1. `src/pages/Planeacion/ServiceCreation/steps/ConfirmationStep/index.tsx`
2. `src/pages/Planeacion/ServiceCreation/steps/RouteStep/hooks/useRouteCreation.ts`
3. `src/pages/Planeacion/components/RouteManagementForm.tsx`
4. `src/pages/Planeacion/components/routes/QuickPriceEditModal.tsx`
5. `src/pages/Planeacion/components/routes/DeleteRouteDialog.tsx`
6. `src/pages/Planeacion/components/routes/BulkPriceAdjustModal.tsx`
7. `src/pages/Planeacion/components/ExcelImportWizard.tsx`
8. `src/pages/Planeacion/components/PriceMatrixImportWizard.tsx`

## Impacto

Cierra el último gap de escrituras desprotegidas en el módulo de Planeación completo (upstream + downstream), llevando la cobertura RLS del módulo al 100%.

