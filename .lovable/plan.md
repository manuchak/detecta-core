

## Problem

Two issues prevent Daniela from seeing custodian-uploaded images:

### 1. Upload URLs never saved (root cause)
In `useCustodianTicketsEnhanced.ts`, after uploading a file, the "verify-before-commit" check uses `.list(ticketNumber, { search: sanitizedName })`. Supabase's `search` parameter matches by **prefix**, but the actual filename is `${Date.now()}-${sanitizedName}`. So searching for `"photo.jpg"` never matches `"1772670568626-photo.jpg"`. The verify always fails silently, `evidenciaUrls` stays empty, and `evidencia_urls` is inserted as `null`.

Files ARE being uploaded to storage (confirmed 10 files in `ticket-evidencias` bucket) — but the URLs are never recorded in the database.

### 2. Detail view shows text links, not images
Even when fixed, the current rendering shows "Archivo 1" as a text link. It should show image thumbnails with lightbox.

## Plan

### File 1: `src/hooks/useCustodianTicketsEnhanced.ts`
- **Fix the verify logic**: Remove the broken `.list()` verify step. Since the upload succeeded (no error), just use `getPublicUrl(uploadData.path)` directly. The upload already confirmed success.
- Apply the same fix to the `addEvidenceToTicket` function (~line 346) which has the same bug.

### File 2: `src/pages/Tickets/TicketDetailPage.tsx`
- Replace the text link rendering (lines 370-386) with image thumbnails:
  - Show clickable thumbnail previews (96x96) for each evidence URL
  - Add a lightbox dialog to view full-size images on click
  - Keep the "open in new tab" option

### Backfill: Fix existing tickets
- After the code fix, run a one-time query to populate `evidencia_urls` for the existing tickets that have files in storage but null URLs. This can be done by generating public URLs from the known storage objects.

