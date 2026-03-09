

# Rediseño UX — Centro de Coordinación Ops

## Principio de diseño
**"Escanear en 3 segundos, actuar en 1 click"** — El coordinador debe ver el estado global al instante y resolver cada situación con el mínimo de interacciones.

## Estructura propuesta

```text
┌─────────────────────────────────────────────────────┐
│  Coordinación Ops          Turno: Matutino          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ ALERTAS (solo si hay) ────────────────────────┐ │
│  │ 🔴 2 sin asignar  🟡 1 corrección  💰 0 gastos │ │
│  │ [Auto-distribuir (2)]    [Cambio Turno]        │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ EQUIPO ───────────────────────────────────────┐ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐        │ │
│  │ │ Jose  2  │ │ Iñaki 2  │ │ Karla 3  │        │ │
│  │ │ ●Cliente1│ │ ●Cliente3│ │ ●Cliente5│        │ │
│  │ │ ●Cliente2│ │ ●Cliente4│ │ ●Cliente6│        │ │
│  │ │          │ │          │ │ ●Cliente7│        │ │
│  │ │ [+Asignar]│ │[+Asignar]│ │ ●Cliente8│        │ │
│  │ └──────────┘ └──────────┘ └──────────┘        │ │
│  │                                                │ │
│  │ ── Sin turno (colapsado) ──                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ CORRECCIONES ─────────────────────────────────┐ │
│  │ (Solo visible si hay items, colapsado a 0)     │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ GASTOS ───────────────────────────────────────┐ │
│  │ (Solo visible si hay pendientes)               │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Cambios clave

### 1. Barra de Alertas Ejecutiva (nuevo)
- Strip horizontal fijo arriba con contadores: sin asignar, correcciones, gastos pendientes
- Solo aparece si hay al menos 1 alerta. Si todo está limpio, muestra "✓ Operación al día"
- Botones de acción global (Auto-distribuir, Cambio turno) aquí, no enterrados abajo

### 2. MonitoristaCard rediseñada — servicios visibles por default
- Mostrar lista de clientes asignados **sin necesidad de expandir** (siempre abierto)
- Cada card tiene un botón "+Asignar" que abre un popover con los servicios sin asignar para asignar **directamente a ese monitorista** (acción + contexto juntos)
- Quitar barra de progreso abstracta, reemplazar con conteo claro "3 servicios"
- Color del borde cambia según carga: normal (border), cargado (amber), sobrecargado (red)

### 3. Servicios sin asignar integrados en cada MonitoristaCard
- Eliminar la sección separada "Sin cobertura" con su Select dropdown
- En su lugar, el servicio sin asignar se asigna desde un popover dentro de la card del monitorista destino
- O alternativamente: mantener una lista compacta pero con drag-intent visual (click en servicio → click en monitorista)

### 4. Fix del bug en DestinoCorrectionSection
- Actualmente recibe `enCursoServices` pero filtra `phase === 'en_destino'` — estos son mutuamente excluyentes
- Corregir: pasar todos los servicios del board o crear una lista específica de `enDestinoServices` desde el hook

### 5. Gastos: flujo de rechazo corregido
- Mover el campo "motivo de rechazo" **arriba** del botón rechazar
- Separar visualmente aprobar (verde, prominente) de rechazar (outline, secundario)
- El botón rechazar se deshabilita hasta que haya motivo escrito

### 6. Secciones condicionales
- Correcciones y Gastos se colapsan automáticamente si están vacíos (solo header con "0")
- Se expanden con animación si tienen items pendientes

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `CoordinatorCommandCenter.tsx` | Agregar barra de alertas ejecutiva, reorganizar layout, fix de datos para correcciones |
| `MonitoristaCard.tsx` | Mostrar servicios siempre visibles, agregar botón "+Asignar" con Popover, bordes por carga |
| `UnassignedServiceRow.tsx` | Convertir en item de Popover en vez de row independiente |
| `DestinoCorrectionSection.tsx` | Fix: recibir servicios en_destino correctamente |
| `GastosAprobacionSection.tsx` | Reordenar dialog: motivo arriba de botón rechazar, deshabilitar rechazar sin motivo |

