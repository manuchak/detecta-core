

# Análisis Fishbone: Custodios no pueden enviar formularios en móvil

## Causa Raíz Identificada

```text
PROBLEMA: El botón "Enviar Solicitud" queda fuera de pantalla en móvil
                          |
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
  ZOOM               OVERFLOW              CONTENIDO
    │                     │                     │
  dialog.tsx            DialogContent         Foto preview
  line 43:              max-h-[90vh]          h-40 (160px)
  zoom: 1.428571        con zoom 1.43x       + campos del form
  SE APLICA EN          = 128% del           = contenido > viewport
  MÓVIL (no debería)    viewport real        incluso con scroll
```

**Causa raíz**: `dialog.tsx` línea 43 aplica `zoom: 1.428571` (compensación del zoom 0.7 de escritorio) a TODOS los DialogContent, incluyendo móvil. Esto viola el estándar de zoom que dice "móvil = escala 1:1".

Un dialog con `max-h-[90vh]` a zoom 1.43x ocupa ~128% del viewport real. El `overflow-y-auto` no funciona porque el contenedor mismo excede la pantalla.

## Impacto: 6 componentes afectados

Todos los dialogs del portal custodio usan `max-h-[90vh] overflow-y-auto`:
1. `CreateExpenseForm.tsx` — **el reportado en la captura**
2. `CSATSurveyModal.tsx`
3. `MaintenanceSettingsDialog.tsx`
4. `BatchMaintenanceDialog.tsx`
5. `ReportUnavailabilityCard.tsx` (2 dialogs)
6. `InternalChatModal.tsx`

## Solución

Un solo cambio en `dialog.tsx`: aplicar el zoom 1.43x solo en pantallas ≥768px. En móvil, zoom nativo 1:1.

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/dialog.tsx` | Reemplazar `style={{ zoom: 1.428571 }}` estático por lógica condicional que use `window.innerWidth >= 768` para aplicar zoom solo en desktop. Usar un hook `useIsMobile` o media query inline. |

### Detalle técnico

Dado que `DialogContent` es un `forwardRef` sin hooks, la solución más limpia es usar CSS media query en lugar de un hook React:

```tsx
// Reemplazar style={{ zoom: 1.428571 }} con:
className addition: "[zoom:1.428571] max-sm:[zoom:1]"
```

Esto usa la utilidad de Tailwind para aplicar zoom 1.43x por defecto y resetearlo a 1 en pantallas <640px (o usar un breakpoint custom `max-md:` para <768px consistente con `useIsMobile`).

Alternativa: usar `@media` en el style inline, pero Tailwind arbitrary properties son más limpias.

