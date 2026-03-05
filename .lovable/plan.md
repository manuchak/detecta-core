

## Analysis

The current limit is hardcoded at **5 files** in two places:
1. `CreateCustodianTicketForm.tsx` line 61: `if (files.length + evidencias.length > 5)` -- silently rejects
2. `CreateCustodianTicketForm.tsx` line 274: `evidencias.length < 5` -- hides the upload button
3. Help text line 295: "Máximo 5 archivos"

The upload logic in `useCustodianTicketsEnhanced.ts` has no limit -- it loops through all files sequentially. Storage bucket `ticket-evidencias` has no file count restriction. The `evidencia_urls` column is `string[]` with no length constraint. So the backend already supports 15.

## Plan: Expandable evidence upload (5 default, up to 15 on demand)

### File: `src/components/custodian/CreateCustodianTicketForm.tsx`

1. **Raise hard limit to 15**, but keep the initial grid compact by showing a "Agregar más evidencias" link after 5 files instead of hiding the upload button entirely.

2. **Change validation logic**:
   - Line 61: Change cap from `5` to `15`
   - Line 274: Change `evidencias.length < 5` to `evidencias.length < 15`
   - Add a toast warning when user exceeds 15

3. **Update help text**: "Máximo 15 archivos" with a note about compression.

4. **Improve grid layout for many files**: Switch from `flex-wrap` to a scrollable grid (`grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto`) when count exceeds 5, so the form doesn't become absurdly long. Show thumbnails smaller at higher counts.

5. **Show count badge**: Display "3/15" counter next to the label so the custodian knows capacity.

### File: `src/hooks/useCustodianTicketsEnhanced.ts`

6. **Add compression for bulk uploads**: The upload loop already works sequentially. Add the existing Canvas compression (from the photo upload standard) before each upload to keep ~400KB per image. This prevents 15 raw phone photos (each 3-8MB) from timing out on slow networks.

7. **Progress feedback**: Pass upload progress count back via a callback or state so the form can show "Subiendo 7/15..."

Two files, no schema changes, no new dependencies.

