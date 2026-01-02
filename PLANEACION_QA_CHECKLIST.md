# Planeación Module - QA Checklist

## Sprint 1: Core Functionality

### Date Selection
- [ ] Can select dates using calendar picker
- [ ] Date persists when navigating away and back
- [ ] Services update when changing dates

### Service List
- [ ] Services display with correct information
- [ ] Services grouped by hour with dividers
- [ ] Click on service opens edit/assignment modal

### Service Assignment
- [ ] Can assign custodian to service
- [ ] Can assign armed guard when required
- [ ] Conflict detection works for overlapping times

---

## Sprint 2: UX Improvements

### Navigation Persistence (Issue #1)
- [ ] Tab selection persists across navigation
- [ ] Scroll position persists when returning to page
- [ ] Date selection persists in localStorage

### Simplified Editable States (Issue #4)
- [ ] "→ En sitio" button appears for programmed services
- [ ] "← Revertir" button appears for on-site services
- [ ] Status legend shows only 3 main states
- [ ] hora_inicio_real updates when marking "En sitio"

### Improved Chronological Visualization (Issue #6)
- [ ] Services grouped by hour with visual dividers
- [ ] Current hour highlighted
- [ ] Upcoming service badges show countdown
- [ ] Services < 30 min have pulsing border

---

## Sprint 3: Functional + Hardening

### Improved Saphiro Search (Issue #7)
- [ ] Specific error messages for different error types
- [ ] Recent searches stored and displayed as badges
- [ ] "No results" shows helpful suggestions
- [ ] Loading state shows descriptive message

### PF Service Visibility (Issue #9)
- [ ] Can mark service as "Persona Física" in creation
- [ ] Can change client type in edit form
- [ ] PF badge displays on service cards
- [ ] Filter buttons work (Todos/Empresarial/PF)

### Hardening
- [ ] Structured logging visible in console (dev mode)
- [ ] UUID validation prevents invalid operations
- [ ] Error messages are user-friendly

---

## Regression Testing

### After Each Sprint
- [ ] All existing functionality still works
- [ ] No console errors during normal usage
- [ ] Performance acceptable (no visible lag)
- [ ] Mobile responsiveness maintained
