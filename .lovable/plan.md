

# Fix: cs_touchpoints tipo CHECK constraint violation

## Problem
The form Select options use `llamada` but the database CHECK constraint only allows: `llamada_seguimiento`, `email`, `whatsapp`, `reunion`, `visita`, `nota_interna`.

## Fix

**File: `src/pages/CustomerSuccess/components/CSTouchpointsList.tsx`**

1. **Line 67**: Change default state from `'llamada'` to `'llamada_seguimiento'`
2. **Line 131**: Same reset value change
3. **Line 380**: Change `<SelectItem value="llamada">Llamada</SelectItem>` to `<SelectItem value="llamada_seguimiento">Llamada</SelectItem>`
4. **Add missing option**: `<SelectItem value="nota_interna">Nota Interna</SelectItem>` after Visita
5. **Filter dropdown** (around line 301-310): Also update the filter options to match the same valid values

Minimal change — just aligning the UI values with the existing DB constraint.

