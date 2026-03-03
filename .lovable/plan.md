
## Root Cause (confirmed)

The last code edit introduced a bug: `profilesMap` is built correctly from the separate profiles query, but line 139 in `useCSCartera.ts` still reads from `csmData?.display_name` — which references the old embedded JOIN that no longer exists in the query. This means `csm_nombre` is always `null` and the hook may behave unexpectedly in downstream consumers.

Additionally, `useCSStaffMetrics` depends on `useCSCartera` — if the cartera hook has issues (lingering loading / empty data), the Staff CSM tab also stays in skeleton state.

## Fix Required

**1 file, 2-line change — `src/hooks/useCSCartera.ts` line 139:**

Change:
```typescript
const csmData = (c as any).csm;
// ...
csm_nombre: csmData?.display_name || null,
```

To:
```typescript
csm_nombre: (c as any).csm_asignado ? (profilesMap[(c as any).csm_asignado] || null) : null,
```

And remove the unused `csmData` variable on line 122.

## That's it

- No DB migrations needed (RLS policies are already in place from previous work)
- No frontend route changes needed (role_permissions table already has all pages)
- This single bug fix will unblock Panorama (loyalty funnel data), Cartera (CSM names show correctly), and Staff CSM (which depends on cartera data)
