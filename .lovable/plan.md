

# Fix: PDF Font Error — Poppins Italic Not Registered

## Problem
The error `Could not resolve font for Poppins, fontWeight 400, fontStyle italic` occurs because `fontStyle: 'italic'` is used in PDF styles but only regular/semibold/bold variants of Poppins are registered — no italic variant.

## Solution
Two changes:

1. **Register Poppins italic font** in `src/components/pdf/fontSetup.ts` — add the 400 italic variant from Google Fonts.

2. **Verify all 3 affected files** use only registered variants. The italic URLs for Poppins:
   - 400 italic: `https://fonts.gstatic.com/s/poppins/v22/pxiGyp8kv8JHgFVrJJLedw.ttf`

### Files to edit:
- `src/components/pdf/fontSetup.ts` — Add `{ src: '...poppins-italic...', fontWeight: 400, fontStyle: 'italic' }` to the fonts array.

