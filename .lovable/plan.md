

# Auditoría del Workflow Completo: Gastos Extraordinarios

## Flujo analizado

```text
Custodio (mobile)          Coordinador (monitoring)        Finanzas (facturación)
──────────────────         ────────────────────────        ──────────────────────
1. Crea solicitud    →     2. Ve pendientes         →     4. Genera corte semanal
   (CreateExpenseForm)        (GastosAprobacionSection)       (GenerarCorteDialog)
                           3. Aprueba/Rechaza              5. Apoyo aparece en partida
                              (update estado)                  "apoyo_extraordinario"
```

## Bugs encontrados

### BUG CRÍTICO: Coordinador no puede aprobar/rechazar (RLS bloqueante)

La tabla `solicitudes_apoyo_extraordinario` tiene estas políticas:
- `monitoring_insert_apoyos` — INSERT para `has_monitoring_write_role()` ✓
- `monitoring_read_apoyos` — SELECT para `has_monitoring_write_role()` ✓
- **NO EXISTE** política UPDATE para monitoring

El coordinador ve los gastos pendientes, pero al hacer click en "Aprobar" o "Rechazar", el UPDATE falla silenciosamente por RLS. **El workflow está roto en el paso 2→3.**

### BUG MENOR: Folio no visible al coordinador

El custodio ingresa un "Número de Folio" que se guarda en el campo `notas`, pero el dialog de aprobación del coordinador no muestra el campo `notas`. El coordinador no puede verificar el folio de referencia.

## Plan de corrección

### 1. Migración SQL — Agregar UPDATE policy para monitoring
```sql
CREATE POLICY "monitoring_update_apoyos"
ON solicitudes_apoyo_extraordinario FOR UPDATE
TO authenticated
USING (has_monitoring_write_role())
WITH CHECK (has_monitoring_write_role());
```

### 2. GastosAprobacionSection.tsx — Mostrar folio/notas en el dialog
Agregar el campo `notas` (folio) en la vista de detalle, entre "Motivo" y "Comprobante".

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar política UPDATE para `has_monitoring_write_role()` |
| `GastosAprobacionSection.tsx` | Mostrar campo `notas` (folio) en dialog de detalle |

