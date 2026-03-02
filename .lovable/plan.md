

# Fix: Tickets resueltos no deben mostrar alerta roja de "Vencido"

## Problema

La logica SLA en `calculateSLAStatus` (linea 46-52 de `useTicketSLA.ts`) marca como `'vencido'` (rojo, con animacion pulse) los tickets que se resolvieron **despues** de su deadline:

```text
if (completedAt) {
  const wasOnTime = completedAt <= deadline;
  return { status: wasOnTime ? 'cumplido' : 'vencido', ... };
}
```

Esto es tecnicametnte correcto (el SLA SI se incumplio), pero el UX es incorrecto: un ticket ya resuelto no deberia generar alarma visual. La alerta roja es para tickets **activos** que requieren atencion inmediata.

Tickets afectados en la DB: CUS-MM07G9B8, CUS-MLSMLHIV, CUS-MJK8P3X4 y otros resueltos/cerrados fuera de tiempo.

## Solucion

Agregar un nuevo estado `'cumplido_tarde'` que represente "SLA incumplido pero ticket ya resuelto". Este estado tendra un estilo visual **neutro/informativo** (gris o azul tenue) en vez de rojo alarmante.

### Cambio 1: `src/hooks/useTicketSLA.ts`

- Agregar `'cumplido_tarde'` al tipo `SLAStatus`
- Cambiar linea 49: cuando `completedAt > deadline`, retornar `'cumplido_tarde'` en vez de `'vencido'`
- Ajustar `getUrgencyScore` para que `cumplido_tarde` tenga score 0 (no urgente, ya resuelto)

### Cambio 2: `src/components/tickets/SLAProgressBar.tsx`

Agregar config visual para `cumplido_tarde`:
- Icono: `CheckCircle` (no `AlertTriangle`)
- Color: gris/slate (no rojo)
- Label: "Cumplido (tarde)"
- Sin animacion pulse

### Cambio 3: `src/components/tickets/SLABadge.tsx`

Agregar `cumplido_tarde` al `statusConfig` con estilo informativo (gris/slate), misma logica que el progress bar.

### Cambio 4: `src/components/tickets/TicketCardMobile.tsx`

Actualizar la logica `isUrgent` para que `cumplido_tarde` NO aplique fondos de alerta (actualmente cualquier `vencido` pinta el card de rojo).

## Impacto

- Tickets resueltos/cerrados fuera de tiempo: mostraran un indicador gris informativo en vez de rojo alarmante
- Tickets activos vencidos: siguen en rojo con urgencia (sin cambio)
- El historial SLA se preserva (se sabe que se cumplio tarde vs a tiempo)
- Ordenamiento por urgencia: tickets `cumplido_tarde` bajan al fondo (score 0)

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useTicketSLA.ts` | Nuevo estado `cumplido_tarde`, ajuste de score |
| `src/components/tickets/SLAProgressBar.tsx` | Config visual para `cumplido_tarde` |
| `src/components/tickets/SLABadge.tsx` | Config visual para `cumplido_tarde` |
| `src/components/tickets/TicketCardMobile.tsx` | Excluir `cumplido_tarde` de alertas visuales |

