

# Fix: Gráfico no muestra tickets resueltos

## Causa raíz

En `src/hooks/useTicketMetrics.ts`, línea 211, el código usa `ticket.resolved_at` para contar tickets resueltos por día:

```typescript
if (ticket.status === 'resuelto' && ticket.resolved_at) {  // <-- resolved_at siempre es NULL
```

Pero en la base de datos, **`resolved_at` es NULL en los 11 tickets**. La fecha real de resolución está en la columna `resuelto_at`. Por eso la línea "Resueltos" siempre muestra 0.

Además, el filtro `status === 'resuelto'` excluye tickets con `status === 'cerrado'`, que también son tickets finalizados (7 de 11 tickets están cerrados).

## Datos reales en la DB

| Status | Count | resuelto_at | resolved_at |
|--------|-------|-------------|-------------|
| resuelto | 3 | 2 con fecha, 1 NULL | Todos NULL |
| cerrado | 7 | 1 con fecha, 6 NULL | Todos NULL |
| abierto | 1 | NULL | NULL |

## Cambios necesarios

### Archivo: `src/hooks/useTicketMetrics.ts`

**Cambio 1** - Líneas 210-222: Reemplazar `ticket.resolved_at` por `ticket.resuelto_at` y expandir el filtro para incluir también `'cerrado'`:

```typescript
// ANTES (buggy):
if (ticket.status === 'resuelto' && ticket.resolved_at) {
  const resolvedAt = parseISO(ticket.resolved_at);

// DESPUÉS (correcto):
const isResolved = ticket.status === 'resuelto' || ticket.status === 'cerrado';
const resolvedTimestamp = ticket.resuelto_at || ticket.resolved_at;
if (isResolved && resolvedTimestamp) {
  const resolvedAt = parseISO(resolvedTimestamp);
```

**Cambio 2** - Líneas 282-292 (sección agentPerformance): Mismo fix, usar `resuelto_at` y incluir `cerrado`:

```typescript
if (ticket.status === 'resuelto' || ticket.status === 'cerrado') {
  agentData.resolved++;
  const resolvedTimestamp = ticket.resuelto_at || ticket.resolved_at;
  if (resolvedTimestamp) {
    const resolutionMinutes = differenceInMinutes(
      parseISO(resolvedTimestamp),
      parseISO(ticket.created_at)
    );
```

**Cambio 3** - Líneas 228-230 (SLA compliance): Mismo patrón:

```typescript
if ((ticket.status === 'resuelto' || ticket.status === 'cerrado') && (ticket.resuelto_at || ticket.resolved_at)) {
  const resolvedAt = parseISO(ticket.resuelto_at || ticket.resolved_at);
```

**Cambio 4** - Líneas 306-309 (SLA por agente): Mismo patrón.

## Resultado esperado

- El gráfico "Tickets por Día" mostrará la línea verde de "Resueltos" con datos reales
- Los tickets cerrados también contarán como resueltos en todas las métricas
- Se usa `resuelto_at` como fuente primaria, con fallback a `resolved_at` por seguridad

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useTicketMetrics.ts` | Reemplazar `resolved_at` por `resuelto_at` en 4 ubicaciones; incluir status `cerrado` |

