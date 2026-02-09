

# Fix: Graficos de "Analisis de Tickets" no cargan datos

## Diagnostico

El hook `useTicketMetrics.ts` tiene multiples nombres de columna incorrectos que causan que la consulta falle silenciosamente o no procese datos correctamente. Los graficos reciben arrays vacios y muestran areas grises.

**Columnas mal referenciadas:**

| Codigo actual | Columna real en BD |
|---|---|
| `ticket.estado` | `ticket.status` |
| `ticket.sla_deadline_resolucion` | `ticket.fecha_sla_resolucion` |
| `categoria:ticket_categorias_custodio(...)` (alias de join) | `ticket_categorias_custodio!categoria_custodio_id(...)` (FK real) |

## Cambios

### Archivo: `src/hooks/useTicketMetrics.ts`

**1. Corregir el JOIN a categorias (linea 77)**

```text
-- Antes:
categoria:ticket_categorias_custodio(nombre, color, departamento_responsable)

-- Despues:
ticket_categorias_custodio!categoria_custodio_id(nombre, color, departamento_responsable)
```

Y actualizar todas las referencias de `ticket.categoria?.` a `ticket.ticket_categorias_custodio?.` (lineas 160, 161, 167).

**2. Cambiar `estado` por `status` (6 ocurrencias)**

- Linea 181: `ticket.estado === 'resuelto'` -> `ticket.status === 'resuelto'`
- Linea 198: `ticket.estado === 'resuelto'` -> `ticket.status === 'resuelto'`
- Linea 252: `ticket.estado === 'resuelto'` -> `ticket.status === 'resuelto'`
- Linea 277: `ticket.estado === 'resuelto'` -> `ticket.status === 'resuelto'`
- Linea 300: filtro `t.estado` -> `t.status`
- Linea 301: filtro `t.estado` -> `t.status`

**3. Cambiar `sla_deadline_resolucion` por `fecha_sla_resolucion` (3 ocurrencias)**

- Linea 195: `ticket.sla_deadline_resolucion` -> `ticket.fecha_sla_resolucion`
- Linea 197: `parseISO(ticket.sla_deadline_resolucion)` -> `parseISO(ticket.fecha_sla_resolucion)`
- Linea 274: `ticket.sla_deadline_resolucion` -> `ticket.fecha_sla_resolucion`
- Linea 276: `parseISO(ticket.sla_deadline_resolucion)` -> `parseISO(ticket.fecha_sla_resolucion)`

## Resultado

Los dos graficos ("Tickets por Dia" y "Distribucion por Area") cargaran correctamente con los datos reales de la base de datos.

