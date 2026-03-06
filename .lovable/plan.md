

# Fix: Prevent double-release and show invitation link for already-released candidates

## Problem
After successful release, the "Liberar" button remains clickable (the query doesn't refetch). The "already released" state shows a generic message but lacks the invitation link the user needs.

## Changes

### 1. `CandidateEvaluationPanel.tsx`
- After successful release (`handleRelease`), invalidate the `custodio-liberacion-by-candidato` query so `isAlreadyReleased` becomes `true` immediately.
- Fetch the latest `custodian_invitations` record for this `candidato_id` (query alongside `liberacionRecord`).
- Pass `invitationToken` to `EvaluationHeroStatus` when `isAlreadyReleased`.

### 2. `EvaluationHeroStatus.tsx`
- Add optional `invitationToken?: string` prop.
- In the `isAlreadyReleased` block, replace the simple message with:
  - "Custodio liberado" confirmation text.
  - The invitation link displayed with a **"Copiar link"** button (using clipboard API).
  - A small note: "Comparte este link con el custodio para que complete su registro."

### Implementation details
- Query: `supabase.from('custodian_invitations').select('token').eq('candidato_id', candidatoId).order('created_at', { ascending: false }).limit(1).maybeSingle()`
- After release, call `queryClient.invalidateQueries({ queryKey: ['custodio-liberacion-by-candidato', candidatoId] })` to force refetch.
- The invitation link format: `${window.location.origin}/auth/registro-custodio?token=${token}`

