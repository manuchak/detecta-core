

# Centro de Coordinación Ops — Rediseño Unificado

## Problema
La pestaña "Coordinación C4" del Centro de Monitoreo actualmente solo maneja asignación de monitoristas. El coordinador necesita además: (1) aprobar/rechazar gastos extraordinarios de custodios, (2) revertir servicios marcados "En Destino" por error, todo desde un solo lugar con UI intuitiva Apple-inspired.

## Diseño

Rediseñar `CoordinatorCommandCenter` con un layout de **3 secciones tipo cards** (no tabs anidados) en scroll vertical, cada una con su propia acción clara:

```text
┌─────────────────────────────────────────────┐
│  COORDINACIÓN OPS                    Turno  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ 👥 MONITORISTAS ──────────────────────┐ │
│  │  [Cards actuales + Auto-distribuir]    │ │
│  │  [Cambio de turno]                     │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ 🔄 CORRECCIONES EN DESTINO ───────────┐ │
│  │  Lista de servicios en estado          │ │
│  │  "en_destino" con botón "Revertir      │ │
│  │  a En Ruta" por cada uno               │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ 💰 GASTOS EXTRAORDINARIOS ────────────┐ │
│  │  Lista de solicitudes pendientes       │ │
│  │  con acciones aprobar/rechazar inline  │ │
│  └────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Refactorizar layout: sección de monitoristas (existente), nueva sección de correcciones en destino, nueva sección de gastos pendientes |
| `src/components/monitoring/coordinator/DestinoCorrectionSection.tsx` | **Nuevo** — Lista servicios "en_destino" del turno con botón revertir + diálogo de confirmación |
| `src/components/monitoring/coordinator/GastosAprobacionSection.tsx` | **Nuevo** — Muestra solicitudes pendientes con aprobar/rechazar inline, reutilizando query de `solicitudes_apoyo_extraordinario` |

### Sección Monitoristas (existente)
- Se mantiene igual pero se encapsula en una Card con header propio
- Quita el layout de 2 columnas fijo para que fluya en scroll vertical

### Sección Correcciones en Destino
- Consume `useBitacoraBoard()` para obtener `enDestinoServices`
- Cada servicio muestra: cliente, custodio, hora llegada
- Botón "Revertir a En Ruta" con `ConfirmTransitionDialog` (doble confirmación)
- Llama `revertirEnDestino.mutate()` del hook existente
- Si no hay servicios en destino, muestra estado vacío con checkmark

### Sección Gastos Extraordinarios
- Query directa a `solicitudes_apoyo_extraordinario` filtrada por `estado = 'pendiente'`
- Card por solicitud: tipo, custodio, monto, folio, foto thumbnail
- Acciones inline: Aprobar (con input de monto) y Rechazar (con motivo obligatorio)
- Reutiliza la lógica de mutaciones de `AprobacionGastosPanel.tsx`
- Badge con contador de pendientes en el header de la sección

### UX Apple-inspired
- Cards con bordes sutiles, fondos semitransparentes, íconos al lado del título
- Botones de acción grandes y claros con colores semánticos (verde aprobar, rojo rechazar, ámbar revertir)
- ScrollArea para el contenido completo
- Sin tabs anidados — todo visible de un vistazo con progressive disclosure

