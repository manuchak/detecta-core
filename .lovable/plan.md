

# Flujo de Aprobación en Dos Pasos: Ops → Finanzas

## Flujo de estados propuesto

```text
pendiente ──[Ops aprueba]──► aprobado ──[Finanzas autoriza]──► autorizado ──► pagado
    │                            │
    └──[Ops rechaza]──► rechazado    └──[Finanzas rechaza]──► rechazado_finanzas
```

- **Ops** (GastosExtraTab): Pendientes = `pendiente`, Histórico = `aprobado`, `rechazado`
- **Finanzas** (EgresosTab): Pendientes = `aprobado` (ya aprobados por Ops), Histórico = `autorizado`, `rechazado_finanzas`, `pagado`
- Cuando Finanzas rechaza, requiere motivo y opcionalmente el custodio puede reenviar con más evidencia

## Cambios

### 1. `AprobacionGastosPanel.tsx` — Agregar prop `mode: 'ops' | 'finanzas'`

En vez de duplicar el componente, parametrizar por modo:

| Aspecto | mode='ops' (actual) | mode='finanzas' (nuevo) |
|---|---|---|
| Pendientes query | `estado = 'pendiente'` | `estado = 'aprobado'` |
| Histórico filtros | aprobado, rechazado | autorizado, rechazado_finanzas, pagado |
| Acción aprobar | estado → `aprobado` | estado → `autorizado` |
| Acción rechazar | estado → `rechazado` | estado → `rechazado_finanzas` + motivo |
| Counter query key | `gastos-pendientes-count` | `gastos-pendientes-finanzas-count` |

El diálogo de detalle mostrará las acciones correspondientes al modo. Para Finanzas, el rechazo incluirá campo de motivo (ya existe `motivo_rechazo`). Se reutilizará el mismo campo — si Finanzas rechaza, se sobreescribe con su motivo.

Se agregará `rechazado_por_finanzas` como info visible en el detalle para que Ops pueda ver qué rechazó Finanzas.

### 2. `GastosExtraTab.tsx` — Pasar `mode="ops"`
Agregar prop al `<AprobacionGastosPanel mode="ops" />`.

### 3. `EgresosTab.tsx` — Pasar `mode="finanzas"` + counter actualizado
- `<AprobacionGastosPanel mode="finanzas" />`
- Counter query cambia a filtrar por `estado = 'aprobado'` (pendientes de Finanzas)

### Archivos a modificar
1. `src/pages/Facturacion/components/GastosExtraordinarios/AprobacionGastosPanel.tsx` — prop mode, lógica dual
2. `src/pages/Facturacion/components/GastosExtraordinarios/GastosExtraTab.tsx` — pasar `mode="ops"`
3. `src/pages/Facturacion/components/EgresosTab.tsx` — pasar `mode="finanzas"`, ajustar counter

**Sin migración de DB** — los nuevos estados (`autorizado`, `rechazado_finanzas`) son solo strings en el campo `estado` que ya es `text`.

