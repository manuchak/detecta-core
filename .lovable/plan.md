

# Improvements: Drop Zone Feedback & Event Discoverability

## Issues Identified

1. **Drop zone has no visual feedback**: Users can't tell they can drag photos into the popover. Need a dashed border + overlay that activates on drag-over.
2. **⋯ menu is invisible until hover**: The `opacity-0 group-hover:opacity-100` makes events undiscoverable. On touch devices it's completely inaccessible.

## Changes

### 1. `CheckpointPopover.tsx` — Add drag-over visual feedback

- Add `isDragging` state that toggles on `onDragEnter`/`onDragLeave`
- When dragging over the popover, show a dashed border overlay with "Suelta aquí tus fotos" text
- Make the upload button area larger and more obviously a drop target

### 2. `ServiceCardActive.tsx` — Always show ⋯ button

- Remove `opacity-0 group-hover:opacity-100` from the ⋯ trigger button
- Keep it subtle (`text-muted-foreground/50`) but always visible so events are always accessible

| File | Change |
|---|---|
| `src/components/monitoring/bitacora/CheckpointPopover.tsx` | Add isDragging state + visual overlay on drag-over |
| `src/components/monitoring/bitacora/ServiceCardActive.tsx` | Make ⋯ button always visible |

