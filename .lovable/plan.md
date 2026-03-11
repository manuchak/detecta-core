

# Fix: SelectLabel must be used within SelectGroup

## Problem
Runtime crash: `SelectLabel` must be used within `SelectGroup` (Radix UI requirement). The template selector in `CommTestPanel.tsx` wraps categories in `React.Fragment` instead of `SelectGroup`.

## Fix

**File:** `src/components/monitoring/comm/CommTestPanel.tsx`

1. Add `SelectGroup` to the imports (line ~10)
2. Replace `React.Fragment` with `SelectGroup` (lines 474-480)

```tsx
// Before
<React.Fragment key={category}>
  <SelectLabel ...>{category}</SelectLabel>
  {catTemplates.map(...)}
</React.Fragment>

// After
<SelectGroup key={category}>
  <SelectLabel ...>{category}</SelectLabel>
  {catTemplates.map(...)}
</SelectGroup>
```

Single-line fix in one file.

