

# Evaluación del plan UI desde la perspectiva del Coordinador

## El día a día del coordinador

Un coordinador de monitoreo tiene estas actividades en orden de frecuencia:

1. **Constante (cada 30s-2min)**: Escanear quién tiene qué carga, detectar desbalances
2. **Frecuente (cada 5-15min)**: Asignar servicios nuevos que entran sin monitorista
3. **Ocasional (1-3 veces/turno)**: Aprobar gastos, corregir destinos, reasignar abandonados
4. **Una vez por turno**: Cambio de turno (handoff)

## Validación del plan propuesto

El plan actual es **correcto** en su jerarquía:

- **Zona hero = grilla de agentes** → Alineado con la actividad #1 (la más frecuente)
- **Orphan banner integrado** → Alineado con actividad #2
- **Acciones secundarias en drawers** → Correcto para actividades #3 y #4

### Un ajuste importante

El plan original pone "Auto-distribuir" y "Rebalancear" en el header. Pero desde la perspectiva del coordinador, estos botones se usan **después** de ver la grilla y detectar un problema. Deben estar **dentro de la zona hero**, no arriba. El header solo debe tener info contextual (turno, badge equidad).

## Plan refinado

```text
┌─────────────────────────────────────────────────────────┐
│ Coordinación Ops    │ Turno: Matutino │ ⚖️ 7↔7         │
├─────────────────────────────────────────────────────────┤
│ ⚠ 3 sin monitorista              [Asignar ahora]       │
├─────────────────────────────────────────────────────────┤
│  Equipo en Turno (4)    [Auto-distribuir] [Rebalancear] │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Karla    │ │ José     │ │ Cintia   │ │ María    │   │
│  │ 7 srv ●  │ │ 7 srv ●  │ │ 7 srv ●  │ │ 8 srv ●  │   │
│  │ folio-cl │ │ folio-cl │ │ folio-cl │ │ folio-cl │   │
│  │ folio-cl │ │ folio-cl │ │ folio-cl │ │ folio-cl │   │
│  │ +Asignar │ │ +Asignar │ │ +Asignar │ │ +Asignar │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ▸ Sin turno (2)                                        │
│              (scrollable solo esta zona)                │
├─────────────────────────────────────────────────────────┤
│ [🔄 Correcciones 2] [↔ Entregas 1] [💰 Gastos 0] [👻 Abandonados 0] │
└─────────────────────────────────────────────────────────┘
```

### Cambios concretos

**Archivo: `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx`**

1. **Fusionar AlertBar + OrphanBanner** en una sola línea compacta fija arriba (no scrollea)
2. **Mover botones Auto-distribuir y Rebalancear** al header de la card "Equipo en Turno" (junto al título), no al header general
3. **Grilla de agentes**: expandir a `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, dentro de un ScrollArea propio (flex-1)
4. **Barra inferior fija** con 4 pill-buttons con badges de conteo:
   - Correcciones Destino (count) → abre Sheet
   - Entregas Turno (count) → abre Sheet
   - Gastos Extra (count) → abre Sheet
   - Abandonados (count) → abre Sheet
5. Cada Sheet contiene el componente existente (DestinoCorrectionSection, HandoffRevertSection, GastosAprobacionSection, AbandonedServicesSection) sin cambios internos
6. Eliminar las secciones apiladas que hoy están siempre visibles — solo se muestran al abrir su drawer

**No se crean archivos nuevos.** Solo se reorganiza el layout del CoordinatorCommandCenter y se envuelven las secciones secundarias en Sheets.

