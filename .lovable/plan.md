
# Fix: Hide raw URL, keep only "Copiar link" button

The long token URL overflows the card and breaks the layout. The user doesn't need to see the raw URL — they just need to copy it.

## Change in `EvaluationHeroStatus.tsx` (lines 113-126)

Replace the current invitation link block with a cleaner version:
- Remove the `<code>` element showing the raw URL
- Keep the descriptive text and the "Copiar link" button side by side
- The button copies the link to clipboard as before, but the URL is never rendered visually

This is a single-file, ~5-line change.
